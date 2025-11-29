from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.schemas.category import Category, CategoryCreate, CategoryUpdate, CategoryList
from app.services.category_service import CategoryService
from app.api.v1.endpoints.users import get_current_user
from app.schemas.user import User
from app.i18n.dependencies import get_translator, Translator

router = APIRouter()


def get_category_service(db: AsyncIOMotorDatabase = Depends(get_database)) -> CategoryService:
    """
    Dependency to get category service
    """
    return CategoryService(db)


@router.post("/", response_model=Category, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: CategoryCreate,
    current_user: User = Depends(get_current_user),
    category_service: CategoryService = Depends(get_category_service),
    t: Translator = Depends(get_translator)
):
    """
    Create a new category (admin only)
    """
    # Check if category already exists
    existing = await category_service.get_category_by_name(category_data.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("errors.category_exists", "Category already exists")
        )

    category = await category_service.create_category(category_data)

    # Convert to response model
    category_dict = category.model_dump(by_alias=True)
    category_dict["_id"] = str(category_dict["_id"])

    return Category(**category_dict)


@router.get("/", response_model=CategoryList)
async def get_categories(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    category_service: CategoryService = Depends(get_category_service),
    t: Translator = Depends(get_translator)
):
    """
    Get list of all categories
    """
    # Get total count
    total = await category_service.count_categories()
    
    # Get categories
    categories = await category_service.get_categories(skip=skip, limit=limit)

    # Convert to response models
    category_list = []
    for category in categories:
        category_dict = category.model_dump(by_alias=True)
        category_dict["_id"] = str(category_dict["_id"])
        category_list.append(Category(**category_dict))

    return {"categories": category_list, "total": total}


@router.get("/popular", response_model=List[Category])
async def get_popular_categories(
    limit: int = Query(10, ge=1, le=50),
    category_service: CategoryService = Depends(get_category_service),
    t: Translator = Depends(get_translator)
):
    """
    Get popular categories sorted by post count
    """
    categories = await category_service.get_popular_categories(limit=limit)

    # Convert to response models
    category_list = []
    for category in categories:
        category_dict = category.model_dump(by_alias=True)
        category_dict["_id"] = str(category_dict["_id"])
        category_list.append(Category(**category_dict))

    return category_list


@router.get("/{category_id}", response_model=Category)
async def get_category(
    category_id: str,
    category_service: CategoryService = Depends(get_category_service),
    t: Translator = Depends(get_translator)
):
    """
    Get a category by ID
    """
    category = await category_service.get_category_by_id(category_id)

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("errors.not_found")
        )

    # Convert to response model
    category_dict = category.model_dump(by_alias=True)
    category_dict["_id"] = str(category_dict["_id"])

    return Category(**category_dict)


@router.put("/{category_id}", response_model=Category)
async def update_category(
    category_id: str,
    category_data: CategoryUpdate,
    current_user: User = Depends(get_current_user),
    category_service: CategoryService = Depends(get_category_service),
    t: Translator = Depends(get_translator)
):
    """
    Update a category (admin only)
    """
    category = await category_service.update_category(category_id, category_data)

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("errors.not_found")
        )

    # Convert to response model
    category_dict = category.model_dump(by_alias=True)
    category_dict["_id"] = str(category_dict["_id"])

    return Category(**category_dict)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: str,
    current_user: User = Depends(get_current_user),
    category_service: CategoryService = Depends(get_category_service),
    t: Translator = Depends(get_translator)
):
    """
    Delete a category (admin only)
    """
    success = await category_service.delete_category(category_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("errors.not_found")
        )

    return None
