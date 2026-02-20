import logging
from typing import Any, List, Optional
from uuid import UUID

from src.services.search import _get_asyncpg_pool

logger = logging.getLogger(__name__)

class OntologyService:
    """Service for interacting with Ontology Entities and Relations using asyncpg."""

    async def create_entity(self, type: str, properties: dict) -> dict[str, Any]:
        pool = await _get_asyncpg_pool()
        query = """
            INSERT INTO ontology_entities (type, properties)
            VALUES ($1, $2)
            RETURNING *
        """
        import json
        async with pool.acquire() as conn:
            row = await conn.fetchrow(query, type, json.dumps(properties))
        return dict(row) if row else {}

    async def get_entity(self, entity_id: UUID) -> dict[str, Any]:
        pool = await _get_asyncpg_pool()
        query = """
            SELECT * FROM ontology_entities WHERE id = $1
        """
        async with pool.acquire() as conn:
            row = await conn.fetchrow(query, entity_id)
        return dict(row) if row else {}

    async def query_entities(self, type: Optional[str] = None, properties_filter: Optional[dict] = None) -> List[dict[str, Any]]:
        pool = await _get_asyncpg_pool()
        query = "SELECT * FROM ontology_entities WHERE 1=1"
        args = []
        if type:
            args.append(type)
            query += f" AND type = ${len(args)}"
        if properties_filter:
            args.append(properties_filter) # Wait, asyncpg requires JSONB cast or proper syntax for subsets.
            query += f" AND properties @> ${len(args)}::jsonb"
            
        import json
        if properties_filter:
            args[-1] = json.dumps(properties_filter)
            
        async with pool.acquire() as conn:
            rows = await conn.fetch(query, *args)
        return [dict(row) for row in rows]

    async def create_relation(self, from_id: UUID, relation_type: str, to_id: UUID, properties: dict = None) -> dict[str, Any]:
        pool = await _get_asyncpg_pool()
        query = """
            INSERT INTO ontology_relations (from_id, relation_type, to_id, properties)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        """
        import json
        async with pool.acquire() as conn:
            row = await conn.fetchrow(query, from_id, relation_type, to_id, json.dumps(properties or {}))
        return dict(row) if row else {}

    async def get_related(self, entity_id: UUID, relation_type: Optional[str] = None, direction: str = "both") -> List[dict[str, Any]]:
        pool = await _get_asyncpg_pool()
        
        args = [entity_id]
        where_clause = []
        if direction == "out" or direction == "both":
            where_clause.append("from_id = $1")
        if direction == "in" or direction == "both":
            where_clause.append("to_id = $1")
            
        joined_where = " OR ".join(where_clause)
        
        query = f"SELECT * FROM ontology_relations WHERE ({joined_where})"
        
        if relation_type:
            args.append(relation_type)
            query += f" AND relation_type = $2"
            
        async with pool.acquire() as conn:
            rows = await conn.fetch(query, *args)
            
        return [dict(row) for row in rows]
