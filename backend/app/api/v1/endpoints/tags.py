from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.schemas.tag import Tag, TagCreate, TagUpdate
from app.services.tag_service import TagService
from app.api.v1.endpoints.users import get_current_user
from app.schemas.user import User
from app.i18n.dependencies import get_translator, Translator

router = APIRouter()


def get_tag_service(db: AsyncIOMotorDatabase = Depends(get_database)) -> TagService:
    """
    Dependency to get tag service
    """
    return TagService(db)


@router.post("/", response_model=Tag, status_code=status.HTTP_201_CREATED)
async def create_tag(
    tag_data: TagCreate,
    current_user: User = Depends(get_current_user),
    tag_service: TagService = Depends(get_tag_service),
    t: Translator = Depends(get_translator)
):
    """
    Create a new tag (users can create custom tags)
    """
    # Check if tag already exists
    existing_tag = await tag_service.get_tag_by_name(tag_data.name)
    if existing_tag:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("tag.already_exists")
        )

    tag = await tag_service.create_tag(tag_data, current_user.id)

    # Convert to response model
    tag_dict = tag.model_dump(by_alias=True)
    tag_dict["_id"] = str(tag_dict["_id"])
    tag_dict["created_by"] = str(tag_dict["created_by"])

    return Tag(**tag_dict)


@router.get("/{tag_id}", response_model=Tag)
async def get_tag(
    tag_id: str,
    tag_service: TagService = Depends(get_tag_service),
    t: Translator = Depends(get_translator)
):
    """
    Get tag by ID
    """
    tag = await tag_service.get_tag_by_id(tag_id)
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("tag.not_found")
        )

    tag_dict = tag.model_dump(by_alias=True)
    tag_dict["_id"] = str(tag_dict["_id"])
    tag_dict["created_by"] = str(tag_dict["created_by"])

    return Tag(**tag_dict)


@router.get("/")
async def get_tags(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    search: Optional[str] = Query(None),
    tag_service: TagService = Depends(get_tag_service),
    t: Translator = Depends(get_translator)
):
    """
    Get list of tags with optional search
    """
    tags = await tag_service.get_tags(skip=skip, limit=limit, search=search)
    total = await tag_service.count_tags(search=search)

    tags_list = []
    for tag in tags:
        tag_dict = tag.model_dump(by_alias=True)
        tag_dict["_id"] = str(tag_dict["_id"])
        tag_dict["created_by"] = str(tag_dict["created_by"])
        tags_list.append(tag_dict)

    return {
        "tags": tags_list,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/popular/list")
async def get_popular_tags(
    limit: int = Query(20, ge=1, le=50),
    tag_service: TagService = Depends(get_tag_service),
    t: Translator = Depends(get_translator)
):
    """
    Get most popular tags sorted by post count
    """
    tags = await tag_service.get_popular_tags(limit=limit)

    tags_list = []
    for tag in tags:
        tag_dict = tag.model_dump(by_alias=True)
        tag_dict["_id"] = str(tag_dict["_id"])
        tag_dict["created_by"] = str(tag_dict["created_by"])
        tags_list.append(tag_dict)

    return {
        "tags": tags_list,
        "total": len(tags_list)
    }


@router.put("/{tag_id}", response_model=Tag)
async def update_tag(
    tag_id: str,
    tag_data: TagUpdate,
    current_user: User = Depends(get_current_user),
    tag_service: TagService = Depends(get_tag_service),
    t: Translator = Depends(get_translator)
):
    """
    Update tag (admin or tag creator only)
    """
    tag = await tag_service.get_tag_by_id(tag_id)
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("tag.not_found")
        )

    # Check if tag name already exists (if changing name)
    if tag_data.name and tag_data.name != tag.name:
        existing_tag = await tag_service.get_tag_by_name(tag_data.name)
        if existing_tag:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=t("tag.already_exists")
            )

    updated_tag = await tag_service.update_tag(tag_id, tag_data)
    if not updated_tag:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=t("tag.update_failed")
        )

    tag_dict = updated_tag.model_dump(by_alias=True)
    tag_dict["_id"] = str(tag_dict["_id"])
    tag_dict["created_by"] = str(tag_dict["created_by"])

    return Tag(**tag_dict)


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(
    tag_id: str,
    current_user: User = Depends(get_current_user),
    tag_service: TagService = Depends(get_tag_service),
    t: Translator = Depends(get_translator)
):
    """
    Delete tag (admin only)
    """
    tag = await tag_service.get_tag_by_id(tag_id)
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("tag.not_found")
        )

    success = await tag_service.delete_tag(tag_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=t("tag.delete_failed")
        )

    return None
