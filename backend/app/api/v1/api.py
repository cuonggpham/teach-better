from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, i18n, posts, answers, notifications, bookmarks, categories, tags, reports, admin, ai_diagnosis

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(posts.router, prefix="/posts", tags=["posts"])
api_router.include_router(answers.router, prefix="/answers", tags=["answers"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(bookmarks.router, prefix="/bookmarks", tags=["bookmarks"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(tags.router, prefix="/tags", tags=["tags"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(i18n.router, prefix="/i18n", tags=["i18n"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(ai_diagnosis.router, prefix="/diagnoses", tags=["ai-diagnosis"])

