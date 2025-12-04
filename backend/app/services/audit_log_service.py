from typing import Optional, List, Dict, Any
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.models.audit_log import AuditLogModel, AuditAction


class AuditLogService:
    """
    Audit log service for tracking admin actions
    """

    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db.audit_logs

    async def create_log(
        self,
        admin_id: str,
        admin_email: str,
        target_user_id: str,
        target_user_email: str,
        action: AuditAction,
        old_value: Optional[Dict[str, Any]] = None,
        new_value: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> AuditLogModel:
        """
        Create a new audit log entry
        """
        log_dict = {
            "admin_id": ObjectId(admin_id),
            "admin_email": admin_email,
            "target_user_id": ObjectId(target_user_id),
            "target_user_email": target_user_email,
            "action": action,
            "old_value": old_value,
            "new_value": new_value,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "created_at": datetime.utcnow()
        }

        result = await self.collection.insert_one(log_dict)
        log_dict["_id"] = result.inserted_id

        return AuditLogModel(**log_dict)

    async def get_logs(
        self,
        skip: int = 0,
        limit: int = 50,
        admin_id: Optional[str] = None,
        target_user_id: Optional[str] = None,
        action: Optional[AuditAction] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> tuple[List[AuditLogModel], int]:
        """
        Get audit logs with filtering and pagination
        Returns tuple of (logs, total_count)
        """
        query = {}

        if admin_id and ObjectId.is_valid(admin_id):
            query["admin_id"] = ObjectId(admin_id)

        if target_user_id and ObjectId.is_valid(target_user_id):
            query["target_user_id"] = ObjectId(target_user_id)

        if action:
            query["action"] = action

        if start_date or end_date:
            date_query = {}
            if start_date:
                date_query["$gte"] = start_date
            if end_date:
                date_query["$lte"] = end_date
            query["created_at"] = date_query

        # Get total count
        total = await self.collection.count_documents(query)

        # Get logs with pagination, sorted by most recent first
        cursor = self.collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
        logs = await cursor.to_list(length=limit)

        return [AuditLogModel(**log) for log in logs], total

    async def get_logs_by_target_user(
        self,
        target_user_id: str,
        skip: int = 0,
        limit: int = 50
    ) -> tuple[List[AuditLogModel], int]:
        """
        Get all audit logs for a specific target user
        """
        return await self.get_logs(
            skip=skip,
            limit=limit,
            target_user_id=target_user_id
        )

    async def get_logs_by_admin(
        self,
        admin_id: str,
        skip: int = 0,
        limit: int = 50
    ) -> tuple[List[AuditLogModel], int]:
        """
        Get all audit logs by a specific admin
        """
        return await self.get_logs(
            skip=skip,
            limit=limit,
            admin_id=admin_id
        )
