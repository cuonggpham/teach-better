from fastapi import APIRouter, Depends, HTTPException, status, Request
from motor.motor_asyncio import AsyncIOMotorDatabase
from slowapi import Limiter
from slowapi.util import get_remote_address
from datetime import timedelta

from app.core.database import get_database
from app.schemas.user import UserCreate, UserSignup, UserSignin, Token, User
from app.services.user_service import UserService
from app.utils.helpers import validate_email_format, validate_password_strength
from app.i18n.dependencies import get_translator, Translator
from app.core.security import create_access_token
from app.core.config import settings

router = APIRouter()

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)


def get_user_service(db: AsyncIOMotorDatabase = Depends(get_database)) -> UserService:
    """
    Dependency to get user service
    """
    return UserService(db)


@router.post("/signup", response_model=dict, status_code=status.HTTP_201_CREATED)
async def signup(
    user_data: UserSignup,
    user_service: UserService = Depends(get_user_service),
    t: Translator = Depends(get_translator)
):
    """
    Signup a new user with enhanced validation
    
    Requirements:
    - Email must be in valid format (contain @ and valid domain)
    - Password must be at least 8 characters
    - Password must contain at least 2 of 3 types: letters, numbers, symbols
    - Password must not contain " or ' characters
    - Password and password_confirm must match
    - Email must not be already registered
    """
    # Validate email format
    if not validate_email_format(user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("auth.email_invalid")
        )
    
    # Validate password strength
    is_valid, error_key = validate_password_strength(user_data.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t(error_key)
        )
    
    # Check if passwords match
    if user_data.password != user_data.password_confirm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("auth.password_mismatch")
        )
    
    # Check if user already exists
    existing_user = await user_service.get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("auth.email_exists")
        )
    
    # Create user (username will be the email prefix for now)
    username = user_data.email.split('@')[0]
    user_create = UserCreate(
        email=user_data.email,
        username=username,
        password=user_data.password
    )
    
    # Create user in database
    user = await user_service.create_user(user_create)
    
    return {
        "message": t("auth.register_success"),
        "email": user.email,
        "redirect": "/login"
    }


@router.post("/signin", response_model=dict, status_code=status.HTTP_200_OK)
@limiter.limit("5/minute")  # Limit to 5 requests per minute per IP
async def signin(
    request: Request,
    user_data: UserSignin,
    user_service: UserService = Depends(get_user_service),
    t: Translator = Depends(get_translator)
):
    """
    Sign in user with enhanced security
    
    Requirements:
    - Email must be in valid format (contain @ and valid domain)
    - Password must be at least 8 characters
    - Password must contain at least 2 of 3 types: letters, numbers, symbols
    - Password must not contain " or ' characters
    - Returns generic error message for both email and password failures (security best practice)
    
    Security features:
    - Rate limiting (5 requests per minute)
    - Generic error messages (doesn't reveal if email exists)
    - Password validation before authentication
    - JWT token generation on success
    """
    # Validate email format
    if not validate_email_format(user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("auth.email_invalid")
        )
    
    # Validate password strength
    is_valid, error_key = validate_password_strength(user_data.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t(error_key)
        )
    
    # Authenticate user
    user = await user_service.authenticate_user(user_data.email, user_data.password)
    
    # If authentication fails, return generic error message
    # Don't reveal whether email or password is incorrect
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=t("auth.invalid_credentials")
        )
    
    # Check if user account is active (if status field exists)
    if hasattr(user, 'status') and user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=t("auth.account_locked")
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires
    )
    
    # Prepare user response
    user_dict = {
        "id": str(user.id) if hasattr(user, 'id') else str(user.dict().get('_id')),
        "name": user.name,
        "email": user.email,
        "avatar_url": user.avatar_url if hasattr(user, 'avatar_url') else None,
        "role": user.role if hasattr(user, 'role') else "user",
        "status": user.status if hasattr(user, 'status') else "active",
        "bookmarked_post_ids": user.bookmarked_post_ids if hasattr(user, 'bookmarked_post_ids') else [],
        "created_at": user.created_at.isoformat() if hasattr(user, 'created_at') else None,
        "updated_at": user.updated_at.isoformat() if hasattr(user, 'updated_at') else None
    }
    
    return {
        "message": t("auth.login_success"),
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_dict,
        "redirect": "/home"  # URL of main screen
    }


@router.post("/signout", response_model=dict, status_code=status.HTTP_200_OK)
async def signout(
    t: Translator = Depends(get_translator)
):
    """
    Sign out user

    Returns success message. Token invalidation is handled on the client side.
    """
    return {
        "message": t("auth.logout_success")
    }
