"""Asaas sync service - fetches customers, subscriptions, and payments."""

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import File, Chunk
from src.services.chunking import ChunkingService
from src.services.embeddings import get_embedding_service
from src.services.asaas.client import AsaasClient
from src.utils.logging import get_logger

logger = get_logger(__name__)

class AsaasSyncService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.client = AsaasClient()
        self.chunking = ChunkingService()
        self.embeddings = get_embedding_service()

    async def sync_all(self) -> dict[str, Any]:
        cust_result = await self.sync_customers()
        subs_result = await self.sync_subscriptions()
        pay_result = await self.sync_payments()
        return {
            "customers": cust_result,
            "subscriptions": subs_result,
            "payments": pay_result,
        }

    async def sync_customers(self) -> dict[str, Any]:
        synced = 0
        offset = 0
        while True:
            data = await self.client.list_customers(offset=offset)
            items = data.get("data", [])
            if not items:
                break
            for item in items:
                try:
                    await self._index_customer(item)
                    synced += 1
                except Exception as e:
                    logger.error("Failed to index Asaas customer", error=str(e))
                    
            if not data.get("hasMore"):
                break
            offset += data.get("limit", 100)

        return {"synced": synced}

    async def _index_customer(self, customer: dict) -> None:
        c_id = customer.get("id", "")
        name = customer.get("name", "Sem Nome")
        
        text_parts = [
            f"# Cliente Asaas: {name}",
            "",
            f"ID: {c_id}",
            f"Nome: {name}",
            f"Email: {customer.get('email', '')}",
            f"Telefone: {customer.get('phone', '')} / {customer.get('mobilePhone', '')}",
            f"CPF/CNPJ: {customer.get('cpfCnpj', '')}"
        ]
        
        full_text = "\n".join(text_parts)
        await self._upsert_file(
            source_id=f"customer:{c_id}",
            name=name,
            path=f"/asaas/clientes/{name}",
            content=full_text,
        )

    async def sync_subscriptions(self) -> dict[str, Any]:
        synced = 0
        offset = 0
        while True:
            data = await self.client.list_subscriptions(offset=offset)
            items = data.get("data", [])
            if not items:
                break
            for item in items:
                try:
                    await self._index_subscription(item)
                    synced += 1
                except Exception as e:
                    logger.error("Failed to index Asaas subscription", error=str(e))
                    
            if not data.get("hasMore"):
                break
            offset += data.get("limit", 100)

        return {"synced": synced}

    async def _index_subscription(self, sub: dict) -> None:
        sub_id = sub.get("id", "")
        customer = sub.get("customer", "")
        status = sub.get("status", "")
        value = sub.get("value", 0)
        text_parts = [
            f"# Assinatura Asaas",
            "",
            f"ID: {sub_id}",
            f"Cliente ID: {customer}",
            f"Valor: R$ {value}",
            f"Status: {status}",
            f"Data de Criação: {sub.get('dateCreated', '')}",
        ]
        full_text = "\n".join(text_parts)
        await self._upsert_file(
            source_id=f"subscription:{sub_id}",
            name=f"Assinatura {sub_id}",
            path=f"/asaas/assinaturas/{sub_id}",
            content=full_text,
        )

    async def sync_payments(self) -> dict[str, Any]:
        synced = 0
        offset = 0
        while True:
            data = await self.client.list_payments(offset=offset)
            items = data.get("data", [])
            if not items:
                break
            for item in items:
                try:
                    await self._index_payment(item)
                    synced += 1
                except Exception as e:
                    logger.error("Failed to index Asaas payment", error=str(e))
                    
            if not data.get("hasMore"):
                break
            offset += data.get("limit", 100)

        return {"synced": synced}

    async def _index_payment(self, payment: dict) -> None:
        pay_id = payment.get("id", "")
        customer = payment.get("customer", "")
        status = payment.get("status", "")
        value = payment.get("value", 0)
        net_value = payment.get("netValue", 0)
        text_parts = [
            f"# Cobrança Asaas",
            "",
            f"ID: {pay_id}",
            f"Cliente ID: {customer}",
            f"Valor: R$ {value}",
            f"Valor Líquido: R$ {net_value}",
            f"Status: {status}",
            f"Vencimento: {payment.get('dueDate', '')}",
            f"Forma de Pagamento: {payment.get('billingType', '')}"
        ]
        full_text = "\n".join(text_parts)
        await self._upsert_file(
            source_id=f"payment:{pay_id}",
            name=f"Cobrança {pay_id}",
            path=f"/asaas/cobrancas/{pay_id}",
            content=full_text,
        )

    async def _upsert_file(self, source_id: str, name: str, path: str, content: str) -> None:
        existing = await self.session.execute(
            select(File).where(File.source_type == "asaas", File.source_id == source_id)
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
                source_type="asaas",
                source_id=source_id,
                file_id=source_id,
                name=name,
                path=path,
                mime_type="text/asaas",
                modified_time=now,
            )
            self.session.add(file_record)

        await self.session.commit()
        await self.session.refresh(file_record)

        await self.session.execute(delete(Chunk).where(Chunk.file_id == file_record.id))

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
