"""
Global Search API Endpoint
==========================
Unified multi-attribute fuzzy search across Phone numbers, Vehicle license plates,
Bank accounts, Suspect names, and Known Aliases.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from app.schemas.common import ResponseEnvelope
from app.services import graph_analytics
from app.api.deps import require_role
from app.models.user import User, UserRole

router = APIRouter()
_any_officer = require_role(UserRole.INVESTIGATOR, UserRole.ANALYST, UserRole.ADMIN)


@router.get(
    "/entities",
    response_model=ResponseEnvelope,
    summary="Global Entity Search (Phone, Vehicle, Account, Name, Aliases)",
)
def search_entities(
    q: str = Query(..., min_length=1, description="Search query string"),
    entity_type: Optional[str] = Query(None, description="Optional entity type filter (Person, Phone, Vehicle, FinancialAccount, Location)"),
    limit: int = Query(30, ge=1, le=100, description="Maximum number of search matches to return"),
    current_user: User = Depends(_any_officer),
):
    """
    Search entities across all indexed fields using token-based fuzzy matching
    and exact prefix matching for structured identifiers.
    """
    try:
        results = graph_analytics.search_entities(query=q, entity_type=entity_type, limit=limit)
        return ResponseEnvelope(
            success=True,
            message=f"Found {len(results)} matching entity/entities for query '{q}'.",
            data=results,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

