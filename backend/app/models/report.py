from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum
from app.models.user import PyObjectId


class ReportType(str, Enum):
    USER = "user"
    POST = "post"
    ANSWER = "answer"
    COMMENT = "comment"


class ReasonCategory(str, Enum):
    SPAM = "spam"
    INAPPROPRIATE = "inappropriate"
    HARASSMENT = "harassment"
    OFFENSIVE = "offensive"
    MISLEADING = "misleading"
    OTHER = "other"


class ReportStatus(str, Enum):
    PENDING = "pending"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


class ActionTaken(str, Enum):
    WARNED = "warned"
    LOCKED_USER = "locked_user"
    DELETED_CONTENT = "deleted_content"
    NO_ACTION = "no_action"


class ResolutionModel(BaseModel):
    """
    Resolution sub-model for report processing
    """
    admin_id: Optional[PyObjectId] = None
    action_taken: Optional[ActionTaken] = None
    notes: Optional[str] = None
    resolved_at: Optional[datetime] = None


class ReportModel(BaseModel):
    """
    Report database model
    """
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    reporter_id: PyObjectId = Field(..., index=True)
    report_type: ReportType
    target_id: PyObjectId = Field(..., index=True)  # Dynamic reference
    reason_category: ReasonCategory
    reason_detail: str = Field(..., min_length=20)
    evidence_url: Optional[str] = None
    status: ReportStatus = Field(default=ReportStatus.PENDING)
    resolution: Optional[ResolutionModel] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={
            PyObjectId: str,
            datetime: lambda v: v.isoformat()
        }
    )

