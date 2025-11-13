from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.user import PyObjectId


class TagModel(BaseModel):
    """
    Tag database model
    """
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    name: str = Field(..., index=True)
    description: Optional[str] = None
    post_count: int = Field(default=0)
    created_by: PyObjectId
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            PyObjectId: str,
            datetime: lambda v: v.isoformat()
        }

