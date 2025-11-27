from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.core.security import decode_access_token
from app.schemas.user import User, UserUpdate
from app.services.user_service import UserService
from app.services.cloudinary_service import CloudinaryService

router = APIRouter()
security = HTTPBearer()


def get_user_service(db: AsyncIOMotorDatabase = Depends(get_database)) -> UserService:
    """
    Dependency to get user service
    """
    return UserService(db)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    user_service: UserService = Depends(get_user_service)
) -> User:
    """
    Get current authenticated user
    """
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    email: str = payload.get("sub")
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = await user_service.get_user_by_email(email)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Convert to response model
    user_dict = user.model_dump(by_alias=True)
    user_dict["_id"] = str(user_dict["_id"])
    
    return User(**user_dict)


@router.get("/me", response_model=User)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current user information
    """
    return current_user


@router.get("/{user_id}", response_model=User)
async def get_user(
    user_id: str,
    user_service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user)
):
    """
    Get user by ID
    """
    user = await user_service.get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Convert to response model
    user_dict = user.model_dump(by_alias=True)
    user_dict["_id"] = str(user_dict["_id"])
    
    return User(**user_dict)


@router.get("/", response_model=List[User])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    user_service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user)
):
    """
    List all users
    """
    users = await user_service.get_users(skip=skip, limit=limit)
    
    # Convert to response models
    user_list = []
    for user in users:
        user_dict = user.model_dump(by_alias=True)
        user_dict["_id"] = str(user_dict["_id"])
        user_list.append(User(**user_dict))
    
    return user_list


from app.i18n.dependencies import get_translator, Translator

@router.put("/{user_id}")
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    user_service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user),
    t: Translator = Depends(get_translator)
):
    """
    Update user
    """
    # Check if user is updating their own profile or is superuser
    if current_user.id != user_id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=t("errors.forbidden")
        )
    
    user = await user_service.update_user(user_id, user_data)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("user.not_found")
        )
    
    # Convert to response model
    user_dict = user.model_dump(by_alias=True)
    user_dict["_id"] = str(user_dict["_id"])
    
    return {
        "message": t("user.profile_updated"),
        "data": User(**user_dict)
    }


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    user_service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user)
):
    """
    Delete user
    """
    # Check if user is deleting their own profile or is superuser
    if current_user.id != user_id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    success = await user_service.delete_user(user_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return None


@router.post("/avatar", response_model=dict)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    """
    Upload user avatar to Cloudinary
    """
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )
    
    # Check file size (max 5MB)
    file_size = 0
    file_content = await file.read()
    file_size = len(file_content)
    
    if file_size > 5 * 1024 * 1024:  # 5MB
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size must be less than 5MB"
        )
    
    # Upload to Cloudinary
    result = await CloudinaryService.upload_image(
        file_content=file_content,
        filename=file.filename,
        user_id=current_user.id
    )
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload image"
        )
    
    # Update user avatar_url in database
    updated_user = await user_service.update_user(
        current_user.id,
        UserUpdate(avatar_url=result['url'])
    )
    
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user avatar"
        )
    
    return {
        "message": "Avatar uploaded successfully",
        "avatar_url": result['url'],
        "cloudinary_data": result
    }
