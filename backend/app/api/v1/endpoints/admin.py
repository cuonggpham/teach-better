from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.schemas.user import User
from app.schemas.admin import (
    AdminUserUpdate,
    AdminChangeRole,
    UserListResponse,
    UserDetailResponse
)
from app.schemas.audit_log import AuditLogList
from app.services.admin_service import AdminService
from app.services.audit_log_service import AuditLogService
from app.api.v1.endpoints.users import get_current_user
from app.models.user import UserRole, UserStatus
from app.models.audit_log import AuditAction
from app.i18n.dependencies import get_translator, Translator

router = APIRouter()


def get_admin_service(db: AsyncIOMotorDatabase = Depends(get_database)) -> AdminService:
    """
    Dependency to get admin service
    """
    return AdminService(db)


def get_audit_log_service(db: AsyncIOMotorDatabase = Depends(get_database)) -> AuditLogService:
    """
    Dependency to get audit log service
    """
    return AuditLogService(db)


async def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to verify current user is an admin
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


@router.get("/users", response_model=UserListResponse)
async def get_all_users(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of records to return"),
    search: Optional[str] = Query(None, description="Search by name or email"),
    role: Optional[UserRole] = Query(None, description="Filter by user role"),
    status: Optional[UserStatus] = Query(None, description="Filter by user status"),
    start_date: Optional[datetime] = Query(None, description="Filter by registration date (from)"),
    end_date: Optional[datetime] = Query(None, description="Filter by registration date (to)"),
    admin_service: AdminService = Depends(get_admin_service),
    current_admin: User = Depends(get_current_admin),
    t: Translator = Depends(get_translator)
):
    """
    Get all users with filtering, searching, and pagination

    Admin only endpoint
    """
    users, total = await admin_service.get_all_users(
        skip=skip,
        limit=limit,
        search=search,
        role=role,
        status=status,
        start_date=start_date,
        end_date=end_date
    )

    # Convert to response models
    user_list = []
    for user in users:
        user_dict = user.model_dump(by_alias=True)
        user_dict["_id"] = str(user_dict["_id"])
        user_list.append(User(**user_dict))

    return UserListResponse(
        users=user_list,
        total=total,
        skip=skip,
        limit=limit
    )


@router.get("/users/{user_id}", response_model=UserDetailResponse)
async def get_user_detail(
    user_id: str,
    admin_service: AdminService = Depends(get_admin_service),
    current_admin: User = Depends(get_current_admin),
    t: Translator = Depends(get_translator)
):
    """
    Get detailed information of a specific user

    Admin only endpoint
    """
    user = await admin_service.get_user_detail(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("user.not_found")
        )

    # Convert to response model
    user_dict = user.model_dump(by_alias=True)
    user_dict["_id"] = str(user_dict["_id"])

    return UserDetailResponse(user=User(**user_dict))


@router.put("/users/{user_id}")
async def update_user_info(
    user_id: str,
    user_data: AdminUserUpdate,
    request: Request,
    admin_service: AdminService = Depends(get_admin_service),
    current_admin: User = Depends(get_current_admin),
    t: Translator = Depends(get_translator)
):
    """
    Update user information (name, email, avatar, bio)

    Admin only endpoint
    Automatically logs the action to audit log
    """
    # Get request metadata
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    # Prepare update data
    update_data = user_data.model_dump(exclude_none=True)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("errors.no_data")
        )

    updated_user = await admin_service.update_user_info(
        user_id=user_id,
        admin_id=current_admin.id,
        admin_email=current_admin.email,
        update_data=update_data,
        ip_address=ip_address,
        user_agent=user_agent
    )

    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("user.not_found")
        )

    # Convert to response model
    user_dict = updated_user.model_dump(by_alias=True)
    user_dict["_id"] = str(user_dict["_id"])

    return {
        "message": t("user.profile_updated"),
        "data": User(**user_dict)
    }


@router.post("/users/{user_id}/lock")
async def lock_user(
    user_id: str,
    request: Request,
    admin_service: AdminService = Depends(get_admin_service),
    current_admin: User = Depends(get_current_admin),
    t: Translator = Depends(get_translator)
):
    """
    Lock user account

    Admin only endpoint
    Automatically logs the action to audit log
    Cannot lock admin users
    """
    # Prevent admin from locking themselves
    if current_admin.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot lock your own account"
        )

    # Get request metadata
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    locked_user = await admin_service.lock_user(
        user_id=user_id,
        admin_id=current_admin.id,
        admin_email=current_admin.email,
        ip_address=ip_address,
        user_agent=user_agent
    )

    if not locked_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found or cannot be locked"
        )

    # Convert to response model
    user_dict = locked_user.model_dump(by_alias=True)
    user_dict["_id"] = str(user_dict["_id"])

    return {
        "message": "User account locked successfully",
        "data": User(**user_dict)
    }


