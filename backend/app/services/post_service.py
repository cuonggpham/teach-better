from typing import Optional, List
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.models.post import PostModel
from app.schemas.post import PostCreate, PostUpdate


class PostService:
    """
    Post service for forum post operations
    """

    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db.posts

    async def create_post(self, post_data: PostCreate, author_id: str) -> PostModel:
        """
        Create a new post
        """
        post_dict = post_data.model_dump()
        post_dict["author_id"] = ObjectId(author_id)
        post_dict["tag_ids"] = [ObjectId(tag_id) for tag_id in post_data.tag_ids] if post_data.tag_ids else []
        
        # Ensure created_at is set properly for sorting
        now = datetime.utcnow()
        post_dict["created_at"] = now
        post_dict["updated_at"] = now
        post_dict["answer_count"] = 0
        post_dict["view_count"] = 0
        post_dict["is_deleted"] = False

        print(f"[DEBUG] Creating post with created_at: {now}, title: {post_dict.get('title')}")
        
        result = await self.collection.insert_one(post_dict)
        post_dict["_id"] = result.inserted_id
        
        print(f"[DEBUG] Post created with ID: {result.inserted_id}")

        return PostModel(**post_dict)

    async def get_post_by_id(self, post_id: str) -> Optional[PostModel]:
        """
        Get post by ID and increment view count
        """
        if not ObjectId.is_valid(post_id):
            return None

        # Increment view count
        await self.collection.update_one(
            {"_id": ObjectId(post_id), "is_deleted": False},
            {"$inc": {"view_count": 1}}
        )

        post = await self.collection.find_one({"_id": ObjectId(post_id), "is_deleted": False})
        if post:
            return PostModel(**post)
        return None

    async def count_posts(
        self,
        author_id: Optional[str] = None,
        tag_ids: Optional[List[str]] = None,
        category: Optional[str] = None,
        search: Optional[str] = None
    ) -> int:
        """
        Count total posts with filters
        """
        query = {"is_deleted": False}

        if author_id and ObjectId.is_valid(author_id):
            query["author_id"] = ObjectId(author_id)

        if tag_ids:
            query["tag_ids"] = {"$in": [ObjectId(tag_id) for tag_id in tag_ids if ObjectId.is_valid(tag_id)]}

        if category:
            query["category"] = category

        if search:
            # Case-insensitive search in title, content, and author name
            query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"content": {"$regex": search, "$options": "i"}}
            ]

        count = await self.collection.count_documents(query)
        return count

    async def get_posts(
        self,
        skip: int = 0,
        limit: int = 20,
        author_id: Optional[str] = None,
        tag_ids: Optional[List[str]] = None,
        category: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: int = -1,
        search: Optional[str] = None
    ) -> List[PostModel]:
        """
        Get list of posts with filters and sorting
        """
        query = {"is_deleted": False}

        if author_id and ObjectId.is_valid(author_id):
            query["author_id"] = ObjectId(author_id)

        if tag_ids:
            query["tag_ids"] = {"$in": [ObjectId(tag_id) for tag_id in tag_ids if ObjectId.is_valid(tag_id)]}

        if category:
            query["category"] = category

        if search:
            # Case-insensitive search in title, content, and author name
            query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"content": {"$regex": search, "$options": "i"}}
            ]

        print(f"[DEBUG] get_posts query: {query}, sort_by: {sort_by}, sort_order: {sort_order}, skip: {skip}, limit: {limit}")
        
        cursor = self.collection.find(query).sort(sort_by, sort_order).skip(skip).limit(limit)
        posts = await cursor.to_list(length=limit)
        
        print(f"[DEBUG] Found {len(posts)} posts")
        for i, post in enumerate(posts[:5]):  # Show first 5 posts
            print(f"  [{i}] Title: {post.get('title', 'No title')[:50]}, created_at: {post.get('created_at')}, is_deleted: {post.get('is_deleted', 'N/A')}")

        return [PostModel(**post) for post in posts]

    async def update_post(self, post_id: str, post_data: PostUpdate, user_id: str) -> Optional[PostModel]:
        """
        Update post (only by author)
        """
        if not ObjectId.is_valid(post_id):
            return None

        # Check if user is the author
        post = await self.collection.find_one({
            "_id": ObjectId(post_id),
            "author_id": ObjectId(user_id),
            "is_deleted": False
        })

        if not post:
            return None

        update_dict = {k: v for k, v in post_data.model_dump().items() if v is not None}

        if "tag_ids" in update_dict and update_dict["tag_ids"]:
            update_dict["tag_ids"] = [ObjectId(tag_id) for tag_id in update_dict["tag_ids"]]

        update_dict["updated_at"] = datetime.utcnow()

        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(post_id)},
            {"$set": update_dict},
            return_document=True
        )

        if result:
            return PostModel(**result)
        return None

    async def delete_post(self, post_id: str, user_id: str) -> bool:
        """
        Soft delete post (only by author)
        """
        if not ObjectId.is_valid(post_id):
            return False

        result = await self.collection.update_one(
            {"_id": ObjectId(post_id), "author_id": ObjectId(user_id), "is_deleted": False},
            {"$set": {"is_deleted": True, "updated_at": datetime.utcnow()}}
        )

        return result.modified_count > 0

    async def increment_answer_count(self, post_id: str) -> bool:
        """
        Increment answer count for a post
        """
        if not ObjectId.is_valid(post_id):
            return False

        result = await self.collection.update_one(
            {"_id": ObjectId(post_id)},
            {"$inc": {"answer_count": 1}}
        )

        return result.modified_count > 0

    async def delete_post_by_admin(self, post_id: str) -> Optional[PostModel]:
        """
        Soft delete a post (admin only) by setting is_deleted flag
        """
        if not ObjectId.is_valid(post_id):
            return None

        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(post_id)},
            {
                "$set": {
                    "is_deleted": True,
                    "updated_at": datetime.utcnow()
                }
            },
            return_document=True
        )

        if result:
            return PostModel(**result)
        return None


    async def decrement_answer_count(self, post_id: str) -> bool:
        """
        Decrement answer count for a post
        """
        if not ObjectId.is_valid(post_id):
            return False

        result = await self.collection.update_one(
            {"_id": ObjectId(post_id)},
            {"$inc": {"answer_count": -1}}
        )

        return result.modified_count > 0
