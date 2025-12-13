from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.schemas.post import Post
from app.services.user_service import UserService
from app.services.post_service import PostService
from app.api.v1.endpoints.users import get_current_user
from app.schemas.user import User
from app.i18n.dependencies import get_translator, Translator

router = APIRouter()


def get_user_service(db: AsyncIOMotorDatabase = Depends(get_database)) -> UserService:
    """
    Dependency to get user service
    """
    return UserService(db)


def get_post_service(db: AsyncIOMotorDatabase = Depends(get_database)) -> PostService:
    """
    Dependency to get post service
    """
    return PostService(db)


@router.post("/{post_id}", response_model=dict)
async def add_bookmark(
    post_id: str,
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
    post_service: PostService = Depends(get_post_service),
    t: Translator = Depends(get_translator)
):
    """
    Add a post to user's bookmarks
    """
    # Check if post exists
    post = await post_service.get_post_by_id(post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("errors.not_found")
        )

    user = await user_service.add_bookmark(current_user.id, post_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("common.error")
        )

    return {"message": t("common.success")}


@router.delete("/{post_id}", response_model=dict)
async def remove_bookmark(
    post_id: str,
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
    t: Translator = Depends(get_translator)
):
    """
    Remove a post from user's bookmarks
    """
    user = await user_service.remove_bookmark(current_user.id, post_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("common.error")
        )

    return {"message": t("common.success")}


@router.get("/", response_model=List[dict])
async def get_bookmarks(
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
    post_service: PostService = Depends(get_post_service),
    t: Translator = Depends(get_translator)
):
    """
    Get user's bookmarked posts with bookmark timestamps
    """
    # Get user data including bookmarks
    user_data = await user_service.get_user_by_id(current_user.id)
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("errors.not_found")
        )

    # Get bookmarks with timestamps
    bookmarks = user_data.bookmarks if hasattr(user_data, 'bookmarks') else []
    
    # If no new format bookmarks, fall back to old format
    if not bookmarks and hasattr(user_data, 'bookmarked_post_ids'):
        bookmarked_post_ids = user_data.bookmarked_post_ids
        posts = []
        for post_id in bookmarked_post_ids:
            post = await post_service.get_post_by_id(str(post_id))
            if post:
                post_dict = post.model_dump(by_alias=True)
                post_dict["_id"] = str(post_dict["_id"])
                post_dict["author_id"] = str(post_dict["author_id"])
                post_dict["tag_ids"] = [str(tag_id) for tag_id in post_dict.get("tag_ids", [])]
                # Add bookmarked_at as the post creation date for legacy bookmarks
                post_dict["bookmarked_at"] = post_dict.get("created_at")
                posts.append(post_dict)
        return posts

    # Fetch full post details with bookmark timestamps
    result = []
    for bookmark in bookmarks:
        post_id = str(bookmark.post_id) if hasattr(bookmark, 'post_id') else str(bookmark.get('post_id'))
        post = await post_service.get_post_by_id(post_id)
        if post:
            post_dict = post.model_dump(by_alias=True)
            post_dict["_id"] = str(post_dict["_id"])
            post_dict["author_id"] = str(post_dict["author_id"])
            post_dict["tag_ids"] = [str(tag_id) for tag_id in post_dict.get("tag_ids", [])]
            # Add bookmark timestamp
            created_at = bookmark.created_at if hasattr(bookmark, 'created_at') else bookmark.get('created_at')
            post_dict["bookmarked_at"] = created_at.isoformat() if created_at else None
            result.append(post_dict)

    return result
