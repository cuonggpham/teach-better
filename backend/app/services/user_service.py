from typing import Optional, List
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.models.user import UserModel, UserStatus
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password


class UserService:
    """
    User service for database operations
    """
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db.users
    
    async def create_user(self, user_data: UserCreate) -> UserModel:
        """
        Create a new user
        """
        user_dict = user_data.model_dump()
        user_dict["hashed_password"] = get_password_hash(user_dict.pop("password"))
        user_dict["created_at"] = datetime.utcnow()
        user_dict["updated_at"] = datetime.utcnow()
        user_dict["is_active"] = True
        user_dict["is_superuser"] = False
        
        result = await self.collection.insert_one(user_dict)
        user_dict["_id"] = result.inserted_id
        
        return UserModel(**user_dict)
    
    async def get_user_by_id(self, user_id: str) -> Optional[UserModel]:
        """
        Get user by ID
        """
        if not ObjectId.is_valid(user_id):
            return None
        
        user = await self.collection.find_one({"_id": ObjectId(user_id)})
        if user:
            return UserModel(**user)
        return None
    
    async def get_user_by_email(self, email: str) -> Optional[UserModel]:
        """
        Get user by email
        """
        user = await self.collection.find_one({"email": email})
        if user:
            return UserModel(**user)
        return None
    
    async def get_user_by_username(self, username: str) -> Optional[UserModel]:
        """
        Get user by username
        """
        user = await self.collection.find_one({"username": username})
        if user:
            return UserModel(**user)
        return None
    
    async def get_users(self, skip: int = 0, limit: int = 100) -> List[UserModel]:
        """
        Get list of users
        """
        cursor = self.collection.find().skip(skip).limit(limit)
        users = await cursor.to_list(length=limit)
        return [UserModel(**user) for user in users]
    
    async def update_user(self, user_id: str, user_data: UserUpdate) -> Optional[UserModel]:
        """
        Update user
        """
        if not ObjectId.is_valid(user_id):
            return None
        
        update_dict = {k: v for k, v in user_data.model_dump().items() if v is not None}
        
        if "password" in update_dict:
            update_dict["hashed_password"] = get_password_hash(update_dict.pop("password"))
        
        update_dict["updated_at"] = datetime.utcnow()
        
        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(user_id)},
            {"$set": update_dict},
            return_document=True
        )
        
        if result:
            return UserModel(**result)
        return None
    
    async def delete_user(self, user_id: str) -> bool:
        """
        Delete user
        """
        if not ObjectId.is_valid(user_id):
            return False
        
        result = await self.collection.delete_one({"_id": ObjectId(user_id)})
        return result.deleted_count > 0
    
    async def authenticate_user(self, email: str, password: str) -> Optional[UserModel]:
        """
        Authenticate user with email and password
        Returns None if authentication fails (email not found or password incorrect)
        """
        user = await self.get_user_by_email(email)
        if not user:
            return None

        # Check if user has hashed_password field
        hashed_password = user.password if hasattr(user, 'password') else None
        if not hashed_password and hasattr(user, 'hashed_password'):
            hashed_password = user.hashed_password

        if not hashed_password:
            return None

        if not verify_password(password, hashed_password):
            return None

        return user

    async def add_bookmark(self, user_id: str, post_id: str) -> Optional[UserModel]:
        """
        Add a post to user's bookmarks with timestamp
        """
        if not ObjectId.is_valid(user_id) or not ObjectId.is_valid(post_id):
            return None

        # Check if bookmark already exists
        user = await self.collection.find_one({"_id": ObjectId(user_id)})
        if user:
            bookmarks = user.get("bookmarks", [])
            if any(b.get("post_id") == ObjectId(post_id) for b in bookmarks):
                # Already bookmarked, return existing user
                return UserModel(**user)

        # Add new bookmark with timestamp
        bookmark_item = {
            "post_id": ObjectId(post_id),
            "created_at": datetime.utcnow()
        }

        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(user_id)},
            {
                "$addToSet": {"bookmarked_post_ids": ObjectId(post_id)},  # Keep for backward compatibility
                "$push": {"bookmarks": bookmark_item}
            },
            return_document=True
        )

        if result:
            return UserModel(**result)
        return None

    async def remove_bookmark(self, user_id: str, post_id: str) -> Optional[UserModel]:
        """
        Remove a post from user's bookmarks
        """
        if not ObjectId.is_valid(user_id) or not ObjectId.is_valid(post_id):
            return None

        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(user_id)},
            {
                "$pull": {
                    "bookmarked_post_ids": ObjectId(post_id),  # Keep for backward compatibility
                    "bookmarks": {"post_id": ObjectId(post_id)}
                }
            },
            return_document=True
        )

        if result:
            return UserModel(**result)
        return None

    async def get_bookmarked_posts(self, user_id: str) -> List[str]:
        """
        Get list of bookmarked post IDs for a user
        """
        if not ObjectId.is_valid(user_id):
            return []

        user = await self.collection.find_one({"_id": ObjectId(user_id)})
        if user and "bookmarked_post_ids" in user:
            return [str(post_id) for post_id in user["bookmarked_post_ids"]]
        return []

    def calculate_ban_duration(self, violation_count: int) -> Optional[timedelta]:
        """
        Calculate ban duration based on violation count
        Returns None for permanent ban
        """
        if violation_count == 1:
            return timedelta(days=3)
        elif violation_count == 2:
            return timedelta(days=7)
        else:  # >= 3 violations
            return None  # Permanent ban

    async def ban_user_with_violations(
        self,
        user_id: str,
        reason: str,
        admin_id: str
    ) -> Optional[UserModel]:
        """
        Ban user and increment violation count with progressive duration
        """
        if not ObjectId.is_valid(user_id):
            return None

        # Get current user
        user = await self.collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            return None

        # Increment violation count
        new_violation_count = user.get("violation_count", 0) + 1

        # Calculate ban duration
        ban_duration = self.calculate_ban_duration(new_violation_count)
        
        update_data = {
            "status": UserStatus.LOCKED,
            "violation_count": new_violation_count,
            "ban_reason": reason,
            "updated_at": datetime.utcnow()
        }

        if ban_duration:
            # Temporary ban
            ban_expires_at = datetime.utcnow() + ban_duration
            update_data["ban_expires_at"] = ban_expires_at
        else:
            # Permanent ban
            update_data["ban_expires_at"] = None

        # Update user
        updated_user = await self.collection.find_one_and_update(
            {"_id": ObjectId(user_id)},
            {"$set": update_data},
            return_document=True
        )

        if updated_user:
            return UserModel(**updated_user)
        return None

    async def check_ban_status(self, user_id: str) -> dict:
        """
        Check if user is currently banned
        Returns: {"is_banned": bool, "reason": str, "expires_at": datetime or None}
        """
        if not ObjectId.is_valid(user_id):
            return {"is_banned": False, "reason": None, "expires_at": None}

        user = await self.collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            return {"is_banned": False, "reason": None, "expires_at": None}

        # Check if user is locked
        if user.get("status") != UserStatus.LOCKED:
            return {"is_banned": False, "reason": None, "expires_at": None}

        ban_expires_at = user.get("ban_expires_at")
        
        # If ban has expiration and it's passed, unlock user
        if ban_expires_at and ban_expires_at < datetime.utcnow():
            await self.collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"status": UserStatus.ACTIVE, "ban_expires_at": None, "ban_reason": None}}
            )
            return {"is_banned": False, "reason": None, "expires_at": None}

        # User is currently banned
        return {
            "is_banned": True,
            "reason": user.get("ban_reason", "Violation of community guidelines"),
            "expires_at": ban_expires_at,
            "violation_count": user.get("violation_count", 0)
        }

    async def get_public_user_info(self, user_id: str, db: AsyncIOMotorDatabase) -> Optional[dict]:
        """
        Get public user info including post count for popup display
        """
        if not ObjectId.is_valid(user_id):
            return None

        user = await self.collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            return None

        # Count user's posts
        posts_collection = db.posts
        post_count = await posts_collection.count_documents({"author_id": ObjectId(user_id)})

        return {
            "name": user.get("name", ""),
            "avatar_url": user.get("avatar_url"),
            "created_at": user.get("created_at"),
            "post_count": post_count
        }


