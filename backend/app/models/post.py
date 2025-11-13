from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum
from app.models.user import PyObjectId


class PostStatus(str, Enum):
    OPEN = "open"
    RESOLVED = "resolved"


class VotesModel(BaseModel):
    """
    Votes sub-model for posts and answers
    """
    upvoted_by: List[PyObjectId] = Field(default_factory=list)
    downvoted_by: List[PyObjectId] = Field(default_factory=list)
    score: int = Field(default=0)


class PostModel(BaseModel):
    """
    Post database model
    """
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    title: str = Field(..., index=True)
    content: str  # rich text/markdown
    author_id: PyObjectId = Field(..., index=True)
    tag_ids: List[PyObjectId] = Field(default_factory=list, max_length=5)
    status: PostStatus = Field(default=PostStatus.OPEN)
    votes: VotesModel = Field(default_factory=VotesModel)
    answer_count: int = Field(default=0)
    view_count: int = Field(default=0)
    is_deleted: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            PyObjectId: str,
            datetime: lambda v: v.isoformat()
        }

