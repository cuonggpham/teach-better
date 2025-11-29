from typing import Optional, List
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.models.tag import TagModel
from app.schemas.tag import TagCreate, TagUpdate


class TagService:
    """
    Tag service for managing post tags (detailed topics)
    Tags provide fine-grained categorization within subject categories
    """

    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db.tags

    async def create_tag(self, tag_data: TagCreate, user_id: str) -> TagModel:
        """
        Create a new tag
        """
        tag_dict = tag_data.model_dump()
        
        now = datetime.utcnow()
        tag_dict["created_at"] = now
        tag_dict["post_count"] = 0
        tag_dict["created_by"] = ObjectId(user_id)

        result = await self.collection.insert_one(tag_dict)
        tag_dict["_id"] = result.inserted_id

        return TagModel(**tag_dict)

    async def get_tag_by_id(self, tag_id: str) -> Optional[TagModel]:
        """
        Get tag by ID
        """
        if not ObjectId.is_valid(tag_id):
            return None

        tag = await self.collection.find_one({"_id": ObjectId(tag_id)})
        if tag:
            return TagModel(**tag)
        return None

    async def get_tag_by_name(self, name: str) -> Optional[TagModel]:
        """
        Get tag by name (case-insensitive)
        """
        tag = await self.collection.find_one({"name": {"$regex": f"^{name}$", "$options": "i"}})
        if tag:
            return TagModel(**tag)
        return None

    async def get_tags(
        self,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None
    ) -> List[TagModel]:
        """
        Get list of tags with optional search
        """
        query = {}
        if search:
            query["name"] = {"$regex": search, "$options": "i"}

        cursor = self.collection.find(query).sort("post_count", -1).skip(skip).limit(limit)
        tags = await cursor.to_list(length=limit)
        return [TagModel(**tag) for tag in tags]

    async def get_tags_by_ids(self, tag_ids: List[str]) -> List[TagModel]:
        """
        Get multiple tags by their IDs
        """
        valid_ids = [ObjectId(tid) for tid in tag_ids if ObjectId.is_valid(tid)]
        if not valid_ids:
            return []

        cursor = self.collection.find({"_id": {"$in": valid_ids}})
        tags = await cursor.to_list(length=len(valid_ids))
        return [TagModel(**tag) for tag in tags]

    async def count_tags(self, search: Optional[str] = None) -> int:
        """
        Count total tags
        """
        query = {}
        if search:
            query["name"] = {"$regex": search, "$options": "i"}
        
        count = await self.collection.count_documents(query)
        return count

    async def update_tag(self, tag_id: str, tag_data: TagUpdate) -> Optional[TagModel]:
        """
        Update tag
        """
        if not ObjectId.is_valid(tag_id):
            return None

        update_dict = {k: v for k, v in tag_data.model_dump().items() if v is not None}

        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(tag_id)},
            {"$set": update_dict},
            return_document=True
        )

        if result:
            return TagModel(**result)
        return None

    async def delete_tag(self, tag_id: str) -> bool:
        """
        Delete tag
        """
        if not ObjectId.is_valid(tag_id):
            return False

        result = await self.collection.delete_one({"_id": ObjectId(tag_id)})
        return result.deleted_count > 0

    async def increment_post_count(self, tag_id: str) -> bool:
        """
        Increment post count for a tag
        """
        if not ObjectId.is_valid(tag_id):
            return False

        result = await self.collection.update_one(
            {"_id": ObjectId(tag_id)},
            {"$inc": {"post_count": 1}}
        )
        return result.modified_count > 0

    async def decrement_post_count(self, tag_id: str) -> bool:
        """
        Decrement post count for a tag
        """
        if not ObjectId.is_valid(tag_id):
            return False

        result = await self.collection.update_one(
            {"_id": ObjectId(tag_id)},
            {"$inc": {"post_count": -1}}
        )
        return result.modified_count > 0

    async def get_popular_tags(self, limit: int = 20) -> List[TagModel]:
        """
        Get tags sorted by post count (most popular)
        """
        cursor = self.collection.find().sort("post_count", -1).limit(limit)
        tags = await cursor.to_list(length=limit)
        return [TagModel(**tag) for tag in tags]
