from typing import Optional, List
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.models.category import CategoryModel
from app.schemas.category import CategoryCreate, CategoryUpdate


class CategoryService:
    """
    Category service for managing post categories
    """

    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db.categories

    async def create_category(self, category_data: CategoryCreate) -> CategoryModel:
        """
        Create a new category
        """
        category_dict = category_data.model_dump()
        
        now = datetime.utcnow()
        category_dict["created_at"] = now
        category_dict["updated_at"] = now
        category_dict["post_count"] = 0

        result = await self.collection.insert_one(category_dict)
        category_dict["_id"] = result.inserted_id

        return CategoryModel(**category_dict)

    async def get_category_by_id(self, category_id: str) -> Optional[CategoryModel]:
        """
        Get category by ID
        """
        if not ObjectId.is_valid(category_id):
            return None

        category = await self.collection.find_one({"_id": ObjectId(category_id)})
        if category:
            return CategoryModel(**category)
        return None

    async def get_category_by_name(self, name: str) -> Optional[CategoryModel]:
        """
        Get category by name
        """
        category = await self.collection.find_one({"name": name})
        if category:
            return CategoryModel(**category)
        return None

    async def get_categories(
        self,
        skip: int = 0,
        limit: int = 100
    ) -> List[CategoryModel]:
        """
        Get list of all categories
        """
        cursor = self.collection.find().sort("name", 1).skip(skip).limit(limit)
        categories = await cursor.to_list(length=limit)
        return [CategoryModel(**category) for category in categories]

    async def count_categories(self) -> int:
        """
        Count total categories
        """
        count = await self.collection.count_documents({})
        return count

    async def update_category(self, category_id: str, category_data: CategoryUpdate) -> Optional[CategoryModel]:
        """
        Update category
        """
        if not ObjectId.is_valid(category_id):
            return None

        update_dict = {k: v for k, v in category_data.model_dump().items() if v is not None}
        update_dict["updated_at"] = datetime.utcnow()

        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(category_id)},
            {"$set": update_dict},
            return_document=True
        )

        if result:
            return CategoryModel(**result)
        return None

    async def delete_category(self, category_id: str) -> bool:
        """
        Delete category
        """
        if not ObjectId.is_valid(category_id):
            return False

        result = await self.collection.delete_one({"_id": ObjectId(category_id)})
        return result.deleted_count > 0

    async def increment_post_count(self, name: str) -> bool:
        """
        Increment post count for a category
        """
        result = await self.collection.update_one(
            {"name": name},
            {"$inc": {"post_count": 1}}
        )
        return result.modified_count > 0

    async def decrement_post_count(self, name: str) -> bool:
        """
        Decrement post count for a category
        """
        result = await self.collection.update_one(
            {"name": name},
            {"$inc": {"post_count": -1}}
        )
        return result.modified_count > 0

    async def get_popular_categories(self, limit: int = 10) -> List[CategoryModel]:
        """
        Get categories sorted by post count
        """
        cursor = self.collection.find().sort("post_count", -1).limit(limit)
        categories = await cursor.to_list(length=limit)
        return [CategoryModel(**category) for category in categories]
