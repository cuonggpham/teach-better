"""
Middleware để xử lý ngôn ngữ từ HTTP request
"""
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.i18n import get_i18n


class I18nMiddleware(BaseHTTPMiddleware):
    """
    Middleware để phát hiện và xử lý ngôn ngữ từ request
    
    Ngôn ngữ có thể được cung cấp qua:
    1. Query parameter: ?lang=vi hoặc ?locale=vi
    2. Header: Accept-Language
    3. Cookie: locale
    
    Middleware sẽ lưu ngôn ngữ vào request.state.locale
    """
    
    async def dispatch(
        self,
        request: Request,
        call_next: Callable
    ) -> Response:
        """
        Xử lý request và phát hiện ngôn ngữ
        
        Args:
            request: FastAPI Request object
            call_next: Next middleware hoặc endpoint
        
        Returns:
            Response object
        """
        i18n = get_i18n()
        locale = None
        
        # 1. Ưu tiên query parameter
        locale = request.query_params.get("lang") or request.query_params.get("locale")
        
        # 2. Kiểm tra cookie
        if not locale:
            locale = request.cookies.get("locale")
        
        # 3. Kiểm tra header Accept-Language
        if not locale:
            accept_language = request.headers.get("Accept-Language")
            if accept_language:
                # Parse Accept-Language header (vd: "vi,en;q=0.9,ja;q=0.8")
                languages = [
                    lang.split(";")[0].strip()
                    for lang in accept_language.split(",")
                ]
                # Tìm ngôn ngữ được hỗ trợ đầu tiên
                for lang in languages:
                    # Xử lý cả locale đầy đủ (vi-VN) và ngắn gọn (vi)
                    short_lang = lang.split("-")[0]
                    if i18n.is_supported(short_lang):
                        locale = short_lang
                        break
        
        # 4. Nếu không tìm thấy hoặc không hỗ trợ, dùng default
        if not locale or not i18n.is_supported(locale):
            locale = i18n.default_locale
        
        # Lưu locale vào request state để các endpoint có thể truy cập
        request.state.locale = locale
        
        # Tiếp tục xử lý request
        response = await call_next(request)
        
        # Set cookie locale để lưu lựa chọn người dùng
        response.set_cookie(
            key="locale",
            value=locale,
            max_age=60 * 60 * 24 * 365,  # 1 năm
            httponly=True,
            samesite="lax"
        )
        
        return response


def get_locale(request: Request) -> str:
    """
    Helper function để lấy locale từ request
    
    Args:
        request: FastAPI Request object
    
    Returns:
        Mã ngôn ngữ (locale)
    """
    return getattr(request.state, "locale", get_i18n().default_locale)
