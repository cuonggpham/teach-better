from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, i18n, posts, notifications

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(i18n.router, prefix="/i18n", tags=["i18n"])
api_router.include_router(posts.router, prefix="/posts", tags=["posts"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
