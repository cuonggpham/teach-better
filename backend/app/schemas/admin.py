from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole, UserStatus
from app.schemas.user import User


class AdminUserUpdate(BaseModel):
    """
    Schema for admin to update user information
    """
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None


class AdminChangeRole(BaseModel):
    """
    Schema for admin to change user role
    """
    role: UserRole = Field(..., description="New role for the user")


class UserListResponse(BaseModel):
    """
    Response schema for user list with pagination
    """
    users: List[User]
    total: int
    skip: int
    limit: int


class UserDetailResponse(BaseModel):
    """
    Response schema for user detail
    """
    user: User
