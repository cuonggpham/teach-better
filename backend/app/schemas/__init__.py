from app.schemas.user import (
    UserBase,
    UserCreate,
    UserUpdate,
    UserInDB,
    User,
    UserLogin,
    Token,
    TokenData
)
from app.schemas.tag import (
    TagBase,
    TagCreate,
    TagUpdate,
    TagInDB,
    Tag,
    TagWithPosts
)
from app.schemas.post import (
    PostBase,
    PostCreate,
    PostUpdate,
    PostInDB,
    Post,
    PostWithAuthor
)
from app.schemas.answer import (
    AnswerBase,
    AnswerCreate,
    AnswerUpdate,
    AnswerInDB,
    Answer,
    AnswerWithAuthor,
    AnswerVote,
    CommentSchema,
    CommentCreate
)
from app.schemas.ai_diagnosis import (
    AIDiagnosisBase,
    AIDiagnosisCreate,
    AIDiagnosisUpdate,
    AIDiagnosisInDB,
    AIDiagnosis,
    InputSchema,
    LearnerProfileSchema,
    AIResultSchema,
    GeneratedQuestionSchema,
    QuestionAnswerSubmit,
    DiagnosisEvaluation
)
from app.schemas.report import (
    ReportBase,
    ReportCreate,
    ReportUpdate,
    ReportResolve,
    ReportInDB,
    Report,
    ReportWithDetails,
    ResolutionSchema
)
from app.schemas.notification import (
    NotificationBase,
    NotificationCreate,
    NotificationUpdate,
    NotificationInDB,
    Notification,
    NotificationCount
)

__all__ = [
    # User
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserInDB",
    "User",
    "UserLogin",
    "Token",
    "TokenData",
    # Tag
    "TagBase",
    "TagCreate",
    "TagUpdate",
    "TagInDB",
    "Tag",
    "TagWithPosts",
    # Post
    "PostBase",
    "PostCreate",
    "PostUpdate",
    "PostInDB",
    "Post",
    "PostWithAuthor",
    # Answer
    "AnswerBase",
    "AnswerCreate",
    "AnswerUpdate",
    "AnswerInDB",
    "Answer",
    "AnswerWithAuthor",
    "AnswerVote",
    "CommentSchema",
    "CommentCreate",
    # AI Diagnosis
    "AIDiagnosisBase",
    "AIDiagnosisCreate",
    "AIDiagnosisUpdate",
    "AIDiagnosisInDB",
    "AIDiagnosis",
    "InputSchema",
    "LearnerProfileSchema",
    "AIResultSchema",
    "GeneratedQuestionSchema",
    "QuestionAnswerSubmit",
    "DiagnosisEvaluation",
    # Report
    "ReportBase",
    "ReportCreate",
    "ReportUpdate",
    "ReportResolve",
    "ReportInDB",
    "Report",
    "ReportWithDetails",
    "ResolutionSchema",
    # Notification
    "NotificationBase",
    "NotificationCreate",
    "NotificationUpdate",
    "NotificationInDB",
    "Notification",
    "NotificationCount",
]

