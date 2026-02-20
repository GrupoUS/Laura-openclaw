"""Asaas REST API client.

Authentication: access_token added to headers.
"""

from datetime import datetime
import httpx

from src.config import get_settings
from src.utils.logging import get_logger

logger = get_logger(__name__)

ASAAS_BASE = "https://api.asaas.com/v3"

class AsaasClient:
    """Async Asaas API client."""
    def __init__(self) -> None:
        settings = get_settings()
        self.api_key = settings.asaas_api_key

    async def _request(self, endpoint: str, params: dict | None = None) -> dict:
        """Make an authenticated GET request to the Asaas API."""
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(
                f"{ASAAS_BASE}{endpoint}",
                params=params or {},
                headers={
                    "access_token": self.api_key,
                },
            )
            resp.raise_for_status()
            return resp.json()

    async def list_customers(self, offset: int = 0, limit: int = 100) -> dict:
        return await self._request("/customers", {"offset": offset, "limit": limit})

    async def list_subscriptions(self, offset: int = 0, limit: int = 100) -> dict:
        return await self._request("/subscriptions", {"offset": offset, "limit": limit})
        
    async def list_payments(self, offset: int = 0, limit: int = 100) -> dict:
        return await self._request("/payments", {"offset": offset, "limit": limit})
