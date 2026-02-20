"""Kiwify sync service — fetches products and sales, indexes into UDS.

Data model:
  - Products → each product becomes one file (source_type='kiwify', source_id=product_id)
  - Sales → batched by date range into summary documents for search
"""

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import File, Chunk
from src.services.chunking import ChunkingService
from src.services.embeddings import get_embedding_service
from src.services.kiwify.client import KiwifyClient
from src.utils.logging import get_logger

logger = get_logger(__name__)


class KiwifySyncService:
    """Sync Kiwify products and sales into UDS for search."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.client = KiwifyClient()
        self.chunking = ChunkingService()
        self.embeddings = get_embedding_service()

    async def sync_all(self) -> dict[str, Any]:
        """Sync all products and recent sales."""
        products_result = await self.sync_products()
        sales_result = await self.sync_sales()
        return {
            "products": products_result,
            "sales": sales_result,
        }

    # ------------------------------------------------------------------
    # Products
    # ------------------------------------------------------------------
    async def sync_products(self) -> dict[str, Any]:
        """Fetch all products and index them."""
        data = await self.client.list_products()
        products = data.get("data", [])
        logger.info("Kiwify products fetched", count=len(products))

        synced = 0
        for product in products:
            try:
                await self._index_product(product)
                synced += 1
            except Exception as e:
                logger.error("Failed to index Kiwify product", error=str(e))

        return {"synced": synced, "total": len(products)}

    async def _index_product(self, product: dict) -> None:
        """Index a single Kiwify product."""
        product_id = product.get("id", "")
        name = product.get("name", "Produto sem nome")

        # Build searchable text from product data
        text_parts = [
            f"# Produto Kiwify: {name}",
            "",
            f"ID: {product_id}",
            f"Nome: {name}",
        ]

        if product.get("description"):
            text_parts.append(f"Descrição: {product['description']}")
        if product.get("price"):
            price = product["price"]
            if isinstance(price, (int, float)):
                text_parts.append(f"Preço: R$ {price / 100:.2f}")
            else:
                text_parts.append(f"Preço: {price}")
        if product.get("status"):
            text_parts.append(f"Status: {product['status']}")
        if product.get("type"):
            text_parts.append(f"Tipo: {product['type']}")

        full_text = "\n".join(text_parts)
        await self._upsert_file(
            source_id=f"product:{product_id}",
            name=name,
            path=f"/kiwify/produtos/{name}",
            content=full_text,
        )

    # ------------------------------------------------------------------
    # Sales
    # ------------------------------------------------------------------
    async def sync_sales(self, days: int = 90) -> dict[str, Any]:
        """Fetch recent sales and index them as searchable documents."""
        sales = await self.client.list_all_sales(days=days)
        logger.info("Kiwify sales fetched", count=len(sales))

        if not sales:
            return {"synced": 0, "total": 0}

        # Index each sale individually for granular search
        synced = 0
        for sale in sales:
            try:
                await self._index_sale(sale)
                synced += 1
            except Exception as e:
                logger.error("Failed to index Kiwify sale", error=str(e))

        return {"synced": synced, "total": len(sales)}

    async def _index_sale(self, sale: dict) -> None:
        """Index a single sale as a searchable document."""
        sale_id = sale.get("id", "")
        customer = sale.get("customer", {})
        product = sale.get("product", {})

        customer_name = customer.get("name", "")
        customer_email = customer.get("email", "")
        customer_phone = customer.get("mobile", "")
        product_name = product.get("name", "")
        status = sale.get("status", "")
        created_at = sale.get("created_at", "")

        text_parts = [
            f"# Venda Kiwify: {product_name}",
            "",
            f"Cliente: {customer_name}",
            f"Email: {customer_email}",
            f"Telefone: {customer_phone}",
            f"Produto: {product_name}",
            f"Status: {status}",
            f"Data: {created_at}",
            f"ID da Venda: {sale_id}",
        ]

        # Add payment info if available
        if sale.get("payment_method"):
            text_parts.append(f"Método de pagamento: {sale['payment_method']}")
        if sale.get("charges"):
            for charge in sale["charges"]:
                amount = charge.get("amount", 0)
                if isinstance(amount, (int, float)):
                    text_parts.append(f"Valor: R$ {amount / 100:.2f}")

        full_text = "\n".join(text_parts)
        await self._upsert_file(
            source_id=f"sale:{sale_id}",
            name=f"Venda - {customer_name} - {product_name}",
            path=f"/kiwify/vendas/{customer_name}/{product_name}",
            content=full_text,
        )

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------
    async def _upsert_file(
        self, source_id: str, name: str, path: str, content: str
    ) -> None:
        """Create or update a file + its chunks."""
        existing = await self.session.execute(
            select(File).where(File.source_type == "kiwify", File.source_id == source_id)
        )
        file_record = existing.scalar_one_or_none()

        now = datetime.now(timezone.utc)

        if file_record:
            file_record.name = name
            file_record.path = path
            file_record.modified_time = now
        else:
            file_record = File(
                account_id=None,
                source_type="kiwify",
                source_id=source_id,
                file_id=source_id,
                name=name,
                path=path,
                mime_type="text/kiwify",
                modified_time=now,
            )
            self.session.add(file_record)

        await self.session.commit()
        await self.session.refresh(file_record)

        # Delete old chunks
        await self.session.execute(
            delete(Chunk).where(Chunk.file_id == file_record.id)
        )

        # Chunk + embed
        chunks = self.chunking.chunk_text(content)
        if chunks:
            contents = [c.content for c in chunks]
            embeddings = await self.embeddings.embed_batch_async(contents)

            for chunk, embedding in zip(chunks, embeddings):
                self.session.add(
                    Chunk(
                        file_id=file_record.id,
                        chunk_index=chunk.index,
                        content=chunk.content,
                        start_offset=chunk.start_offset,
                        end_offset=chunk.end_offset,
                        heading=chunk.heading,
                        content_hash=chunk.content_hash,
                        embedding=embedding,
                    )
                )

        await self.session.commit()
