from typing import Optional, List
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.models.user import UserModel, UserRole, UserStatus
from app.models.audit_log import AuditAction
from app.services.audit_log_service import AuditLogService


class AdminService:
    """
    Admin service for user management operations
    """

    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db.users
        self.audit_service = AuditLogService(db)

    async def get_all_users(
        self,
        skip: int = 0,
        limit: int = 50,
        search: Optional[str] = None,
        role: Optional[UserRole] = None,
        status: Optional[UserStatus] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> tuple[List[UserModel], int]:
        """
        Get all users with filtering, searching, and pagination

        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            search: Search term for name or email
            role: Filter by user role
            status: Filter by user status
            start_date: Filter by registration date (from)
            end_date: Filter by registration date (to)

        Returns:
            Tuple of (users list, total count)
        """
        query = {}

        # Search by name or email
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}}
            ]

        # Filter by role
        if role:
            query["role"] = role

        # Filter by status
        if status:
            query["status"] = status

        # Filter by registration date
        if start_date or end_date:
            date_query = {}
            if start_date:
                date_query["$gte"] = start_date
            if end_date:
                date_query["$lte"] = end_date
            query["created_at"] = date_query

        # Get total count
        total = await self.collection.count_documents(query)

        # Get users with pagination, sorted by most recent first
        cursor = self.collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
        users = await cursor.to_list(length=limit)

        return [UserModel(**user) for user in users], total

    async def get_user_detail(self, user_id: str) -> Optional[UserModel]:
        """
        Get detailed information of a specific user
        """
        if not ObjectId.is_valid(user_id):
            return None

        user = await self.collection.find_one({"_id": ObjectId(user_id)})
        if user:
            return UserModel(**user)
        return None

    async def update_user_info(
        self,
        user_id: str,
        admin_id: str,
        admin_email: str,
        update_data: dict,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Optional[UserModel]:
        """
        Update user information (name, email, avatar, bio)
        Automatically logs the action to audit log
        """
        if not ObjectId.is_valid(user_id):
            return None

        # Get old user data for audit log
        old_user = await self.collection.find_one({"_id": ObjectId(user_id)})
        if not old_user:
            return None

        # Prepare update dict (only non-None values)
        update_dict = {k: v for k, v in update_data.items() if v is not None}
        update_dict["updated_at"] = datetime.utcnow()

        # Update user
        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(user_id)},
            {"$set": update_dict},
            return_document=True
        )

        if result:
            updated_user = UserModel(**result)

            # Create audit log
            old_values = {k: old_user.get(k) for k in update_data.keys() if k in old_user}
            new_values = {k: result.get(k) for k in update_data.keys() if k in result}

            await self.audit_service.create_log(
                admin_id=admin_id,
                admin_email=admin_email,
                target_user_id=user_id,
                target_user_email=updated_user.email,
                action=AuditAction.USER_UPDATED,
                old_value=old_values,
                new_value=new_values,
                ip_address=ip_address,
                user_agent=user_agent
            )

            return updated_user

        return None

    async def lock_user(
        self,
        user_id: str,
        admin_id: str,
        admin_email: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Optional[UserModel]:
        """
        Lock user account
        Automatically logs the action to audit log
        """
        if not ObjectId.is_valid(user_id):
            return None

        user = await self.collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            return None

        # Prevent locking admin users
        if user.get("role") == UserRole.ADMIN:
            return None

        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "status": UserStatus.LOCKED,
                    "updated_at": datetime.utcnow()
                }
            },
            return_document=True
        )

        if result:
            updated_user = UserModel(**result)

            # Create audit log
            await self.audit_service.create_log(
                admin_id=admin_id,
                admin_email=admin_email,
                target_user_id=user_id,
                target_user_email=updated_user.email,
                action=AuditAction.USER_LOCKED,
                old_value={"status": UserStatus.ACTIVE},
                new_value={"status": UserStatus.LOCKED},
                ip_address=ip_address,
                user_agent=user_agent
            )

            return updated_user

        return None

    async def unlock_user(
        self,
        user_id: str,
        admin_id: str,
        admin_email: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Optional[UserModel]:
        """
        Unlock user account
        Automatically logs the action to audit log
        """
        if not ObjectId.is_valid(user_id):
            return None

        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "status": UserStatus.ACTIVE,
                    "updated_at": datetime.utcnow()
                }
            },
            return_document=True
        )

        if result:
            updated_user = UserModel(**result)

            # Create audit log
            await self.audit_service.create_log(
                admin_id=admin_id,
                admin_email=admin_email,
                target_user_id=user_id,
                target_user_email=updated_user.email,
                action=AuditAction.USER_UNLOCKED,
                old_value={"status": UserStatus.LOCKED},
                new_value={"status": UserStatus.ACTIVE},
                ip_address=ip_address,
                user_agent=user_agent
            )

            return updated_user

        return None

    async def change_user_role(
        self,
        user_id: str,
        new_role: UserRole,
        admin_id: str,
        admin_email: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Optional[UserModel]:
        """
        Change user role (USER <-> ADMIN)
        Automatically logs the action to audit log
        """
        if not ObjectId.is_valid(user_id):
            return None

        # Get old user data
        old_user = await self.collection.find_one({"_id": ObjectId(user_id)})
        if not old_user:
            return None

        old_role = old_user.get("role")

        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "role": new_role,
                    "updated_at": datetime.utcnow()
                }
            },
            return_document=True
        )

        if result:
            updated_user = UserModel(**result)

            # Create audit log
            await self.audit_service.create_log(
                admin_id=admin_id,
                admin_email=admin_email,
                target_user_id=user_id,
                target_user_email=updated_user.email,
                action=AuditAction.ROLE_CHANGED,
                old_value={"role": old_role},
                new_value={"role": new_role},
                ip_address=ip_address,
                user_agent=user_agent
            )

            return updated_user

        return None
