from typing import Optional, List
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.models.post import PostModel, PostStatus
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
        post_dict["status"] = PostStatus.OPEN
        post_dict["votes"] = {"upvoted_by": [], "downvoted_by": [], "score": 0}

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
        status: Optional[PostStatus] = None,
        author_id: Optional[str] = None,
        tag_ids: Optional[List[str]] = None
    ) -> int:
        """
        Count total posts with filters
        """
        query = {"is_deleted": False}

        if status:
            query["status"] = status

        if author_id and ObjectId.is_valid(author_id):
            query["author_id"] = ObjectId(author_id)

        if tag_ids:
            query["tag_ids"] = {"$in": [ObjectId(tag_id) for tag_id in tag_ids if ObjectId.is_valid(tag_id)]}

        count = await self.collection.count_documents(query)
        return count

    async def get_posts(
        self,
        skip: int = 0,
        limit: int = 20,
        status: Optional[PostStatus] = None,
        author_id: Optional[str] = None,
        tag_ids: Optional[List[str]] = None,
        sort_by: str = "created_at",
        sort_order: int = -1
    ) -> List[PostModel]:
        """
        Get list of posts with filters and sorting
        """
        query = {"is_deleted": False}

        if status:
            query["status"] = status

        if author_id and ObjectId.is_valid(author_id):
            query["author_id"] = ObjectId(author_id)

        if tag_ids:
            query["tag_ids"] = {"$in": [ObjectId(tag_id) for tag_id in tag_ids if ObjectId.is_valid(tag_id)]}

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

    async def vote_post(self, post_id: str, user_id: str, is_upvote: bool) -> Optional[PostModel]:
        """
        Vote on a post (upvote or downvote)
        User can only vote once. Voting again removes the vote or switches vote type.
        Author cannot vote on their own post.
        """
        if not ObjectId.is_valid(post_id) or not ObjectId.is_valid(user_id):
            return None

        user_obj_id = ObjectId(user_id)
        post = await self.collection.find_one({"_id": ObjectId(post_id), "is_deleted": False})

        if not post:
            return None
        
        # Prevent author from voting on their own post
        if post.get("author_id") == user_obj_id:
            return None

        upvoted_by = post.get("votes", {}).get("upvoted_by", [])
        downvoted_by = post.get("votes", {}).get("downvoted_by", [])

        # Check if user already voted this way
        already_upvoted = user_obj_id in upvoted_by
        already_downvoted = user_obj_id in downvoted_by

        # Remove user from both lists first
        if user_obj_id in upvoted_by:
            upvoted_by.remove(user_obj_id)
        if user_obj_id in downvoted_by:
            downvoted_by.remove(user_obj_id)

        # Add to appropriate list only if not already voted the same way (toggle behavior)
        if is_upvote and not already_upvoted:
            upvoted_by.append(user_obj_id)
        elif not is_upvote and not already_downvoted:
            downvoted_by.append(user_obj_id)

        score = len(upvoted_by) - len(downvoted_by)

        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(post_id)},
            {"$set": {
                "votes.upvoted_by": upvoted_by,
                "votes.downvoted_by": downvoted_by,
                "votes.score": score,
                "updated_at": datetime.utcnow()
            }},
            return_document=True
        )

        if result:
            return PostModel(**result)
        return None

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
