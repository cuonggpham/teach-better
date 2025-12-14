from typing import Optional, List
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.models.notification import NotificationModel, NotificationType


class NotificationService:
    """
    Notification service for managing user notifications
    """

    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db.notifications

    async def create_notification(
        self,
        user_id: str,
        notification_type: NotificationType,
        message: str,
        link: Optional[str] = None,
        actor_id: Optional[str] = None
    ) -> NotificationModel:
        """
        Create a new notification
        """
        notification_dict = {
            "user_id": ObjectId(user_id),
            "type": notification_type,
            "message": message,
            "link": link,
            "is_read": False,
            "created_at": datetime.utcnow()
        }
        
        if actor_id and ObjectId.is_valid(actor_id):
            notification_dict["actor_id"] = ObjectId(actor_id)

        result = await self.collection.insert_one(notification_dict)
        notification_dict["_id"] = result.inserted_id

        return NotificationModel(**notification_dict)

    async def get_user_notifications(
        self,
        user_id: str,
        skip: int = 0,
        limit: int = 50,
        unread_only: bool = False
    ) -> List[NotificationModel]:
        """
        Get notifications for a user
        """
        if not ObjectId.is_valid(user_id):
            return []

        query = {"user_id": ObjectId(user_id)}
        if unread_only:
            query["is_read"] = False

        cursor = self.collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
        notifications = await cursor.to_list(length=limit)

        return [NotificationModel(**notification) for notification in notifications]

    async def mark_as_read(self, notification_id: str, user_id: str) -> bool:
        """
        Mark a notification as read
        """
        if not ObjectId.is_valid(notification_id) or not ObjectId.is_valid(user_id):
            return False

        # Mark as read
        await self.collection.update_one(
            {"_id": ObjectId(notification_id)},
            {"$set": {"is_read": True}}
        )

        return True

    async def create_ban_notification(
        self,
        user_id: str,
        ban_duration: str,
        reason: str
    ) -> NotificationModel:
        """
        Create notification for banned user
        """
        notification_dict = {
            "user_id": ObjectId(user_id),
            "type": NotificationType.ACCOUNT_BANNED,
            "message": f"Your account has been banned for {ban_duration}. Reason: {reason}",
            "link": None,
            "is_read": False,
            "created_at": datetime.utcnow()
        }

        result = await self.collection.insert_one(notification_dict)
        notification_dict["_id"] = result.inserted_id

        return NotificationModel(**notification_dict)

    async def create_post_deleted_notification(
        self,
        user_id: str,
        post_title: str,
        reason: str
    ) -> NotificationModel:
        """
        Create notification for post deletion
        """
        notification_dict = {
            "user_id": ObjectId(user_id),
            "type": NotificationType.POST_DELETED,
            "message": f"Your post '{post_title}' has been deleted for violating community guidelines. Reason: {reason}",
            "link": None,
            "is_read": False,
            "created_at": datetime.utcnow()
        }

        result = await self.collection.insert_one(notification_dict)
        notification_dict["_id"] = result.inserted_id

        return NotificationModel(**notification_dict)

    async def create_report_resolved_notification(
        self,
        user_id: str,
        action_taken: str
    ) -> NotificationModel:
        """
        Create notification for reporter when report is resolved
        """
        notification_dict = {
            "user_id": ObjectId(user_id),
            "type": NotificationType.REPORT_RESOLVED,
            "message": f"Your report has been reviewed and action has been taken: {action_taken}",
            "link": None,
            "is_read": False,
            "created_at": datetime.utcnow()
        }

        result = await self.collection.insert_one(notification_dict)
        notification_dict["_id"] = result.inserted_id

        return NotificationModel(**notification_dict)

    async def mark_all_as_read(self, user_id: str) -> bool:
        """
        Mark all notifications as read for a user
        """
        if not ObjectId.is_valid(user_id):
            return False

        result = await self.collection.update_many(
            {"user_id": ObjectId(user_id), "is_read": False},
            {"$set": {"is_read": True}}
        )

        return result.modified_count > 0

    async def get_unread_count(self, user_id: str) -> int:
        """
        Get count of unread notifications for a user
        """
        if not ObjectId.is_valid(user_id):
            return 0

        count = await self.collection.count_documents({
            "user_id": ObjectId(user_id),
            "is_read": False
        })

        return count

    async def delete_notification(self, notification_id: str, user_id: str) -> bool:
        """
        Delete a notification
        """
        if not ObjectId.is_valid(notification_id) or not ObjectId.is_valid(user_id):
            return False

        result = await self.collection.delete_one({
            "_id": ObjectId(notification_id),
            "user_id": ObjectId(user_id)
        })

        return result.deleted_count > 0
