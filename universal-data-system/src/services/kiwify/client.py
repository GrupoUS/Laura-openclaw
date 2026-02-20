"""Kiwify REST API client — Python port of the existing Node.js client.

OAuth flow:
  POST /v1/oauth/token  →  Bearer token (expires in ~96h)
  All subsequent requests use Bearer + x-kiwify-account-id header.
"""

from datetime import datetime, timedelta

import httpx

from src.config import get_settings
from src.utils.logging import get_logger

logger = get_logger(__name__)

KIWIFY_BASE = "https://public-api.kiwify.com"


class KiwifyClient:
    """Async Kiwify API client with automatic OAuth token management."""

    def __init__(self) -> None:
        settings = get_settings()
        self.client_id = settings.kiwify_client_id
        self.client_secret = settings.kiwify_client_secret
        self.account_id = settings.kiwify_account_id
        self._token: str | None = None
        self._token_expiry: datetime | None = None

    async def _ensure_token(self) -> str:
        """Get a valid OAuth token, refreshing if necessary."""
        if self._token and self._token_expiry and datetime.utcnow() < self._token_expiry:
            return self._token

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                f"{KIWIFY_BASE}/v1/oauth/token",
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            resp.raise_for_status()
            data = resp.json()

        self._token = data["access_token"]
        expires_in = data.get("expires_in", 345600)  # default 96h
        self._token_expiry = datetime.utcnow() + timedelta(seconds=expires_in - 60)
        logger.info("Kiwify token refreshed", expires_in=expires_in)
        return self._token

    async def _request(self, endpoint: str, params: dict | None = None) -> dict:
        """Make an authenticated GET request to the Kiwify API."""
        token = await self._ensure_token()
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(
                f"{KIWIFY_BASE}/v1{endpoint}",
                params=params or {},
                headers={
                    "Authorization": f"Bearer {token}",
                    "x-kiwify-account-id": self.account_id,
                },
            )
            resp.raise_for_status()
            return resp.json()

    # ----------------------------------------------------------------
    # Products
    # ----------------------------------------------------------------
    async def list_products(self, page: int = 1, page_size: int = 100) -> dict:
        """List all products."""
        return await self._request("/products", {
            "page_number": page,
            "page_size": page_size,
        })

    async def get_product(self, product_id: str) -> dict:
        """Get a single product by ID."""
        return await self._request(f"/products/{product_id}")

    # ----------------------------------------------------------------
    # Sales
    # ----------------------------------------------------------------
    async def list_sales(
        self,
        start_date: str,
        end_date: str,
        page: int = 1,
        page_size: int = 100,
    ) -> dict:
        """List sales in a date range (YYYY-MM-DD)."""
        return await self._request("/sales", {
            "start_date": start_date,
            "end_date": end_date,
            "page_number": page,
            "page_size": page_size,
        })

    async def list_all_sales(self, days: int = 90) -> list[dict]:
        """Paginate through all sales for the last N days."""
        end = datetime.utcnow().strftime("%Y-%m-%d")
        start = (datetime.utcnow() - timedelta(days=days)).strftime("%Y-%m-%d")

        all_sales: list[dict] = []
        page = 1

        while True:
            data = await self.list_sales(start, end, page=page)
            items = data.get("data", [])
            if not items:
                break
            all_sales.extend(items)
            # Check pagination
            pagination = data.get("pagination", {})
            if page >= pagination.get("last_page", page):
                break
            page += 1

        return all_sales
