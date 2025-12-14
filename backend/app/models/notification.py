from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum
from app.models.user import PyObjectId


class NotificationType(str, Enum):
    NEW_ANSWER = "new_answer"
    NEW_COMMENT = "new_comment"
    REPORT_UPDATE = "report_update"
    POST_UPVOTE = "post_upvote"
    ANSWER_ACCEPTED = "answer_accepted"
    SYSTEM_NOTICE = "system_notice"
    ACCOUNT_BANNED = "account_banned"
    POST_DELETED = "post_deleted"
    REPORT_RESOLVED = "report_resolved"


class NotificationModel(BaseModel):
    """
    Notification database model
    """
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: PyObjectId = Field(..., index=True)
    actor_id: Optional[PyObjectId] = Field(default=None)  # User who triggered the notification
    type: NotificationType
    message: str
    link: Optional[str] = None
    is_read: bool = Field(default=False, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={
            PyObjectId: str,
            datetime: lambda v: v.isoformat()
        }
    )

