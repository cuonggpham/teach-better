from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.schemas.notification import Notification, NotificationCount
from app.services.notification_service import NotificationService
from app.api.v1.endpoints.users import get_current_user
from app.schemas.user import User
from app.i18n.dependencies import get_translator, Translator

router = APIRouter()


def get_notification_service(db: AsyncIOMotorDatabase = Depends(get_database)) -> NotificationService:
    """
    Dependency to get notification service
    """
    return NotificationService(db)


@router.get("/", response_model=List[Notification])
async def get_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    unread_only: bool = Query(False),
    current_user: User = Depends(get_current_user),
    notification_service: NotificationService = Depends(get_notification_service),
    db: AsyncIOMotorDatabase = Depends(get_database),
    t: Translator = Depends(get_translator)
):
    """
    Get notifications for current user
    """
    from bson import ObjectId
    
    notifications = await notification_service.get_user_notifications(
        current_user.id,
        skip,
        limit,
        unread_only
    )

    # Convert to response models and lookup actor info
    notification_list = []
    for notification in notifications:
        notification_dict = notification.model_dump(by_alias=True)
        notification_dict["_id"] = str(notification_dict["_id"])
        notification_dict["user_id"] = str(notification_dict["user_id"])
        
        # Lookup actor info if actor_id exists
        actor_name = None
        actor_avatar = None
        if notification_dict.get("actor_id"):
            actor_id = notification_dict["actor_id"]
            notification_dict["actor_id"] = str(actor_id)
            
            # Lookup user info
            if ObjectId.is_valid(str(actor_id)):
                actor = await db.users.find_one({"_id": ObjectId(str(actor_id))})
                if actor:
                    actor_name = actor.get("name", "Unknown User")
                    actor_avatar = actor.get("avatar_url")
        
        notification_dict["actor_name"] = actor_name
        notification_dict["actor_avatar"] = actor_avatar
        notification_list.append(Notification(**notification_dict))

    return notification_list


@router.get("/unread-count", response_model=NotificationCount)
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    notification_service: NotificationService = Depends(get_notification_service),
    t: Translator = Depends(get_translator)
):
    """
    Get count of unread notifications for current user
    """
    count = await notification_service.get_unread_count(current_user.id)

    return NotificationCount(count=count)


@router.post("/{notification_id}/mark-read", response_model=dict)
async def mark_notification_as_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    notification_service: NotificationService = Depends(get_notification_service),
    t: Translator = Depends(get_translator)
):
    """
    Mark a notification as read
    """
    success = await notification_service.mark_as_read(notification_id, current_user.id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("errors.not_found")
        )

    return {"message": t("common.success")}


@router.post("/mark-all-read", response_model=dict)
async def mark_all_notifications_as_read(
    current_user: User = Depends(get_current_user),
    notification_service: NotificationService = Depends(get_notification_service),
    t: Translator = Depends(get_translator)
):
    """
    Mark all notifications as read for current user
    """
    await notification_service.mark_all_as_read(current_user.id)

    return {"message": t("common.success")}


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    notification_service: NotificationService = Depends(get_notification_service),
    t: Translator = Depends(get_translator)
):
    """
    Delete a notification
    """
    success = await notification_service.delete_notification(notification_id, current_user.id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("errors.not_found")
        )

    return None
