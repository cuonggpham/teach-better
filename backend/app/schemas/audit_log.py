from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

from app.models.audit_log import AuditAction


class AuditLogBase(BaseModel):
    """
    Base audit log schema
    """
    action: AuditAction
    target_user_email: str
    old_value: Optional[Dict[str, Any]] = None
    new_value: Optional[Dict[str, Any]] = None


class AuditLogCreate(AuditLogBase):
    """
    Audit log creation schema (used internally by service)
    """
    admin_id: str
    admin_email: str
    target_user_id: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None


class AuditLog(BaseModel):
    """
    Audit log response schema
    """
    id: str = Field(..., alias="_id")
    admin_id: str
    admin_email: str
    target_user_id: str
    target_user_email: str
    action: AuditAction
    old_value: Optional[Dict[str, Any]] = None
    new_value: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime

    class Config:
        populate_by_name = True


class AuditLogList(BaseModel):
    """
    Audit log list response schema
    """
    logs: list[AuditLog]
    total: int
    skip: int
    limit: int
