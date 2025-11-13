"""
Ví dụ chi tiết về cách sử dụng i18n trong các trường hợp thực tế
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional
from app.i18n.dependencies import get_translator, Translator

router = APIRouter()


# === Models ===
class UserCreate(BaseModel):
    email: str = Field(..., description="Email của người dùng")
    password: str = Field(..., min_length=8, description="Mật khẩu")
    name: str = Field(..., description="Tên người dùng")


class LoginRequest(BaseModel):
    email: str
    password: str


# === Ví dụ 1: Validation Error với i18n ===
@router.post("/register", tags=["examples"])
async def register_user(
    user: UserCreate,
    t: Translator = Depends(get_translator)
):
    """
    Ví dụ: Đăng ký user với validation và message i18n
    """
    # Giả lập kiểm tra email đã tồn tại
    if user.email == "existing@example.com":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("auth.email_exists")
        )
    
    # Giả lập tạo user thành công
    return {
        "success": True,
        "message": t("auth.register_success"),
        "data": {
            "email": user.email,
            "name": user.name
        }
    }


# === Ví dụ 2: Login với nhiều loại error ===
@router.post("/login", tags=["examples"])
async def login(
    credentials: LoginRequest,
    t: Translator = Depends(get_translator)
):
    """
    Ví dụ: Login với các message lỗi khác nhau
    """
    # Giả lập user không tồn tại
    if credentials.email != "user@example.com":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("auth.user_not_found")
        )
    
    # Giả lập sai password
    if credentials.password != "password123":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=t("auth.password_incorrect")
        )
    
    # Login thành công
    return {
        "success": True,
        "message": t("auth.login_success"),
        "token": "fake-jwt-token"
    }


# === Ví dụ 3: CRUD với i18n ===
@router.get("/users/{user_id}", tags=["examples"])
async def get_user(
    user_id: int,
    t: Translator = Depends(get_translator)
):
    """
    Ví dụ: Lấy thông tin user
    """
    # Giả lập user không tồn tại
    if user_id > 100:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("user.not_found")
        )
    
    return {
        "id": user_id,
        "name": "Nguyễn Văn A",
        "email": "user@example.com"
    }


@router.put("/users/{user_id}", tags=["examples"])
async def update_user(
    user_id: int,
    name: Optional[str] = None,
    t: Translator = Depends(get_translator)
):
    """
    Ví dụ: Cập nhật thông tin user
    """
    # Giả lập update thành công
    return {
        "success": True,
        "message": t("user.updated"),
        "data": {
            "id": user_id,
            "name": name or "Updated Name"
        }
    }


@router.delete("/users/{user_id}", tags=["examples"])
async def delete_user(
    user_id: int,
    t: Translator = Depends(get_translator)
):
    """
    Ví dụ: Xóa user
    """
    return {
        "success": True,
        "message": t("user.deleted")
    }


# === Ví dụ 4: Validation với interpolation ===
@router.post("/validate-password", tags=["examples"])
async def validate_password(
    password: str,
    t: Translator = Depends(get_translator)
):
    """
    Ví dụ: Validation với dynamic values
    """
    min_length = 8
    max_length = 100
    
    errors = []
    
    if len(password) < min_length:
        errors.append(t("validation.password_min_length", min=min_length))
    
    if len(password) > max_length:
        errors.append(t("validation.password_max_length", max=max_length))
    
    if errors:
        return {
            "valid": False,
            "errors": errors
        }
    
    return {
        "valid": True,
        "message": t("common.success")
    }


# === Ví dụ 5: List với pagination và i18n ===
@router.get("/courses", tags=["examples"])
async def list_courses(
    page: int = 1,
    limit: int = 10,
    t: Translator = Depends(get_translator)
):
    """
    Ví dụ: Danh sách khóa học với message i18n
    """
    # Giả lập dữ liệu
    courses = [
        {
            "id": i,
            "title": f"Course {i}",
            "instructor": f"Teacher {i}"
        }
        for i in range(1, limit + 1)
    ]
    
    return {
        "success": True,
        "data": courses,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": 100
        },
        "message": t("common.success")
    }


# === Ví dụ 6: Error handling tổng quát ===
@router.get("/test-error", tags=["examples"])
async def test_error(
    error_type: str = "not_found",
    t: Translator = Depends(get_translator)
):
    """
    Ví dụ: Các loại error khác nhau
    """
    error_mapping = {
        "not_found": (status.HTTP_404_NOT_FOUND, "errors.not_found"),
        "unauthorized": (status.HTTP_401_UNAUTHORIZED, "errors.unauthorized"),
        "forbidden": (status.HTTP_403_FORBIDDEN, "errors.forbidden"),
        "bad_request": (status.HTTP_400_BAD_REQUEST, "errors.bad_request"),
        "internal": (status.HTTP_500_INTERNAL_SERVER_ERROR, "errors.internal_server_error")
    }
    
    if error_type in error_mapping:
        status_code, message_key = error_mapping[error_type]
        raise HTTPException(
            status_code=status_code,
            detail=t(message_key)
        )
    
    return {"message": t("common.success")}


# === Ví dụ 7: Response với nhiều ngôn ngữ ===
@router.get("/welcome", tags=["examples"])
async def welcome(t: Translator = Depends(get_translator)):
    """
    Ví dụ: Welcome message
    """
    return {
        "welcome": t("messages.welcome"),
        "app_title": "Teach Better",
        "description": "Education platform with i18n support",
        "features": [
            t("common.success"),
            t("common.created"),
            t("common.updated")
        ]
    }
