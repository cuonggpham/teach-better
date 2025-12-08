from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.schemas.report import (
    Report,
    ReportCreate,
    ReportResolve,
    ReportWithDetails,
    ReportProcessRequest
)
from app.models.report import ReportStatus, ReportType
from app.services.report_service import ReportService
from app.services.notification_service import NotificationService
from app.api.v1.endpoints.users import get_current_user
from app.schemas.user import User
from app.i18n.dependencies import get_translator, Translator

router = APIRouter()


def get_report_service(db: AsyncIOMotorDatabase = Depends(get_database)) -> ReportService:
    """
    Dependency to get report service
    """
    return ReportService(db)


def get_notification_service(db: AsyncIOMotorDatabase = Depends(get_database)) -> NotificationService:
    """
    Dependency to get notification service
    """
    return NotificationService(db)


@router.post("/", response_model=Report, status_code=status.HTTP_201_CREATED)
async def create_report(
    report_data: ReportCreate,
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
    t: Translator = Depends(get_translator)
):
    """
    Create a new report for a post, answer, comment, or user.
    
    Allows users to report violations such as:
    - Spam
    - Inappropriate content
    - Harassment
    - Misleading information
    
    Requirements:
    - Reason detail must be at least 20 characters
    - Evidence URL is optional
    """
    try:
        report = await report_service.create_report(report_data, current_user.id)

        # Convert to response model
        report_dict = report.model_dump(by_alias=True)
        report_dict["_id"] = str(report_dict["_id"])
        report_dict["reporter_id"] = str(report_dict["reporter_id"])
        report_dict["target_id"] = str(report_dict["target_id"])

        return Report(**report_dict)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("report.target_not_found", default="Target not found")
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=t("report.creation_failed", default="Failed to create report")
        )


@router.get("/", response_model=List[Report])
async def get_reports(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    status_filter: Optional[ReportStatus] = Query(None, alias="status"),
    report_type: Optional[ReportType] = Query(None, alias="type"),
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
    t: Translator = Depends(get_translator)
):
    """
    Get list of reports.
    
    Regular users can only see their own reports.
    Admin users can see all reports with filters.
    """
    # Check if user is admin (adjust based on your User model)
    is_admin = getattr(current_user, 'is_admin', False) or getattr(current_user, 'role', '') == 'admin'
    
    if is_admin:
        # Admin can see all reports with filters
        reports = await report_service.get_reports(
            skip=skip,
            limit=limit,
            status=status_filter,
            report_type=report_type
        )
    else:
        # Regular users can only see their own reports
        reports = await report_service.get_user_reports(
            user_id=current_user.id,
            skip=skip,
            limit=limit
        )

    # Convert to response models
    result = []
    for report in reports:
        report_dict = report.model_dump(by_alias=True)
        report_dict["_id"] = str(report_dict["_id"])
        report_dict["reporter_id"] = str(report_dict["reporter_id"])
        report_dict["target_id"] = str(report_dict["target_id"])
        
        if report_dict.get("resolution") and report_dict["resolution"].get("admin_id"):
            report_dict["resolution"]["admin_id"] = str(report_dict["resolution"]["admin_id"])
        
        result.append(Report(**report_dict))

    return result


@router.get("/my-reports", response_model=List[Report])
async def get_my_reports(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service)
):
    """
    Get current user's reports
    """
    reports = await report_service.get_user_reports(
        user_id=current_user.id,
        skip=skip,
        limit=limit
    )

    # Convert to response models
    result = []
    for report in reports:
        report_dict = report.model_dump(by_alias=True)
        report_dict["_id"] = str(report_dict["_id"])
        report_dict["reporter_id"] = str(report_dict["reporter_id"])
        report_dict["target_id"] = str(report_dict["target_id"])
        
        if report_dict.get("resolution") and report_dict["resolution"].get("admin_id"):
            report_dict["resolution"]["admin_id"] = str(report_dict["resolution"]["admin_id"])
        
        result.append(Report(**report_dict))

    return result


