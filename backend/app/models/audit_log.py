from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from bson import ObjectId
from enum import Enum

from app.models.user import PyObjectId


class AuditAction(str, Enum):
    """
    Audit log action types
    """
    USER_CREATED = "user_created"
    USER_UPDATED = "user_updated"
    USER_DELETED = "user_deleted"
    USER_LOCKED = "user_locked"
    USER_UNLOCKED = "user_unlocked"
    ROLE_CHANGED = "role_changed"
    STATUS_CHANGED = "status_changed"


class AuditLogModel(BaseModel):
    """
    Audit log database model for tracking admin actions
    """
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    admin_id: PyObjectId  # ID of admin who performed the action
    admin_email: str  # Email of admin for easier tracking
    target_user_id: PyObjectId  # ID of user being affected
    target_user_email: str  # Email of target user
    action: AuditAction  # Type of action performed
    old_value: Optional[Dict[str, Any]] = None  # Previous value (for updates)
    new_value: Optional[Dict[str, Any]] = None  # New value (for updates)
    ip_address: Optional[str] = None  # IP address of admin
    user_agent: Optional[str] = None  # User agent of admin
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }
    )