@router.post("/users/{user_id}/unlock")
async def unlock_user(
    user_id: str,
    request: Request,
    admin_service: AdminService = Depends(get_admin_service),
    current_admin: User = Depends(get_current_admin),
    t: Translator = Depends(get_translator)
):
    """
    Unlock user account

    Admin only endpoint
    Automatically logs the action to audit log
    """
    # Get request metadata
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    unlocked_user = await admin_service.unlock_user(
        user_id=user_id,
        admin_id=current_admin.id,
        admin_email=current_admin.email,
        ip_address=ip_address,
        user_agent=user_agent
    )

    if not unlocked_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("user.not_found")
        )

    # Convert to response model
    user_dict = unlocked_user.model_dump(by_alias=True)
    user_dict["_id"] = str(user_dict["_id"])

    return {
        "message": "User account unlocked successfully",
        "data": User(**user_dict)
    }


@router.put("/users/{user_id}/role")
async def change_user_role(
    user_id: str,
    role_data: AdminChangeRole,
    request: Request,
    admin_service: AdminService = Depends(get_admin_service),
    current_admin: User = Depends(get_current_admin),
    t: Translator = Depends(get_translator)
):
    """
    Change user role (USER <-> ADMIN)

    Admin only endpoint
    Automatically logs the action to audit log
    """
    # Prevent admin from changing their own role
    if current_admin.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own role"
        )

    # Get request metadata
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    updated_user = await admin_service.change_user_role(
        user_id=user_id,
        new_role=role_data.role,
        admin_id=current_admin.id,
        admin_email=current_admin.email,
        ip_address=ip_address,
        user_agent=user_agent
    )

    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("user.not_found")
        )

    # Convert to response model
    user_dict = updated_user.model_dump(by_alias=True)
    user_dict["_id"] = str(user_dict["_id"])

    return {
        "message": "User role changed successfully",
        "data": User(**user_dict)
    }


@router.get("/audit-logs", response_model=AuditLogList)
async def get_audit_logs(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of records to return"),
    admin_id: Optional[str] = Query(None, description="Filter by admin ID"),
    target_user_id: Optional[str] = Query(None, description="Filter by target user ID"),
    action: Optional[AuditAction] = Query(None, description="Filter by action type"),
    start_date: Optional[datetime] = Query(None, description="Filter by date (from)"),
    end_date: Optional[datetime] = Query(None, description="Filter by date (to)"),
    audit_service: AuditLogService = Depends(get_audit_log_service),
    current_admin: User = Depends(get_current_admin)
):
    """
    Get audit logs with filtering and pagination

    Admin only endpoint
    """
    logs, total = await audit_service.get_logs(
        skip=skip,
        limit=limit,
        admin_id=admin_id,
        target_user_id=target_user_id,
        action=action,
        start_date=start_date,
        end_date=end_date
    )

    # Convert to response models
    from app.schemas.audit_log import AuditLog
    log_list = []
    for log in logs:
        log_dict = log.model_dump(by_alias=True)
        log_dict["_id"] = str(log_dict["_id"])
        log_dict["admin_id"] = str(log_dict["admin_id"])
        log_dict["target_user_id"] = str(log_dict["target_user_id"])
        log_list.append(AuditLog(**log_dict))

    return AuditLogList(
        logs=log_list,
        total=total,
        skip=skip,
        limit=limit
    )


@router.get("/audit-logs/user/{user_id}", response_model=AuditLogList)
async def get_user_audit_logs(
    user_id: str,
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of records to return"),
    audit_service: AuditLogService = Depends(get_audit_log_service),
    current_admin: User = Depends(get_current_admin),
    t: Translator = Depends(get_translator)
):
    """
    Get audit logs for a specific user

    Admin only endpoint
    """
    logs, total = await audit_service.get_logs_by_target_user(
        target_user_id=user_id,
        skip=skip,
        limit=limit
    )

    # Convert to response models
    from app.schemas.audit_log import AuditLog
    log_list = []
    for log in logs:
        log_dict = log.model_dump(by_alias=True)
        log_dict["_id"] = str(log_dict["_id"])
        log_dict["admin_id"] = str(log_dict["admin_id"])
        log_dict["target_user_id"] = str(log_dict["target_user_id"])
        log_list.append(AuditLog(**log_dict))

    return AuditLogList(
        logs=log_list,
        total=total,
        skip=skip,
        limit=limit
    )