@router.get("/{report_id}", response_model=Report)
async def get_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
    t: Translator = Depends(get_translator)
):
    """
    Get a specific report by ID.
    
    Users can only view their own reports unless they are admin.
    """
    report = await report_service.get_report_by_id(report_id)
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("report.not_found", default="Report not found")
        )

    # Check permissions
    is_admin = getattr(current_user, 'is_admin', False) or getattr(current_user, 'role', '') == 'admin'
    if not is_admin and str(report.reporter_id) != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=t("report.access_denied", default="Access denied")
        )

    # Convert to response model
    report_dict = report.model_dump(by_alias=True)
    report_dict["_id"] = str(report_dict["_id"])
    report_dict["reporter_id"] = str(report_dict["reporter_id"])
    report_dict["target_id"] = str(report_dict["target_id"])
    
    if report_dict.get("resolution") and report_dict["resolution"].get("admin_id"):
        report_dict["resolution"]["admin_id"] = str(report_dict["resolution"]["admin_id"])

    return Report(**report_dict)


@router.post("/{report_id}/resolve", response_model=Report)
async def resolve_report(
    report_id: str,
    resolution_data: ReportResolve,
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
    t: Translator = Depends(get_translator)
):
    """
    Resolve a report (Admin only).
    
    Mark a report as resolved with an action taken and optional notes.
    """
    # Check if user is admin
    is_admin = getattr(current_user, 'is_admin', False) or getattr(current_user, 'role', '') == 'admin'
    
    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=t("report.admin_only", default="Admin access required")
        )

    report = await report_service.resolve_report(
        report_id=report_id,
        admin_id=current_user.id,
        resolution_data=resolution_data
    )

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("report.not_found", default="Report not found")
        )

    # Convert to response model
    report_dict = report.model_dump(by_alias=True)
    report_dict["_id"] = str(report_dict["_id"])
    report_dict["reporter_id"] = str(report_dict["reporter_id"])
    report_dict["target_id"] = str(report_dict["target_id"])
    
    if report_dict.get("resolution") and report_dict["resolution"].get("admin_id"):
        report_dict["resolution"]["admin_id"] = str(report_dict["resolution"]["admin_id"])

    return Report(**report_dict)


@router.post("/{report_id}/dismiss", response_model=Report)
async def dismiss_report(
    report_id: str,
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
    t: Translator = Depends(get_translator)
):
    """
    Dismiss a report (Admin only).
    
    Mark a report as dismissed with no action taken.
    """
    # Check if user is admin
    is_admin = getattr(current_user, 'is_admin', False) or getattr(current_user, 'role', '') == 'admin'
    
    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=t("report.admin_only", default="Admin access required")
        )

    report = await report_service.dismiss_report(
        report_id=report_id,
        admin_id=current_user.id,
        notes=notes
    )

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("report.not_found", default="Report not found")
        )

    # Convert to response model
    report_dict = report.model_dump(by_alias=True)
    report_dict["_id"] = str(report_dict["_id"])
    report_dict["reporter_id"] = str(report_dict["reporter_id"])
    report_dict["target_id"] = str(report_dict["target_id"])
    
    if report_dict.get("resolution") and report_dict["resolution"].get("admin_id"):
        report_dict["resolution"]["admin_id"] = str(report_dict["resolution"]["admin_id"])

    return Report(**report_dict)


@router.get("/target/{report_type}/{target_id}", response_model=List[Report])
async def get_target_reports(
    report_type: ReportType,
    target_id: str,
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
    t: Translator = Depends(get_translator)
):
    """
    Get all reports for a specific target (Admin only).
    
    Useful for seeing if a post/answer/user has multiple reports.
    """
    # Check if user is admin
    is_admin = getattr(current_user, 'is_admin', False) or getattr(current_user, 'role', '') == 'admin'
    
    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=t("report.admin_only", default="Admin access required")
        )

    reports = await report_service.get_target_reports(
        target_id=target_id,
        report_type=report_type
    )

    # Convert to response models
    result = []
    for report in reports:
        report_dict = report.model_dump(by_alias=True)
        report_dict["_id"] = str(report_dict["_id"])
        report_dict["reporter_id"] = str(report_dict["reporter_id"])
        report_dict["target_id"] = str(report_dict["target_id"])
        
        if report_dict.get("resolution") and report_dict["resolution"].get("admin_id"):
            report_dict["resolution"]["admin_id"] = str(report_dict["resolution"]["admin_id"])
        
        result.append(Report(**report_dict))

    return result


