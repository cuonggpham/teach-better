from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class PostBase(BaseModel):
    """
    Base post schema
    """
    title: str
    content: str
    category: Optional[str] = None
    tag_ids: List[str] = Field(default_factory=list, max_length=5)


class PostCreate(PostBase):
    """
    Post creation schema
    """
    pass


class PostUpdate(BaseModel):
    """
    Post update schema
    """
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    tag_ids: Optional[List[str]] = Field(None, max_length=5)


class PostInDB(PostBase):
    """
    Post in database schema
    """
    id: str = Field(..., alias="_id")
    author_id: str
    answer_count: int
    view_count: int
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True


class Post(PostInDB):
    """
    Post response schema
    """
    pass


class PostWithAuthor(Post):
    """
    Post with author info
    """
    author: Optional[dict] = None
    tags: List[dict] = Field(default_factory=list)


class PostList(BaseModel):
    """
    List of posts
    """
    posts: List[Post]
    total: int

