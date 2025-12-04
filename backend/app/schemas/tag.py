from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class TagBase(BaseModel):
    """
    Base tag schema
    """
    name: str
    description: Optional[str] = None


class TagCreate(TagBase):
    """
    Tag creation schema
    """
    pass


class TagUpdate(BaseModel):
    """
    Tag update schema
    """
    name: Optional[str] = None
    description: Optional[str] = None


class TagInDB(TagBase):
    """
    Tag in database schema
    """
    id: str = Field(..., alias="_id")
    post_count: int
    created_by: str
    created_at: datetime

    class Config:
        populate_by_name = True


class Tag(TagInDB):
    """
    Tag response schema
    """
    pass


class TagResponse(TagInDB):
    """
    Tag response schema for admin API
    """
    is_active: Optional[bool] = True


class TagWithPosts(Tag):
    """
    Tag with posts info
    """
    recent_posts: list = Field(default_factory=list)