@router.get("/{report_id}/details")
async def get_report_details(
    report_id: str,
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
    t: Translator = Depends(get_translator)
):
    """
    Get detailed report information including target details (Admin only).
    
    Returns:
    - Report information
    - Reporter details
    - Target details (post or user information)
    """
    # Check if user is admin
    is_admin = getattr(current_user, 'is_admin', False) or getattr(current_user, 'role', '') == 'admin'
    
    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=t("report.admin_only", default="Admin access required")
        )

    report_details = await report_service.get_report_with_details(report_id)

    if not report_details:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("report.not_found", default="Report not found")
        )

    # Convert report to dict
    report_model = report_details["report"]
    report_dict = report_model.model_dump(by_alias=True)
    report_dict["_id"] = str(report_dict["_id"])
    report_dict["reporter_id"] = str(report_dict["reporter_id"])
    report_dict["target_id"] = str(report_dict["target_id"])
    
    if report_dict.get("resolution") and report_dict["resolution"].get("admin_id"):
        report_dict["resolution"]["admin_id"] = str(report_dict["resolution"]["admin_id"])

    return {
        "report": report_dict,
        "reporter": report_details["reporter"],
        "target": report_details["target"]
    }


@router.post("/{report_id}/process")
async def process_report(
    report_id: str,
    process_request: ReportProcessRequest,
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
    notification_service: NotificationService = Depends(get_notification_service),
    t: Translator = Depends(get_translator)
):
    """
    Process a report by taking action (Admin only).
    
    Actions:
    - DELETE_POST: Delete the reported post
    - BAN_USER_3_DAYS: Ban user for 3 days (1st violation)
    - BAN_USER_7_DAYS: Ban user for 7 days (2nd violation)
    - BAN_USER_PERMANENT: Permanently ban user (3rd+ violation)
    - NO_ACTION: Dismiss report without taking action
    
    Automatically:
    - Increments violation count when banning
    - Sends notification to affected users
    - Marks report as resolved
    """
    # Check if user is admin
    is_admin = getattr(current_user, 'is_admin', False) or getattr(current_user, 'role', '') == 'admin'
    
    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=t("report.admin_only", default="Admin access required")
        )

    # Process the report
    result = await report_service.process_report_action(
        report_id=report_id,
        action=process_request.action,
        reason=process_request.reason,
        admin_id=current_user.id
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("report.not_found", default="Report not found")
        )

    action_result = result["action_result"]
    
    if not action_result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=action_result.get("message", "Failed to process report")
        )

    # Send notifications based on action taken
    try:
        # Get report details for notifications
        report_model = result["report"]
        
        # Notify the reporter that their report was processed
        await notification_service.create_report_resolved_notification(
            user_id=str(report_model.reporter_id),
            action_taken=action_result["message"]
        )

        # Send specific notifications based on action
        from app.schemas.report import ReportAction
        
        if process_request.action == ReportAction.DELETE_POST:
            # Notify post author about deletion
            if "target_author_id" in action_result:
                await notification_service.create_post_deleted_notification(
                    user_id=action_result["target_author_id"],
                    post_title=action_result.get("post_title", "your post"),
                    reason=process_request.reason
                )
        
        elif process_request.action in [
            ReportAction.BAN_USER_3_DAYS,
            ReportAction.BAN_USER_7_DAYS,
            ReportAction.BAN_USER_PERMANENT
        ]:
            # Notify banned user
            if "banned_user_id" in action_result:
                await notification_service.create_ban_notification(
                    user_id=action_result["banned_user_id"],
                    ban_duration=action_result.get("ban_duration", "unknown"),
                    reason=process_request.reason
                )
    except Exception as e:
        # Log error but don't fail the request
        print(f"Error sending notification: {e}")

    # Convert report to response
    report_dict = report_model.model_dump(by_alias=True)
    report_dict["_id"] = str(report_dict["_id"])
    report_dict["reporter_id"] = str(report_dict["reporter_id"])
    report_dict["target_id"] = str(report_dict["target_id"])
    
    if report_dict.get("resolution") and report_dict["resolution"].get("admin_id"):
        report_dict["resolution"]["admin_id"] = str(report_dict["resolution"]["admin_id"])

    return {
        "message": t("report.processed_successfully", default="Report processed successfully"),
        "report": Report(**report_dict),
        "action_result": action_result
    }
