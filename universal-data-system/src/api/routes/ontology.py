from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from src.services.ontology import OntologyService

router = APIRouter(prefix="/ontology", tags=["ontology"])
ontology_service = OntologyService()

class EntityCreate(BaseModel):
    type: str
    properties: Dict[str, Any] = {}

class EntityQuery(BaseModel):
    type: Optional[str] = None
    properties_filter: Optional[Dict[str, Any]] = None

class RelationCreate(BaseModel):
    from_id: UUID
    relation_type: str
    to_id: UUID
    properties: Dict[str, Any] = {}

@router.post("/entities")
async def create_entity(entity: EntityCreate):
    try:
        result = await ontology_service.create_entity(entity.type, entity.properties)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/entities/query")
async def query_entities(query: EntityQuery):
    try:
        results = await ontology_service.query_entities(query.type, query.properties_filter)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/entities/{entity_id}")
async def get_entity(entity_id: UUID):
    try:
        result = await ontology_service.get_entity(entity_id)
        if not result:
            raise HTTPException(status_code=404, detail="Entity not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/relations")
async def create_relation(relation: RelationCreate):
    try:
        result = await ontology_service.create_relation(
            relation.from_id, relation.relation_type, relation.to_id, relation.properties
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/entities/{entity_id}/related")
async def get_related(entity_id: UUID, relation_type: Optional[str] = None, direction: str = "both"):
    try:
        results = await ontology_service.get_related(entity_id, relation_type, direction)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
