"""
Database helper utilities
"""
from typing import Optional, List, Dict, Any
from bson import ObjectId
from datetime import datetime


def str_to_objectid(id_str: str) -> Optional[ObjectId]:
    """
    Convert string to ObjectId safely
    """
    try:
        return ObjectId(id_str) if ObjectId.is_valid(id_str) else None
    except Exception:
        return None


def objectid_to_str(obj_id: ObjectId) -> str:
    """
    Convert ObjectId to string
    """
    return str(obj_id)


def serialize_document(doc: Dict[str, Any]) -> Dict[str, Any]:
    """
    Serialize MongoDB document for JSON response
    Converts ObjectId to string and datetime to ISO format
    """
    if doc is None:
        return None
    
    serialized = {}
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            serialized[key] = str(value)
        elif isinstance(value, datetime):
            serialized[key] = value.isoformat()
        elif isinstance(value, list):
            serialized[key] = [serialize_document(item) if isinstance(item, dict) else item for item in value]
        elif isinstance(value, dict):
            serialized[key] = serialize_document(value)
        else:
            serialized[key] = value
    
    return serialized


def serialize_documents(docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Serialize list of MongoDB documents
    """
    return [serialize_document(doc) for doc in docs]


def build_pagination_query(
    page: int = 1,
    page_size: int = 20,
    sort_by: str = "created_at",
    sort_order: int = -1
) -> Dict[str, Any]:
    """
    Build pagination query parameters
    
    Args:
        page: Page number (1-indexed)
        page_size: Number of items per page
        sort_by: Field to sort by
        sort_order: 1 for ascending, -1 for descending
    
    Returns:
        Dict with skip, limit, and sort parameters
    """
    skip = (page - 1) * page_size
    return {
        "skip": skip,
        "limit": page_size,
        "sort": [(sort_by, sort_order)]
    }


def build_search_query(
    search_term: Optional[str] = None,
    fields: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Build text search query
    
    Args:
        search_term: Search term
        fields: List of fields to search in
    
    Returns:
        MongoDB query dict
    """
    if not search_term or not fields:
        return {}
    
    return {
        "$or": [
            {field: {"$regex": search_term, "$options": "i"}}
            for field in fields
        ]
    }


def build_filter_query(filters: Dict[str, Any]) -> Dict[str, Any]:
    """
    Build filter query from dict
    
    Args:
        filters: Dict of field: value pairs
    
    Returns:
        MongoDB query dict
    """
    query = {}
    for key, value in filters.items():
        if value is not None:
            if isinstance(value, str) and ObjectId.is_valid(value):
                query[key] = ObjectId(value)
            elif isinstance(value, list):
                # Convert string IDs to ObjectId for list fields
                query[key] = {
                    "$in": [
                        ObjectId(v) if isinstance(v, str) and ObjectId.is_valid(v) else v
                        for v in value
                    ]
                }
            else:
                query[key] = value
    
    return query


class PaginationResult:
    """
    Pagination result wrapper
    """
    def __init__(
        self,
        items: List[Any],
        total: int,
        page: int,
        page_size: int
    ):
        self.items = items
        self.total = total
        self.page = page
        self.page_size = page_size
        self.total_pages = (total + page_size - 1) // page_size
        self.has_next = page < self.total_pages
        self.has_prev = page > 1
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert to dict for JSON response
        """
        return {
            "items": self.items,
            "pagination": {
                "total": self.total,
                "page": self.page,
                "page_size": self.page_size,
                "total_pages": self.total_pages,
                "has_next": self.has_next,
                "has_prev": self.has_prev
            }
        }


async def get_paginated_results(
    collection,
    query: Dict[str, Any],
    page: int = 1,
    page_size: int = 20,
    sort_by: str = "created_at",
    sort_order: int = -1
) -> PaginationResult:
    """
    Get paginated results from collection
    
    Args:
        collection: MongoDB collection
        query: Query dict
        page: Page number
        page_size: Items per page
        sort_by: Sort field
        sort_order: Sort order (1 or -1)
    
    Returns:
        PaginationResult object
    """
    # Get total count
    total = await collection.count_documents(query)
    
    # Get paginated items
    pagination_params = build_pagination_query(page, page_size, sort_by, sort_order)
    cursor = collection.find(query).skip(pagination_params["skip"]).limit(pagination_params["limit"])
    
    if pagination_params["sort"]:
        cursor = cursor.sort(pagination_params["sort"])
    
    items = await cursor.to_list(length=page_size)
    
    return PaginationResult(
        items=serialize_documents(items),
        total=total,
        page=page,
        page_size=page_size
    )

