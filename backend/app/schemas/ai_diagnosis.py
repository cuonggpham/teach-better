from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.ai_diagnosis import InputType, DiagnosisStatus, QuestionType


class InputSchema(BaseModel):
    """
    Input schema for AI diagnosis
    """
    type: InputType
    content: str


class LearnerProfileSchema(BaseModel):
    """
    Learner profile schema
    """
    nationality: Optional[str] = None
    level: Optional[str] = None


class AIResultSchema(BaseModel):
    """
    AI result schema
    """
    misunderstanding_points: List[str] = Field(default_factory=list)
    simulation: Optional[str] = None
    suggestions: Optional[str] = None
    comparison_to_previous: Optional[str] = None


class GeneratedQuestionSchema(BaseModel):
    """
    Generated question schema
    """
    id: str
    question_text: str
    type: QuestionType
    options: List[str] = Field(default_factory=list)
    correct_answer: str


class AIDiagnosisBase(BaseModel):
    """
    Base AI diagnosis schema
    """
    title: str
    input: InputSchema
    learner_profile: LearnerProfileSchema


class AIDiagnosisCreate(AIDiagnosisBase):
    """
    AI diagnosis creation schema
    """
    pass


class AIDiagnosisUpdate(BaseModel):
    """
    AI diagnosis update schema
    """
    title: Optional[str] = None
    status: Optional[DiagnosisStatus] = None
    ai_result: Optional[AIResultSchema] = None
    generated_questions: Optional[List[GeneratedQuestionSchema]] = None


class AIDiagnosisInDB(AIDiagnosisBase):
    """
    AI diagnosis in database schema
    """
    id: str = Field(..., alias="_id")
    user_id: str
    ai_result: AIResultSchema
    generated_questions: List[GeneratedQuestionSchema] = Field(default_factory=list)
    status: DiagnosisStatus
    created_at: datetime

    class Config:
        populate_by_name = True


class AIDiagnosis(AIDiagnosisInDB):
    """
    AI diagnosis response schema
    """
    pass


class QuestionAnswerSubmit(BaseModel):
    """
    Question answer submission schema
    """
    question_id: str
    user_answer: str


class FeedbackItem(BaseModel):
    """
    Feedback item schema
    """
    question_id: str
    is_correct: bool
    correct_answer: str
    explanation: Optional[str] = None


class DiagnosisEvaluation(BaseModel):
    """
    Diagnosis evaluation result schema
    """
    total_questions: int
    correct_answers: int
    score_percentage: float
    feedback: List[FeedbackItem]

