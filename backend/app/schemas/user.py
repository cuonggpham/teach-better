from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from app.models.user import UserRole, UserStatus


class UserBase(BaseModel):
    """
    Base user schema
    """
    name: str
    email: EmailStr


class UserCreate(UserBase):
    """
    User creation schema
    """
    password: str = Field(..., min_length=6)
    avatar_url: Optional[str] = None


class UserSignup(BaseModel):
    """
    User signup schema with password confirmation
    """
    email: EmailStr
    password: str = Field(..., min_length=8)
    password_confirm: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    """
    User update schema
    """
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    avatar_url: Optional[str] = None
    password: Optional[str] = Field(None, min_length=6)


class UserInDB(UserBase):
    """
    User in database schema
    """
    id: str = Field(..., alias="_id")
    avatar_url: Optional[str] = None
    role: UserRole
    status: UserStatus
    bookmarked_post_ids: List[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True


class User(UserInDB):
    """
    User response schema
    """
    pass


class UserLogin(BaseModel):
    """
    User login schema
    """
    email: EmailStr
    password: str


class Token(BaseModel):
    """
    Token response schema
    """
    access_token: str
    token_type: str = "bearer"
    user: User


class TokenData(BaseModel):
    """
    Token data schema
    """
    email: Optional[str] = None
