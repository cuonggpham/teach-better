from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.schemas.user import UserCreate, UserSignup
from app.services.user_service import UserService
from app.utils.helpers import validate_email_format, validate_password_strength
from app.i18n.dependencies import get_translator, Translator

router = APIRouter()


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
