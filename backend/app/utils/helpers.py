from datetime import datetime
from typing import Any, Dict
from bson import ObjectId


def serialize_object_id(obj: Any) -> Any:
    """
    Recursively convert ObjectId to string in dictionaries and lists
    """
    if isinstance(obj, ObjectId):
        return str(obj)
    elif isinstance(obj, dict):
        return {key: serialize_object_id(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [serialize_object_id(item) for item in obj]
    return obj


def serialize_datetime(obj: Any) -> Any:
    """
    Recursively convert datetime to ISO format string
    """
    if isinstance(obj, datetime):
        return obj.isoformat()
    elif isinstance(obj, dict):
        return {key: serialize_datetime(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [serialize_datetime(item) for item in obj]
    return obj


def prepare_db_document(document: Dict[str, Any]) -> Dict[str, Any]:
    """
    Prepare document for database insertion
    """
    if "_id" in document and isinstance(document["_id"], str):
        document["_id"] = ObjectId(document["_id"])
    return document


def prepare_response_document(document: Dict[str, Any]) -> Dict[str, Any]:
    """
    Prepare document for API response
    """
    document = serialize_object_id(document)
    document = serialize_datetime(document)
    if "_id" in document:
        document["id"] = document.pop("_id")
    return document
