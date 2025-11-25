from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from bson import ObjectId
from app.models.user import PyObjectId
from app.models.post import VotesModel


class CommentModel(BaseModel):
    """
    Comment sub-model embedded in answers
    """
    id: PyObjectId = Field(default_factory=lambda: str(ObjectId()))
    author_id: PyObjectId
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AnswerModel(BaseModel):
    """
    Answer database model
    """
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    post_id: PyObjectId = Field(..., index=True)
    author_id: PyObjectId = Field(..., index=True)
    content: str  # rich text/markdown
    is_accepted_solution: bool = Field(default=False)
    votes: VotesModel = Field(default_factory=VotesModel)
    comments: List[CommentModel] = Field(default_factory=list)
    is_deleted: bool = Field(default=False)
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

