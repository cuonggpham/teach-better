from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.schemas.post import Post, PostCreate, PostUpdate, PostList, PostWithAuthor
from app.services.post_service import PostService
from app.api.v1.endpoints.users import get_current_user
from app.schemas.user import User
from app.i18n.dependencies import get_translator, Translator

router = APIRouter()


def get_post_service(db: AsyncIOMotorDatabase = Depends(get_database)) -> PostService:
    """
    Dependency to get post service
    """
    return PostService(db)


@router.post("/", response_model=Post, status_code=status.HTTP_201_CREATED)
async def create_post(
    post_data: PostCreate,
    current_user: User = Depends(get_current_user),
    post_service: PostService = Depends(get_post_service),
    t: Translator = Depends(get_translator)
):
    """
    Create a new post (forum question)
    """
    post = await post_service.create_post(post_data, current_user.id)

    # Convert to response model
    post_dict = post.model_dump(by_alias=True)
    post_dict["_id"] = str(post_dict["_id"])
    post_dict["author_id"] = str(post_dict["author_id"])
    post_dict["tag_ids"] = [str(tag_id) for tag_id in post_dict.get("tag_ids", [])]

    return Post(**post_dict)


@router.get("/{post_id}")
async def get_post(
    post_id: str,
    post_service: PostService = Depends(get_post_service),
    db: AsyncIOMotorDatabase = Depends(get_database),
    t: Translator = Depends(get_translator)
):
    """
    Get a post by ID
    """
    post = await post_service.get_post_by_id(post_id)

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("errors.not_found")
        )

    # Convert to response model
    post_dict = post.model_dump(by_alias=True)
    post_dict["_id"] = str(post_dict["_id"])
    author_id_str = str(post_dict["author_id"])
    post_dict["author_id"] = author_id_str
    
    tag_ids = post_dict.get("tag_ids", [])
    post_dict["tag_ids"] = [str(tag_id) for tag_id in tag_ids]

    # Get author info
    from bson import ObjectId
    author = await db.users.find_one({"_id": ObjectId(author_id_str)})
    if author:
        post_dict["author"] = {
            "_id": str(author["_id"]),
            "name": author.get("name", ""),
            "email": author.get("email", ""),
            "avatar_url": author.get("avatar_url", "")
        }
    
    # Get tags info
    post_dict["tags"] = []
    if tag_ids:
        tag_object_ids = [ObjectId(tag_id) for tag_id in tag_ids if ObjectId.is_valid(str(tag_id))]
        if tag_object_ids:
            tags_cursor = db.tags.find({"_id": {"$in": tag_object_ids}})
            tags = await tags_cursor.to_list(length=len(tag_object_ids))
            post_dict["tags"] = [
                {
                    "_id": str(tag["_id"]),
                    "name": tag.get("name", ""),
                    "description": tag.get("description", "")
                }
                for tag in tags
            ]

    return post_dict


@router.get("/")
async def get_posts(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    author_id: Optional[str] = None,
    tag_ids: Optional[List[str]] = Query(None),
    category: Optional[str] = Query(None, description="Filter by category name"),
    sort_by: str = Query("created_at", pattern="^(created_at|votes.score|view_count|answer_count)$"),
    sort_order: int = Query(-1, ge=-1, le=1),
    search: Optional[str] = Query(None, description="Search in post title and content"),
    post_service: PostService = Depends(get_post_service),
    db: AsyncIOMotorDatabase = Depends(get_database),
    t: Translator = Depends(get_translator)
):
    """
    Get list of posts with filters and sorting
    """
    # Get total count
    total = await post_service.count_posts(
        author_id=author_id,
        tag_ids=tag_ids,
        category=category,
        search=search
    )
    
    # Get posts
    posts = await post_service.get_posts(
        skip=skip,
        limit=limit,
        author_id=author_id,
        tag_ids=tag_ids,
        category=category,
        sort_by=sort_by,
        sort_order=sort_order,
        search=search
    )

    # Convert to response models with author info and tags
    post_list = []
    from bson import ObjectId
    for post in posts:
        post_dict = post.model_dump(by_alias=True)
        post_dict["_id"] = str(post_dict["_id"])
        author_id_str = str(post_dict["author_id"])
        post_dict["author_id"] = author_id_str
        
        tag_ids = post_dict.get("tag_ids", [])
        post_dict["tag_ids"] = [str(tag_id) for tag_id in tag_ids]
        
        # Get author info
        author = await db.users.find_one({"_id": ObjectId(author_id_str)})
        if author:
            post_dict["author"] = {
                "_id": str(author["_id"]),
                "name": author.get("name", ""),
                "email": author.get("email", ""),
                "avatar_url": author.get("avatar_url", "")
            }
        
        # Get tags info
        post_dict["tags"] = []
        if tag_ids:
            tag_object_ids = [ObjectId(tag_id) for tag_id in tag_ids if ObjectId.is_valid(str(tag_id))]
            if tag_object_ids:
                tags_cursor = db.tags.find({"_id": {"$in": tag_object_ids}})
                tags = await tags_cursor.to_list(length=len(tag_object_ids))
                post_dict["tags"] = [
                    {
                        "_id": str(tag["_id"]),
                        "name": tag.get("name", ""),
                        "description": tag.get("description", "")
                    }
                    for tag in tags
                ]
        
        post_list.append(post_dict)

    return {"posts": post_list, "total": total}


@router.put("/{post_id}", response_model=Post)
async def update_post(
    post_id: str,
    post_data: PostUpdate,
    current_user: User = Depends(get_current_user),
    post_service: PostService = Depends(get_post_service),
    t: Translator = Depends(get_translator)
):
    """
    Update a post (only by author)
    """
    post = await post_service.update_post(post_id, post_data, current_user.id)

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("errors.not_found")
        )

    # Convert to response model
    post_dict = post.model_dump(by_alias=True)
    post_dict["_id"] = str(post_dict["_id"])
    post_dict["author_id"] = str(post_dict["author_id"])
    post_dict["tag_ids"] = [str(tag_id) for tag_id in post_dict.get("tag_ids", [])]

    return Post(**post_dict)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: str,
    current_user: User = Depends(get_current_user),
    post_service: PostService = Depends(get_post_service),
    t: Translator = Depends(get_translator)
):
    """
    Delete a post (only by author)
    """
    success = await post_service.delete_post(post_id, current_user.id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("errors.not_found")
        )

    return None
