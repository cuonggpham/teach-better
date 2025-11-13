from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.report import (
    ReportType,
    ReasonCategory,
    ReportStatus,
    ActionTaken
)


class ResolutionSchema(BaseModel):
    """
    Resolution schema
    """
    admin_id: Optional[str] = None
    action_taken: Optional[ActionTaken] = None
    notes: Optional[str] = None
    resolved_at: Optional[datetime] = None


class ReportBase(BaseModel):
    """
    Base report schema
    """
    report_type: ReportType
    target_id: str
    reason_category: ReasonCategory
    reason_detail: str = Field(..., min_length=20)
    evidence_url: Optional[str] = None


class ReportCreate(ReportBase):
    """
    Report creation schema
    """
    pass


class ReportUpdate(BaseModel):
    """
    Report update schema (for admin)
    """
    status: Optional[ReportStatus] = None
    resolution: Optional[ResolutionSchema] = None


class ReportResolve(BaseModel):
    """
    Report resolution schema
    """
    action_taken: ActionTaken
    notes: Optional[str] = None


class ReportInDB(ReportBase):
    """
    Report in database schema
    """
    id: str = Field(..., alias="_id")
    reporter_id: str
    status: ReportStatus
    resolution: Optional[ResolutionSchema] = None
    created_at: datetime

    class Config:
        populate_by_name = True


class Report(ReportInDB):
    """
    Report response schema
    """
    pass


class ReportWithDetails(Report):
    """
    Report with additional details
    """
    reporter: Optional[dict] = None
    target_details: Optional[dict] = None

