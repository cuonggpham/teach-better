from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    """
    Base user schema
    """
    email: EmailStr
    username: str
    full_name: Optional[str] = None


class UserCreate(UserBase):
    """
    User creation schema
    """
    password: str = Field(..., min_length=6)


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
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    password: Optional[str] = Field(None, min_length=6)


class UserInDB(UserBase):
    """
    User in database schema
    """
    id: str = Field(..., alias="_id")
    is_active: bool = True
    is_superuser: bool = False
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


class TokenData(BaseModel):
    """
    Token data schema
    """
    email: Optional[str] = None
