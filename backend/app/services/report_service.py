from typing import Optional, List
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.models.report import (
    ReportModel,
    ReportType,
    ReportStatus,
    ActionTaken,
    ResolutionModel
)
from app.schemas.report import ReportCreate, ReportResolve


class ReportService:
    """
    Report service for handling user reports on violations
    """

    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db.reports
        self.users_collection = db.users
        self.posts_collection = db.posts
        self.answers_collection = db.answers

    async def create_report(
        self,
        report_data: ReportCreate,
        reporter_id: str
    ) -> ReportModel:
        """
        Create a new report
        """
        # Validate that target exists based on report type
        target_exists = await self._validate_target(
            report_data.report_type,
            report_data.target_id
        )
        
        if not target_exists:
            raise ValueError("Target not found")

        # Check for self-reporting
        is_self_report = await self._check_self_report(
            report_data.report_type,
            report_data.target_id,
            reporter_id
        )
        
        if is_self_report:
            raise PermissionError("Cannot report your own content")

        report_dict = report_data.model_dump()
        report_dict["reporter_id"] = ObjectId(reporter_id)
        report_dict["target_id"] = ObjectId(report_data.target_id)
        report_dict["status"] = ReportStatus.PENDING
        report_dict["created_at"] = datetime.utcnow()
        report_dict["resolution"] = None

        result = await self.collection.insert_one(report_dict)
        report_dict["_id"] = result.inserted_id

        return ReportModel(**report_dict)

    async def _check_self_report(
        self,
        report_type: ReportType,
        target_id: str,
        reporter_id: str
    ) -> bool:
        """
        Check if user is trying to report their own content
        """
        if not ObjectId.is_valid(target_id):
            return False

        obj_id = ObjectId(target_id)
        reporter_obj_id = ObjectId(reporter_id)

        if report_type == ReportType.POST:
            target = await self.posts_collection.find_one({"_id": obj_id})
            if target and target.get("author_id") == reporter_obj_id:
                return True
        elif report_type == ReportType.ANSWER:
            target = await self.answers_collection.find_one({"_id": obj_id})
            if target and target.get("author_id") == reporter_obj_id:
                return True
        elif report_type == ReportType.USER:
            # Cannot report yourself
            if obj_id == reporter_obj_id:
                return True

        return False

    async def _validate_target(
        self,
        report_type: ReportType,
        target_id: str
    ) -> bool:
        """
        Validate that the target exists based on report type
        """
        if not ObjectId.is_valid(target_id):
            return False

        obj_id = ObjectId(target_id)

        if report_type == ReportType.POST:
            target = await self.posts_collection.find_one({"_id": obj_id})
        elif report_type == ReportType.ANSWER:
            target = await self.answers_collection.find_one({"_id": obj_id})
        elif report_type == ReportType.USER:
            target = await self.users_collection.find_one({"_id": obj_id})
        elif report_type == ReportType.COMMENT:
            # For now, comments might be part of answers or posts
            # Adjust based on your actual comment implementation
            target = await self.answers_collection.find_one({"_id": obj_id})
        else:
            return False

        return target is not None

    async def get_report_by_id(self, report_id: str) -> Optional[ReportModel]:
        """
        Get report by ID
        """
        if not ObjectId.is_valid(report_id):
            return None

        report = await self.collection.find_one({"_id": ObjectId(report_id)})
        if report:
            return ReportModel(**report)
        return None

    async def get_reports(
        self,
        skip: int = 0,
        limit: int = 10,
        status: Optional[ReportStatus] = None,
        report_type: Optional[ReportType] = None,
        reporter_id: Optional[str] = None
    ) -> List[ReportModel]:
        """
        Get reports with filters
        """
        query = {}

        if status:
            query["status"] = status

        if report_type:
            query["report_type"] = report_type

        if reporter_id and ObjectId.is_valid(reporter_id):
            query["reporter_id"] = ObjectId(reporter_id)

        cursor = self.collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
        reports = await cursor.to_list(length=limit)

        return [ReportModel(**report) for report in reports]

    async def count_reports(
        self,
        status: Optional[ReportStatus] = None,
        report_type: Optional[ReportType] = None,
        reporter_id: Optional[str] = None
    ) -> int:
        """
        Count reports with filters
        """
        query = {}

        if status:
            query["status"] = status

        if report_type:
            query["report_type"] = report_type

        if reporter_id and ObjectId.is_valid(reporter_id):
            query["reporter_id"] = ObjectId(reporter_id)

        count = await self.collection.count_documents(query)
        return count

    async def resolve_report(
        self,
        report_id: str,
        admin_id: str,
        resolution_data: ReportResolve
    ) -> Optional[ReportModel]:
        """
        Resolve a report (admin only)
        """
        if not ObjectId.is_valid(report_id):
            return None

        resolution = ResolutionModel(
            admin_id=ObjectId(admin_id),
            action_taken=resolution_data.action_taken,
            notes=resolution_data.notes,
            resolved_at=datetime.utcnow()
        )

        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(report_id)},
            {
                "$set": {
                    "status": ReportStatus.RESOLVED,
                    "resolution": resolution.model_dump()
                }
            },
            return_document=True
        )

        if result:
            return ReportModel(**result)
        return None

    async def dismiss_report(
        self,
        report_id: str,
        admin_id: str,
        notes: Optional[str] = None
    ) -> Optional[ReportModel]:
        """
        Dismiss a report (admin only)
        """
        if not ObjectId.is_valid(report_id):
            return None

        resolution = ResolutionModel(
            admin_id=ObjectId(admin_id),
            action_taken=ActionTaken.NO_ACTION,
            notes=notes,
            resolved_at=datetime.utcnow()
        )

        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(report_id)},
            {
                "$set": {
                    "status": ReportStatus.DISMISSED,
                    "resolution": resolution.model_dump()
                }
            },
            return_document=True
        )

        if result:
            return ReportModel(**result)
        return None

    async def get_user_reports(
        self,
        user_id: str,
        skip: int = 0,
        limit: int = 10
    ) -> List[ReportModel]:
        """
        Get reports created by a specific user
        """
        if not ObjectId.is_valid(user_id):
            return []

        cursor = self.collection.find(
            {"reporter_id": ObjectId(user_id)}
        ).sort("created_at", -1).skip(skip).limit(limit)
        
        reports = await cursor.to_list(length=limit)
        return [ReportModel(**report) for report in reports]

    async def get_target_reports(
        self,
        target_id: str,
        report_type: ReportType
    ) -> List[ReportModel]:
        """
        Get all reports for a specific target (post, answer, user, etc.)
        """
        if not ObjectId.is_valid(target_id):
            return []

        cursor = self.collection.find({
            "target_id": ObjectId(target_id),
            "report_type": report_type
        }).sort("created_at", -1)
        
        reports = await cursor.to_list(length=None)
        return [ReportModel(**report) for report in reports]

    async def get_report_with_details(self, report_id: str) -> Optional[dict]:
        """
        Get report with detailed information about target (post or user)
        """
        if not ObjectId.is_valid(report_id):
            return None

        report = await self.collection.find_one({"_id": ObjectId(report_id)})
        if not report:
            return None

        result = {
            "report": ReportModel(**report),
            "reporter": None,
            "target": None
        }

        # Get reporter info
        reporter = await self.users_collection.find_one({"_id": report["reporter_id"]})
        if reporter:
            result["reporter"] = {
                "id": str(reporter["_id"]),
                "name": reporter.get("name", "Unknown"),
                "email": reporter.get("email", "")
            }

        # Get target info based on type
        report_type = report["report_type"]
        target_id = report["target_id"]

        if report_type == ReportType.POST:
            target = await self.posts_collection.find_one({"_id": target_id})
            if target:
                author = await self.users_collection.find_one({"_id": target["author_id"]})
                result["target"] = {
                    "type": "post",
                    "id": str(target["_id"]),
                    "title": target.get("title", ""),
                    "content": target.get("content", "")[:200],  # Preview
                    "author_id": str(target["author_id"]),
                    "author_name": author.get("name", "Unknown") if author else "Unknown",
                    "is_deleted": target.get("is_deleted", False),
                    "created_at": target.get("created_at")
                }
        elif report_type == ReportType.USER:
            target = await self.users_collection.find_one({"_id": target_id})
            if target:
                result["target"] = {
                    "type": "user",
                    "id": str(target["_id"]),
                    "name": target.get("name", ""),
                    "email": target.get("email", ""),
                    "status": target.get("status", "active"),
                    "violation_count": target.get("violation_count", 0)
                }
        elif report_type == ReportType.ANSWER:
            target = await self.answers_collection.find_one({"_id": target_id})
            if target:
                author = await self.users_collection.find_one({"_id": target["author_id"]})
                result["target"] = {
                    "type": "answer",
                    "id": str(target["_id"]),
                    "content": target.get("content", "")[:200],  # Preview
                    "author_id": str(target["author_id"]),
                    "author_name": author.get("name", "Unknown") if author else "Unknown"
                }

        return result

    async def process_report_action(
        self,
        report_id: str,
        action: str,
        reason: str,
        admin_id: str
    ) -> Optional[dict]:
        """
        Process a report by taking appropriate action
        Returns: {"report": ReportModel, "action_result": dict}
        """
        from app.schemas.report import ReportAction
        
        if not ObjectId.is_valid(report_id):
            return None

        report = await self.collection.find_one({"_id": ObjectId(report_id)})
        if not report:
            return None

        action_result = {
            "success": False,
            "message": "",
            "ban_duration": None
        }

        report_type = report["report_type"]
        target_id = report["target_id"]

        # Process action based on type
        if action == ReportAction.DELETE_POST and report_type == ReportType.POST:
            # Delete the post
            post = await self.posts_collection.find_one_and_update(
                {"_id": target_id},
                {"$set": {"is_deleted": True, "updated_at": datetime.utcnow()}},
                return_document=True
            )
            if post:
                action_result["success"] = True
                action_result["message"] = "Post deleted successfully"
                action_result["target_author_id"] = str(post["author_id"])
                action_result["post_title"] = post.get("title", "")

        elif action in [ReportAction.BAN_USER_3_DAYS, ReportAction.BAN_USER_7_DAYS, ReportAction.BAN_USER_PERMANENT]:
            # Ban the user
            if report_type == ReportType.USER:
                user_to_ban_id = target_id
            elif report_type == ReportType.POST:
                post = await self.posts_collection.find_one({"_id": target_id})
                user_to_ban_id = post["author_id"] if post else None
            elif report_type == ReportType.ANSWER:
                answer = await self.answers_collection.find_one({"_id": target_id})
                user_to_ban_id = answer["author_id"] if answer else None
            else:
                user_to_ban_id = None

            if user_to_ban_id:
                user = await self.users_collection.find_one({"_id": user_to_ban_id})
                if user:
                    new_violation_count = user.get("violation_count", 0) + 1

                    # Determine ban duration
                    if action == ReportAction.BAN_USER_3_DAYS or new_violation_count == 1:
                        from datetime import timedelta
                        ban_duration = timedelta(days=3)
                        ban_duration_str = "3 days"
                    elif action == ReportAction.BAN_USER_7_DAYS or new_violation_count == 2:
                        from datetime import timedelta
                        ban_duration = timedelta(days=7)
                        ban_duration_str = "7 days"
                    else:  # PERMANENT or >= 3 violations
                        ban_duration = None
                        ban_duration_str = "permanent"

                    update_data = {
                        "status": "locked",
                        "violation_count": new_violation_count,
                        "ban_reason": reason,
                        "updated_at": datetime.utcnow()
                    }

                    if ban_duration:
                        update_data["ban_expires_at"] = datetime.utcnow() + ban_duration
                    else:
                        update_data["ban_expires_at"] = None

                    # Update user
                    await self.users_collection.update_one(
                        {"_id": user_to_ban_id},
                        {"$set": update_data}
                    )

                    action_result["success"] = True
                    action_result["message"] = f"User banned for {ban_duration_str}"
                    action_result["ban_duration"] = ban_duration_str
                    action_result["banned_user_id"] = str(user_to_ban_id)

        elif action == ReportAction.NO_ACTION:
            action_result["success"] = True
            action_result["message"] = "No action taken"

        # Update report status
        resolution = {
            "admin_id": ObjectId(admin_id),
            "action_taken": self._map_action_to_taken(action),
            "notes": reason,
            "resolved_at": datetime.utcnow()
        }

        updated_report = await self.collection.find_one_and_update(
            {"_id": ObjectId(report_id)},
            {
                "$set": {
                    "status": ReportStatus.RESOLVED,
                    "resolution": resolution
                }
            },
            return_document=True
        )

        return {
            "report": ReportModel(**updated_report) if updated_report else None,
            "action_result": action_result
        }

    def _map_action_to_taken(self, action: str) -> ActionTaken:
        """
        Map ReportAction to ActionTaken enum
        """
        from app.schemas.report import ReportAction
        
        if action == ReportAction.DELETE_POST:
            return ActionTaken.DELETED_CONTENT
        elif action in [ReportAction.BAN_USER_3_DAYS, ReportAction.BAN_USER_7_DAYS, ReportAction.BAN_USER_PERMANENT]:
            return ActionTaken.LOCKED_USER
        elif action == ReportAction.NO_ACTION:
            return ActionTaken.NO_ACTION
        else:
            return ActionTaken.NO_ACTION


    async def get_user_names(self, user_ids: List[str]) -> dict:
        """
        Get names for a list of user IDs
        Returns map of {user_id: user_name}
        """
        if not user_ids:
            return {}
            
        object_ids = [ObjectId(uid) for uid in user_ids if ObjectId.is_valid(uid)]
        
        if not object_ids:
            return {}
            
        cursor = self.users_collection.find(
            {"_id": {"$in": object_ids}},
            {"_id": 1, "name": 1, "email": 1}
        )
        
        users = await cursor.to_list(length=None)
        return {str(user["_id"]): user.get("name", user.get("email", "Unknown")) for user in users}
