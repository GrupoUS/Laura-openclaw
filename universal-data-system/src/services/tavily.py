import os
import httpx
import logging

logger = logging.getLogger(__name__)

class TavilyService:
    """Service to interact with the Tavily AI search API."""
    
    def __init__(self):
        self.api_key = os.getenv("TAVILY_API_KEY")
        self.base_url = "https://api.tavily.com"
        
    async def search(self, query: str, search_depth: str = "basic", topic: str = "general", max_results: int = 5) -> dict:
        """Execute a search query against Tavily."""
        if not self.api_key:
            logger.warning("TAVILY_API_KEY is not set. Web search will fail.")
            return {"results": []}
            
        url = f"{self.base_url}/search"
        payload = {
            "api_key": self.api_key,
            "query": query,
            "search_depth": search_depth,
            "topic": topic,
            "max_results": max_results,
            "include_answer": False,
            "include_raw_content": False,
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=payload, timeout=15.0)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"Error calling Tavily API: {e}")
                return {"results": [], "error": str(e)}
