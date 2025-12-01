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

        report_dict = report_data.model_dump()
        report_dict["reporter_id"] = ObjectId(reporter_id)
        report_dict["target_id"] = ObjectId(report_data.target_id)
        report_dict["status"] = ReportStatus.PENDING
        report_dict["created_at"] = datetime.utcnow()
        report_dict["resolution"] = None

        result = await self.collection.insert_one(report_dict)
        report_dict["_id"] = result.inserted_id

        return ReportModel(**report_dict)

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
