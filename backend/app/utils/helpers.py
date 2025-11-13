from datetime import datetime
from typing import Any, Dict
from bson import ObjectId
import re


def validate_email_format(email: str) -> bool:
    """
    Validate email format
    Email must contain @ and have a valid domain after it
    """
    pattern = r'^[^@]+@[^@]+\.[^@]+$'
    return bool(re.match(pattern, email))


def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validate password strength according to requirements:
    - Minimum 8 characters
    - Must not contain " or ' characters
    - Must include at least 2 of 3 character types: letters, numbers, symbols
    
    Returns:
        tuple: (is_valid, error_message)
    """
    # Check minimum length
    if len(password) < 8:
        return False, "auth.password_min_length"
    
    # Check for forbidden characters
    if '"' in password or "'" in password:
        return False, "auth.password_invalid_chars"
    
    # Count character types
    has_letter = bool(re.search(r'[a-zA-Z]', password))
    has_digit = bool(re.search(r'\d', password))
    has_symbol = bool(re.search(r'[^a-zA-Z0-9"\']', password))
    
    character_types = sum([has_letter, has_digit, has_symbol])
    
    if character_types < 2:
        return False, "auth.password_weak"
    
    return True, ""


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
