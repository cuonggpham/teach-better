from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class CommentSchema(BaseModel):
    """
    Comment schema
    """
    id: str
    author_id: str
    author_name: Optional[str] = None
    content: str
    created_at: datetime

    class Config:
        populate_by_name = True


class CommentCreate(BaseModel):
    """
    Comment creation schema
    """
    content: str = Field(..., min_length=1)


class VotesSchema(BaseModel):
    """
    Votes schema
    """
    upvoted_by: List[str] = Field(default_factory=list)
    downvoted_by: List[str] = Field(default_factory=list)
    score: int = 0


class AnswerBase(BaseModel):
    """
    Base answer schema
    """
    content: str = Field(..., min_length=10)


class AnswerCreate(AnswerBase):
    """
    Answer creation schema
    """
    post_id: str


class AnswerUpdate(BaseModel):
    """
    Answer update schema
    """
    content: Optional[str] = Field(None, min_length=10)
    is_accepted_solution: Optional[bool] = None


class AnswerInDB(AnswerBase):
    """
    Answer in database schema
    """
    id: str = Field(..., alias="_id")
    post_id: str
    author_id: str
    is_accepted_solution: bool
    votes: VotesSchema
    comments: List[CommentSchema] = Field(default_factory=list)
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True


class Answer(AnswerInDB):
    """
    Answer response schema
    """
    pass


class AnswerWithAuthor(Answer):
    """
    Answer with author info
    """
    author: Optional[dict] = None


class AnswerVote(BaseModel):
    """
    Answer vote action schema
    """
    vote_type: str = Field(..., pattern="^(upvote|downvote|remove)$")

