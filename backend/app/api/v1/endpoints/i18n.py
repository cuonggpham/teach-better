"""
I18n endpoints - Demo và quản lý ngôn ngữ
"""
from fastapi import APIRouter, Depends, Request
from typing import Dict, Any
from app.i18n import get_i18n
from app.i18n.dependencies import get_translator, Translator
from app.i18n.middleware import get_locale

router = APIRouter()


@router.get("/languages")
async def get_supported_languages() -> Dict[str, Any]:
    """
    Lấy danh sách ngôn ngữ được hỗ trợ
    
    Returns:
        Dict chứa thông tin về các ngôn ngữ được hỗ trợ
    """
    i18n = get_i18n()
    return {
        "supported_languages": i18n.get_supported_locales(),
        "default_language": i18n.default_locale
    }


@router.get("/current-language")
async def get_current_language(request: Request) -> Dict[str, str]:
    """
    Lấy ngôn ngữ hiện tại của request
    
    Args:
        request: FastAPI Request object
    
    Returns:
        Dict chứa ngôn ngữ hiện tại
    """
    locale = get_locale(request)
    return {
        "current_language": locale
    }


@router.get("/demo")
async def demo_translation(
    t: Translator = Depends(get_translator)
) -> Dict[str, Any]:
    """
    Endpoint demo về cách sử dụng translation
    
    Sẽ trả về các message đã được dịch theo ngôn ngữ của request
    
    Args:
        t: Translator dependency
    
    Returns:
        Dict chứa các message đã dịch
    """
    return {
        "welcome": t("messages.welcome"),
        "goodbye": t("messages.goodbye"),
        "auth": {
            "login_success": t("auth.login_success"),
            "register_success": t("auth.register_success"),
            "user_not_found": t("auth.user_not_found")
        },
        "errors": {
            "not_found": t("errors.not_found"),
            "unauthorized": t("errors.unauthorized"),
            "internal_server_error": t("errors.internal_server_error")
        },
        "validation": {
            "required": t("validation.required"),
            "email_invalid": t("validation.email_invalid"),
            # Ví dụ với interpolation
            "password_min_length": t("validation.password_min_length", min=8),
            "string_too_long": t("validation.string_too_long", max=100)
        },
        "user": {
            "created": t("user.created"),
            "updated": t("user.updated"),
            "profile_updated": t("user.profile_updated")
        }
    }


@router.get("/translate/{key}")
async def translate_key(
    key: str,
    t: Translator = Depends(get_translator)
) -> Dict[str, str]:
    """
    Dịch một key cụ thể
    
    Args:
        key: Key cần dịch (vd: "auth.login_success")
        t: Translator dependency
    
    Returns:
        Dict chứa key và translation
    """
    translation = t(key)
    return {
        "key": key,
        "translation": translation
    }


@router.post("/set-language/{locale}")
async def set_language(locale: str) -> Dict[str, Any]:
    """
    Endpoint để client set ngôn ngữ
    
    Args:
        locale: Mã ngôn ngữ cần set
    
    Returns:
        Dict chứa thông tin về việc set ngôn ngữ
    """
    i18n = get_i18n()
    
    if not i18n.is_supported(locale):
        return {
            "success": False,
            "message": f"Language '{locale}' is not supported",
            "supported_languages": i18n.get_supported_locales()
        }
    
    return {
        "success": True,
        "message": "Language preference saved",
        "language": locale,
        "note": "Send requests with query parameter ?lang={locale} or set Accept-Language header"
    }
