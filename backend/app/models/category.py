from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from app.models.user import PyObjectId


class CategoryModel(BaseModel):
    """
    Category database model - Broad subject-based classification
    Examples: Toán học, Tiếng Anh, Vật lý, Hóa học, Lập trình, etc.
    """
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    name: str = Field(..., index=True, unique=True)  # Subject name like "Toán học", "Tiếng Anh"
    description: Optional[str] = None  # Brief description of the subject area
    post_count: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={
            PyObjectId: str,
            datetime: lambda v: v.isoformat()
        }
    )
