from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.notification import NotificationType


class NotificationBase(BaseModel):
    """
    Base notification schema
    """
    type: NotificationType
    message: str
    link: Optional[str] = None


class NotificationCreate(NotificationBase):
    """
    Notification creation schema
    """
    user_id: str
    actor_id: Optional[str] = None  # User who triggered the notification


class NotificationUpdate(BaseModel):
    """
    Notification update schema
    """
    is_read: Optional[bool] = None


class NotificationInDB(NotificationBase):
    """
    Notification in database schema
    """
    id: str = Field(..., alias="_id")
    user_id: str
    actor_id: Optional[str] = None  # User who triggered the notification
    is_read: bool
    created_at: datetime

    class Config:
        populate_by_name = True


class Notification(NotificationInDB):
    """
    Notification response schema with actor info
    """
    actor_name: Optional[str] = None
    actor_avatar: Optional[str] = None


class NotificationCount(BaseModel):
    """
    Notification count schema
    """
    count: int

