from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum
from app.models.user import PyObjectId


class InputType(str, Enum):
    TEXT = "text"
    AUDIO = "audio"


class DiagnosisStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"


class QuestionType(str, Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    SHORT_ANSWER = "short_answer"


class InputModel(BaseModel):
    """
    Input sub-model for AI diagnosis
    """
    type: InputType
    content: str  # Text content or URL to audio file


class LearnerProfileModel(BaseModel):
    """
    Learner profile sub-model
    """
    nationality: Optional[str] = None
    level: Optional[str] = None  # e.g., "N5", "Tiểu học"


class AIResultModel(BaseModel):
    """
    AI result sub-model
    """
    misunderstanding_points: List[str] = Field(default_factory=list)
    simulation: Optional[str] = None
    suggestions: Optional[str] = None
    comparison_to_previous: Optional[str] = None


class GeneratedQuestionModel(BaseModel):
    """
    Generated question sub-model embedded in AI diagnosis
    """
    id: PyObjectId = Field(default_factory=PyObjectId)
    question_text: str
    type: QuestionType
    options: List[str] = Field(default_factory=list)  # For multiple_choice
    correct_answer: str


class AIDiagnosisModel(BaseModel):
    """
    AI Diagnosis database model
    """
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: PyObjectId = Field(..., index=True)
    title: str
    input: InputModel
    learner_profile: LearnerProfileModel = Field(default_factory=LearnerProfileModel)
    ai_result: AIResultModel = Field(default_factory=AIResultModel)
    generated_questions: List[GeneratedQuestionModel] = Field(default_factory=list)
    status: DiagnosisStatus = Field(default=DiagnosisStatus.PENDING)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={
            PyObjectId: str,
            datetime: lambda v: v.isoformat()
        }
    )

