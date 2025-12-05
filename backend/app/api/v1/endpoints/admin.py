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
from app.schemas.category import CategoryResponse, CategoryCreate, CategoryUpdate
from app.schemas.tag import TagResponse, TagCreate, TagUpdate
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


# CATEGORY MANAGEMENT ENDPOINTS

@router.get("/categories", response_model=list[CategoryResponse])
async def get_all_categories_admin(
    include_inactive: bool = Query(False, description="Include deactivated categories"),
    current_user: User = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get all categories for admin management"""
    try:
        filter_query = {} if include_inactive else {"is_active": True}
        
        cursor = db.categories.find(filter_query).sort("name", 1)
        categories = []
        
        async for category in cursor:
            # Convert _id to id and remove _id to avoid validation conflicts
            category["id"] = str(category["_id"])
            del category["_id"]  # Remove the original _id field
            
            # Handle missing is_active field for existing records
            if "is_active" not in category:
                category["is_active"] = True
                
            try:
                category_response = CategoryResponse(**category)
                categories.append(category_response)
            except Exception as validation_error:
                raise
        
        return categories
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch categories: {str(e)}")


@router.post("/categories", response_model=CategoryResponse)
async def create_category_admin(
    category_data: CategoryCreate,
    current_user: User = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create new category (admin only)"""
    try:
        # Check if category name already exists
        existing = await db.categories.find_one({"name": category_data.name})
        if existing:
            raise HTTPException(status_code=400, detail="Category name already exists")
        
        # Create category document
        from bson import ObjectId
        category_doc = {
            "_id": ObjectId(),
            "name": category_data.name,
            "description": category_data.description,
            "post_count": 0,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        await db.categories.insert_one(category_doc)
        category_doc["id"] = str(category_doc["_id"])
        return CategoryResponse(**category_doc)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create category: {str(e)}")


@router.put("/categories/{category_id}", response_model=CategoryResponse)
async def update_category_admin(
    category_id: str,
    category_data: CategoryUpdate,
    current_user: User = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update category (admin only)"""
    try:
        print(f"Updating category {category_id} with data: {category_data}")
        print(f"Category data dict: {category_data.model_dump()}")
        
        # Validate ObjectId
        from bson import ObjectId
        try:
            obj_id = ObjectId(category_id)
        except Exception as e:
            print(f"Invalid ObjectId {category_id}: {e}")
            raise HTTPException(status_code=400, detail="Invalid category ID")
        
        # Check if category exists
        existing = await db.categories.find_one({"_id": obj_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Category not found")
        
        # Check if new name conflicts (if name is being changed)
        update_data = category_data.model_dump(exclude_unset=True)
        if "name" in update_data and update_data["name"] != existing["name"]:
            name_exists = await db.categories.find_one({"name": update_data["name"]})
            if name_exists:
                raise HTTPException(status_code=400, detail="Category name already exists")
        
        # Add updated timestamp
        update_data["updated_at"] = datetime.utcnow()
        
        # Update category
        result = await db.categories.update_one(
            {"_id": obj_id},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="No changes made")
        
        # Return updated category
        updated_category = await db.categories.find_one({"_id": obj_id})
        updated_category["id"] = str(updated_category["_id"])
        del updated_category["_id"]  # Remove _id to avoid conflicts
        return CategoryResponse(**updated_category)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Exception in update_category_admin: {e}")
        print(f"Exception type: {type(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to update category: {str(e)}")


@router.patch("/categories/{category_id}/toggle")
async def toggle_category_status(
    category_id: str,
    current_user: User = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Toggle category active status (soft delete/restore)"""
    try:
        # Validate ObjectId
        from bson import ObjectId
        try:
            obj_id = ObjectId(category_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid category ID")
        
        # Get current category
        category = await db.categories.find_one({"_id": obj_id})
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        
        # Toggle is_active status
        new_status = not category.get("is_active", True)
        
        await db.categories.update_one(
            {"_id": obj_id},
            {"$set": {"is_active": new_status, "updated_at": datetime.utcnow()}}
        )
        
        action = "activated" if new_status else "deactivated"
        return {"message": f"Category {action} successfully", "is_active": new_status}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to toggle category status: {str(e)}")


@router.delete("/categories/{category_id}")
async def delete_category_admin(
    category_id: str,
    current_user: User = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete category permanently (admin only)"""
    try:
        # Validate ObjectId
        from bson import ObjectId
        try:
            obj_id = ObjectId(category_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid category ID")
        
        # Check if category exists
        category = await db.categories.find_one({"_id": obj_id})
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        
        # Check if category is used by any posts
        posts_count = await db.posts.count_documents({"category_id": obj_id})
        if posts_count > 0:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot delete category. It is used by {posts_count} posts."
            )
        
        # Delete category
        result = await db.categories.delete_one({"_id": obj_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=400, detail="Failed to delete category")
        
        return {"message": "Category deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete category: {str(e)}")


# TAG MANAGEMENT ENDPOINTS

@router.get("/tags", response_model=list[TagResponse])
async def get_all_tags_admin(
    include_inactive: bool = Query(False, description="Include deactivated tags"),
    current_user: User = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get all tags for admin management"""
    try:
        filter_query = {} if include_inactive else {"is_active": True}
        
        cursor = db.tags.find(filter_query).sort("name", 1)
        tags = []
        
        async for tag in cursor:
            # Convert _id to id and remove _id to avoid validation conflicts
            tag["id"] = str(tag["_id"])
            del tag["_id"]  # Remove the original _id field
            
            # Handle missing is_active field for existing records
            if "is_active" not in tag:
                tag["is_active"] = True
                
            # Convert created_by ObjectId to string
            if "created_by" in tag:
                tag["created_by"] = str(tag["created_by"])
                
            try:
                tag_response = TagResponse(**tag)
                tags.append(tag_response)
            except Exception as validation_error:
                raise
        
        return tags
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch tags: {str(e)}")


@router.post("/tags", response_model=TagResponse)
async def create_tag_admin(
    tag_data: TagCreate,
    current_user: User = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create new tag (admin only)"""
    try:
        # Check if tag name already exists
        existing = await db.tags.find_one({"name": tag_data.name})
        if existing:
            raise HTTPException(status_code=400, detail="Tag name already exists")
        
        # Create tag document
        from bson import ObjectId
        tag_doc = {
            "_id": ObjectId(),
            "name": tag_data.name,
            "description": tag_data.description,
            "post_count": 0,
            "is_active": True,
            "created_by": current_user.id,
            "created_at": datetime.utcnow()
        }
        
        await db.tags.insert_one(tag_doc)
        tag_doc["id"] = str(tag_doc["_id"])
        del tag_doc["_id"]  # Remove _id to avoid conflicts
        
        # created_by is already a string from current_user.id
        return TagResponse(**tag_doc)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create tag: {str(e)}")


@router.put("/tags/{tag_id}", response_model=TagResponse)
async def update_tag_admin(
    tag_id: str,
    tag_data: TagUpdate,
    current_user: User = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update tag (admin only)"""
    try:
        # Validate ObjectId
        from bson import ObjectId
        try:
            obj_id = ObjectId(tag_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid tag ID")
        
        # Check if tag exists
        existing = await db.tags.find_one({"_id": obj_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Tag not found")
        
        # Check if new name conflicts (if name is being changed)
        update_data = tag_data.model_dump(exclude_unset=True)
        if "name" in update_data and update_data["name"] != existing["name"]:
            name_exists = await db.tags.find_one({"name": update_data["name"]})
            if name_exists:
                raise HTTPException(status_code=400, detail="Tag name already exists")
        
        # Update tag
        result = await db.tags.update_one(
            {"_id": obj_id},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="No changes made")
        
        # Return updated tag
        updated_tag = await db.tags.find_one({"_id": obj_id})
        updated_tag["id"] = str(updated_tag["_id"])
        del updated_tag["_id"]  # Remove _id to avoid conflicts
        
        # Convert ObjectId fields to strings
        if "created_by" in updated_tag and updated_tag["created_by"]:
            updated_tag["created_by"] = str(updated_tag["created_by"])
            
        return TagResponse(**updated_tag)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update tag: {str(e)}")


@router.patch("/tags/{tag_id}/toggle")
async def toggle_tag_status(
    tag_id: str,
    current_user: User = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Toggle tag active status (soft delete/restore)"""
    try:
        # Validate ObjectId
        from bson import ObjectId
        try:
            obj_id = ObjectId(tag_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid tag ID")
        
        # Get current tag
        tag = await db.tags.find_one({"_id": obj_id})
        if not tag:
            raise HTTPException(status_code=404, detail="Tag not found")
        
        # Toggle is_active status
        new_status = not tag.get("is_active", True)
        
        await db.tags.update_one(
            {"_id": obj_id},
            {"$set": {"is_active": new_status}}
        )
        
        action = "activated" if new_status else "deactivated"
        return {"message": f"Tag {action} successfully", "is_active": new_status}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to toggle tag status: {str(e)}")


@router.delete("/tags/{tag_id}")
async def delete_tag_admin(
    tag_id: str,
    current_user: User = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete tag permanently (admin only)"""
    try:
        # Validate ObjectId
        from bson import ObjectId
        try:
            obj_id = ObjectId(tag_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid tag ID")
        
        # Check if tag exists
        tag = await db.tags.find_one({"_id": obj_id})
        if not tag:
            raise HTTPException(status_code=404, detail="Tag not found")
        
        # Check if tag is used by any posts
        posts_count = await db.posts.count_documents({"tags": obj_id})
        if posts_count > 0:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot delete tag. It is used by {posts_count} posts."
            )
        
        # Delete tag
        result = await db.tags.delete_one({"_id": obj_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=400, detail="Failed to delete tag")
        
        return {"message": "Tag deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete tag: {str(e)}")
