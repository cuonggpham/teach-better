from typing import Optional, List
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.models.answer import AnswerModel, CommentModel
from app.schemas.answer import AnswerCreate, AnswerUpdate, CommentCreate


class AnswerService:
    """
    Answer service for managing answers and comments
    """

    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db.answers

    async def create_answer(self, answer_data: AnswerCreate, author_id: str) -> AnswerModel:
        """
        Create a new answer
        """
        answer_dict = answer_data.model_dump()
        answer_dict["author_id"] = ObjectId(author_id)
        answer_dict["post_id"] = ObjectId(answer_data.post_id)
        answer_dict["created_at"] = datetime.utcnow()
        answer_dict["updated_at"] = datetime.utcnow()
        answer_dict["is_deleted"] = False
        answer_dict["is_accepted_solution"] = False
        answer_dict["votes"] = {"upvoted_by": [], "downvoted_by": [], "score": 0}
        answer_dict["comments"] = []

        result = await self.collection.insert_one(answer_dict)
        answer_dict["_id"] = result.inserted_id

        return AnswerModel(**answer_dict)

    async def get_answer_by_id(self, answer_id: str) -> Optional[AnswerModel]:
        """
        Get answer by ID
        """
        if not ObjectId.is_valid(answer_id):
            return None

        answer = await self.collection.find_one({"_id": ObjectId(answer_id), "is_deleted": False})
        if answer:
            return AnswerModel(**answer)
        return None

    async def get_answers_by_post(
        self,
        post_id: str,
        skip: int = 0,
        limit: int = 50,
        sort_by: str = "score"
    ) -> List[AnswerModel]:
        """
        Get answers for a post, sorted by score (most helpful first)
        """
        if not ObjectId.is_valid(post_id):
            return []

        # Sort by score descending (most helpful first), then by created_at
        cursor = self.collection.find({
            "post_id": ObjectId(post_id),
            "is_deleted": False
        }).sort([
            ("votes.score", -1),
            ("created_at", -1)
        ]).skip(skip).limit(limit)

        answers = await cursor.to_list(length=limit)
        return [AnswerModel(**answer) for answer in answers]

    async def update_answer(self, answer_id: str, answer_data: AnswerUpdate, user_id: str) -> Optional[AnswerModel]:
        """
        Update answer (only by author)
        """
        if not ObjectId.is_valid(answer_id):
            return None

        # Check if user is the author
        answer = await self.collection.find_one({
            "_id": ObjectId(answer_id),
            "author_id": ObjectId(user_id),
            "is_deleted": False
        })

        if not answer:
            return None

        update_dict = {k: v for k, v in answer_data.model_dump().items() if v is not None}
        update_dict["updated_at"] = datetime.utcnow()

        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(answer_id)},
            {"$set": update_dict},
            return_document=True
        )

        if result:
            return AnswerModel(**result)
        return None

    async def delete_answer(self, answer_id: str, user_id: str) -> bool:
        """
        Soft delete answer (only by author)
        """
        if not ObjectId.is_valid(answer_id):
            return False

        result = await self.collection.update_one(
            {"_id": ObjectId(answer_id), "author_id": ObjectId(user_id), "is_deleted": False},
            {"$set": {"is_deleted": True, "updated_at": datetime.utcnow()}}
        )

        return result.modified_count > 0

    async def vote_answer(self, answer_id: str, user_id: str, is_upvote: bool) -> Optional[AnswerModel]:
        """
        Vote on an answer (helpful or not helpful)
        User can only vote once per answer
        Author cannot vote on their own answer
        """
        if not ObjectId.is_valid(answer_id) or not ObjectId.is_valid(user_id):
            return None

        user_obj_id = ObjectId(user_id)
        answer = await self.collection.find_one({"_id": ObjectId(answer_id), "is_deleted": False})

        if not answer:
            return None
        
        # Prevent author from voting on their own answer
        if answer.get("author_id") == user_obj_id:
            return None

        upvoted_by = answer.get("votes", {}).get("upvoted_by", [])
        downvoted_by = answer.get("votes", {}).get("downvoted_by", [])

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
            {"_id": ObjectId(answer_id)},
            {"$set": {
                "votes.upvoted_by": upvoted_by,
                "votes.downvoted_by": downvoted_by,
                "votes.score": score,
                "updated_at": datetime.utcnow()
            }},
            return_document=True
        )

        if result:
            return AnswerModel(**result)
        return None

    async def add_comment(self, answer_id: str, comment_data: CommentCreate, author_id: str) -> Optional[AnswerModel]:
        """
        Add a comment to an answer
        """
        if not ObjectId.is_valid(answer_id) or not ObjectId.is_valid(author_id):
            return None

        comment = CommentModel(
            id=ObjectId(),
            author_id=ObjectId(author_id),
            content=comment_data.content,
            created_at=datetime.utcnow()
        )

        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(answer_id), "is_deleted": False},
            {
                "$push": {"comments": comment.model_dump(by_alias=True)},
                "$set": {"updated_at": datetime.utcnow()}
            },
            return_document=True
        )

        if result:
            return AnswerModel(**result)
        return None

    async def delete_comment(self, answer_id: str, comment_id: str, user_id: str) -> Optional[AnswerModel]:
        """
        Delete a comment from an answer (only by comment author)
        """
        if not ObjectId.is_valid(answer_id) or not ObjectId.is_valid(comment_id) or not ObjectId.is_valid(user_id):
            return None

        # First check if the comment belongs to the user
        answer = await self.collection.find_one({
            "_id": ObjectId(answer_id),
            "is_deleted": False,
            "comments": {
                "$elemMatch": {
                    "id": ObjectId(comment_id),
                    "author_id": ObjectId(user_id)
                }
            }
        })

        if not answer:
            return None

        # Remove the comment
        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(answer_id)},
            {
                "$pull": {"comments": {"id": ObjectId(comment_id)}},
                "$set": {"updated_at": datetime.utcnow()}
            },
            return_document=True
        )

        if result:
            return AnswerModel(**result)
        return None
