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
    is_read: bool
    created_at: datetime

    class Config:
        populate_by_name = True


class Notification(NotificationInDB):
    """
    Notification response schema
    """
    pass


class NotificationCount(BaseModel):
    """
    Notification count schema
    """
    count: int

