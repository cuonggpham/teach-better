"""
AI Diagnosis Service for managing lecture diagnostics.

This module handles CRUD operations and AI analysis for lecture diagnoses.
"""

import json
from datetime import datetime
from typing import List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.ai_diagnosis import (
    AIDiagnosisModel,
    AIResultModel,
    GeneratedQuestionModel,
    DiagnosisStatus,
    QuestionType
)
from app.schemas.ai_diagnosis import (
    AIDiagnosisCreate,
    AIDiagnosisUpdate,
    QuestionAnswerSubmit,
    DiagnosisEvaluation,
    FeedbackItem
)
from app.services.llm_service import (
    call_llm,
    build_diagnosis_prompt,
    build_question_generation_prompt,
    build_evaluation_prompt,
    parse_llm_json_response
)


class AIDiagnosisService:
    """
    Service for AI diagnosis operations.
    """
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db.ai_diagnoses
        
    # =========================================================================
    # CRUD Operations
    # =========================================================================
    
    async def create_diagnosis(
        self,
        diagnosis_data: AIDiagnosisCreate,
        user_id: str,
        subject: str = None
    ) -> AIDiagnosisModel:
        """
        Create a new AI diagnosis.
        
        Args:
            diagnosis_data: The diagnosis creation data
            user_id: The ID of the user creating the diagnosis
            subject: Optional subject of the lesson
            
        Returns:
            The created diagnosis model
        """
        diagnosis_dict = diagnosis_data.model_dump()
        diagnosis_dict["user_id"] = ObjectId(user_id)
        diagnosis_dict["status"] = DiagnosisStatus.PENDING
        diagnosis_dict["ai_result"] = AIResultModel().model_dump()
        diagnosis_dict["generated_questions"] = []
        diagnosis_dict["is_saved"] = False  # Not saved initially
        diagnosis_dict["subject"] = subject
        diagnosis_dict["created_at"] = datetime.utcnow()
        
        result = await self.collection.insert_one(diagnosis_dict)
        diagnosis_dict["_id"] = result.inserted_id
        
        return AIDiagnosisModel(**diagnosis_dict)
    
    async def get_diagnosis_by_id(
        self,
        diagnosis_id: str,
        user_id: Optional[str] = None
    ) -> Optional[AIDiagnosisModel]:
        """
        Get a diagnosis by ID.
        
        Args:
            diagnosis_id: The diagnosis ID
            user_id: Optional user ID to filter by ownership
            
        Returns:
            The diagnosis model if found, None otherwise
        """
        if not ObjectId.is_valid(diagnosis_id):
            return None
            
        query = {"_id": ObjectId(diagnosis_id)}
        if user_id:
            query["user_id"] = ObjectId(user_id)
            
        diagnosis = await self.collection.find_one(query)
        if diagnosis:
            return AIDiagnosisModel(**diagnosis)
        return None
    
    async def get_diagnoses_by_user(
        self,
        user_id: str,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        subject: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[AIDiagnosisModel]:
        """
        Get all diagnoses for a user with optional filters.
        
        Args:
            user_id: The user ID
            skip: Number of records to skip
            limit: Maximum number of records to return
            search: Optional search keyword for title
            subject: Optional subject filter
            start_date: Optional start date filter
            end_date: Optional end date filter
            
        Returns:
            List of diagnosis models
        """
        query = {"user_id": ObjectId(user_id)}
        
        # Add search filter (search in title)
        if search:
            query["title"] = {"$regex": search, "$options": "i"}
        
        # Add subject filter
        if subject:
            query["subject"] = subject
        
        # Add date range filter
        if start_date or end_date:
            query["created_at"] = {}
            if start_date:
                query["created_at"]["$gte"] = start_date
            if end_date:
                # Include the entire end date by setting to end of day
                query["created_at"]["$lte"] = end_date
        
        cursor = self.collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
        
        diagnoses = []
        async for doc in cursor:
            diagnoses.append(AIDiagnosisModel(**doc))
        return diagnoses

    async def count_diagnoses_by_user(
        self,
        user_id: str,
        search: Optional[str] = None,
        subject: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> int:
        """Count total diagnoses for a user with optional filters."""
        query = {"user_id": ObjectId(user_id)}
        
        # Add search filter
        if search:
            query["title"] = {"$regex": search, "$options": "i"}
        
        # Add subject filter
        if subject:
            query["subject"] = subject
        
        # Add date range filter
        if start_date or end_date:
            query["created_at"] = {}
            if start_date:
                query["created_at"]["$gte"] = start_date
            if end_date:
                query["created_at"]["$lte"] = end_date
        
        return await self.collection.count_documents(query)
    
    async def update_diagnosis(
        self,
        diagnosis_id: str,
        update_data: AIDiagnosisUpdate,
        user_id: str
    ) -> Optional[AIDiagnosisModel]:
        """
        Update a diagnosis.
        
        Args:
            diagnosis_id: The diagnosis ID
            update_data: The update data
            user_id: The user ID (for ownership check)
            
        Returns:
            The updated diagnosis model if found and updated
        """
        if not ObjectId.is_valid(diagnosis_id):
            return None
            
        update_dict = {
            k: v for k, v in update_data.model_dump().items() 
            if v is not None
        }
        
        if not update_dict:
            return await self.get_diagnosis_by_id(diagnosis_id, user_id)
            
        result = await self.collection.find_one_and_update(
            {
                "_id": ObjectId(diagnosis_id),
                "user_id": ObjectId(user_id)
            },
            {"$set": update_dict},
            return_document=True
        )
        
        if result:
            return AIDiagnosisModel(**result)
        return None
    
    async def delete_diagnosis(
        self,
        diagnosis_id: str,
        user_id: str
    ) -> bool:
        """
        Delete a diagnosis.
        
        Args:
            diagnosis_id: The diagnosis ID
            user_id: The user ID (for ownership check)
            
        Returns:
            True if deleted, False otherwise
        """
        if not ObjectId.is_valid(diagnosis_id):
            return False
            
        result = await self.collection.delete_one({
            "_id": ObjectId(diagnosis_id),
            "user_id": ObjectId(user_id)
        })
        
        return result.deleted_count > 0
    
    async def mark_as_saved(
        self,
        diagnosis_id: str,
        user_id: str
    ) -> bool:
        """
        Mark a diagnosis as saved.
        
        Args:
            diagnosis_id: The diagnosis ID
            user_id: The user ID (for ownership check)
            
        Returns:
            True if marked as saved, False otherwise
        """
        if not ObjectId.is_valid(diagnosis_id):
            return False
            
        result = await self.collection.update_one(
            {
                "_id": ObjectId(diagnosis_id),
                "user_id": ObjectId(user_id)
            },
            {"$set": {"is_saved": True}}
        )
        
        return result.modified_count > 0
    
    # =========================================================================
    # AI Analysis Operations
    # =========================================================================
    
    async def analyze_lecture(
        self,
        diagnosis_id: str,
        user_id: str
    ) -> Optional[AIDiagnosisModel]:
        """
        Run AI analysis on a lecture diagnosis.
        
        Args:
            diagnosis_id: The diagnosis ID
            user_id: The user ID
            
        Returns:
            The updated diagnosis with AI results
        """
        # Get the diagnosis
        diagnosis = await self.get_diagnosis_by_id(diagnosis_id, user_id)
        if not diagnosis:
            return None
            
        # Build prompt and call LLM
        prompt = build_diagnosis_prompt(
            content=diagnosis.input.content,
            nationality=diagnosis.learner_profile.nationality,
            level=diagnosis.learner_profile.level
        )
        
        try:
            response = await call_llm(prompt)
            result = parse_llm_json_response(response)
            
            # Handle suggestions - convert to list of strings
            suggestions_raw = result.get("suggestions", [])
            if isinstance(suggestions_raw, dict):
                # Convert dict values to list
                suggestions = [str(v) for v in suggestions_raw.values()]
            elif isinstance(suggestions_raw, list):
                # Ensure all items are strings
                suggestions = [str(item) for item in suggestions_raw]
            elif isinstance(suggestions_raw, str):
                # Split string by newlines if it's a string
                suggestions = [s.strip() for s in suggestions_raw.split('\n') if s.strip()]
            else:
                suggestions = []
            
            # Update diagnosis with AI result
            ai_result = AIResultModel(
                misunderstanding_points=result.get("misunderstanding_points", []),
                simulation=result.get("simulation"),
                suggestions=suggestions
            )
            
            updated = await self.collection.find_one_and_update(
                {
                    "_id": ObjectId(diagnosis_id),
                    "user_id": ObjectId(user_id)
                },
                {
                    "$set": {
                        "ai_result": ai_result.model_dump(),
                        "status": DiagnosisStatus.COMPLETED
                    }
                },
                return_document=True
            )
            
            if updated:
                return AIDiagnosisModel(**updated)
                
        except Exception as e:
            # Mark as failed
            await self.collection.update_one(
                {"_id": ObjectId(diagnosis_id)},
                {"$set": {"status": DiagnosisStatus.FAILED}}
            )
            raise e
            
        return None
    
    async def generate_questions(
        self,
        diagnosis_id: str,
        user_id: str,
        num_questions: int = 5
    ) -> Optional[AIDiagnosisModel]:
        """
        Generate assessment questions based on diagnosis results.
        
        Args:
            diagnosis_id: The diagnosis ID
            user_id: The user ID
            num_questions: Number of questions to generate
            
        Returns:
            The updated diagnosis with generated questions
        """
        # Get the diagnosis
        diagnosis = await self.get_diagnosis_by_id(diagnosis_id, user_id)
        if not diagnosis:
            return None
            
        # Check if analysis has been done
        if not diagnosis.ai_result.misunderstanding_points:
            raise ValueError("Diagnosis must be analyzed first before generating questions")
        
        # Build prompt and call LLM
        prompt = build_question_generation_prompt(
            content=diagnosis.input.content,
            misunderstanding_points=diagnosis.ai_result.misunderstanding_points,
            nationality=diagnosis.learner_profile.nationality,
            level=diagnosis.learner_profile.level,
            num_questions=num_questions
        )
        
        response = await call_llm(prompt)
        result = parse_llm_json_response(response)
        
        # Parse questions
        questions = []
        for q in result.get("questions", []):
            question_type = QuestionType.MULTIPLE_CHOICE
            if q.get("type") == "short_answer":
                question_type = QuestionType.SHORT_ANSWER
                
            questions.append(GeneratedQuestionModel(
                id=ObjectId(),
                question_text=q.get("question_text", ""),
                type=question_type,
                options=q.get("options", []),
                correct_answer=q.get("correct_answer", "")
            ))
        
        # Update diagnosis
        updated = await self.collection.find_one_and_update(
            {
                "_id": ObjectId(diagnosis_id),
                "user_id": ObjectId(user_id)
            },
            {
                "$set": {
                    "generated_questions": [q.model_dump() for q in questions]
                }
            },
            return_document=True
        )
        
        if updated:
            return AIDiagnosisModel(**updated)
        return None
    
    async def evaluate_answers(
        self,
        diagnosis_id: str,
        user_id: str,
        answers: List[QuestionAnswerSubmit]
    ) -> DiagnosisEvaluation:
        """
        Evaluate student answers against the generated questions.
        
        Args:
            diagnosis_id: The diagnosis ID
            user_id: The user ID
            answers: List of student answers
            
        Returns:
            Evaluation results with score and feedback
        """
        # Get the diagnosis
        diagnosis = await self.get_diagnosis_by_id(diagnosis_id, user_id)
        if not diagnosis:
            raise ValueError("Diagnosis not found")
            
        if not diagnosis.generated_questions:
            raise ValueError("No questions have been generated for this diagnosis")
        
        # Build lookup for questions
        question_map = {
            str(q.id): q for q in diagnosis.generated_questions
        }
        
        correct_count = 0
        total_count = len(answers)
        feedbacks = []
        
        for answer in answers:
            question = question_map.get(answer.question_id)
            if not question:
                continue
            
            is_correct = False
            explanation = ""
            
            # For multiple choice, direct comparison
            if question.type == QuestionType.MULTIPLE_CHOICE:
                is_correct = answer.user_answer.strip().upper() == question.correct_answer.strip().upper()
                if not is_correct:
                    explanation = f"Đáp án đúng là {question.correct_answer}"
            else:
                # For short answer, use LLM to evaluate
                prompt = build_evaluation_prompt(
                    question=question.question_text,
                    correct_answer=question.correct_answer,
                    user_answer=answer.user_answer,
                    question_type="short_answer"
                )
                
                response = await call_llm(prompt)
                result = parse_llm_json_response(response)
                
                is_correct = result.get("is_correct", False)
                explanation = result.get("feedback", "")
            
            if is_correct:
                correct_count += 1
                
            feedbacks.append(FeedbackItem(
                question_id=str(question.id),
                is_correct=is_correct,
                correct_answer=question.correct_answer,
                explanation=explanation
            ))
        
        score_percentage = (correct_count / total_count * 100) if total_count > 0 else 0
        
        return DiagnosisEvaluation(
            total_questions=total_count,
            correct_answers=correct_count,
            score_percentage=round(score_percentage, 2),
            feedback=feedbacks
        )
