from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class CategoryBase(BaseModel):
    """
    Base category schema
    """
    name: str
    description: Optional[str] = None


class CategoryCreate(CategoryBase):
    """
    Category creation schema
    """
    pass


class CategoryUpdate(BaseModel):
    """
    Category update schema
    """
    name: Optional[str] = None
    description: Optional[str] = None


class CategoryInDB(CategoryBase):
    """
    Category in database schema
    """
    id: str = Field(..., alias="_id")
    post_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True


class Category(CategoryInDB):
    """
    Category response schema
    """
    pass


class CategoryResponse(CategoryInDB):
    """
    Category response schema for admin API
    """
    is_active: Optional[bool] = True


class CategoryList(BaseModel):
    """
    List of categories
    """
    categories: List[Category]
    total: int
