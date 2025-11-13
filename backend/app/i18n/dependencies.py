"""
Dependencies cho i18n trong FastAPI endpoints
"""
from typing import Callable
from fastapi import Request
from app.i18n import get_i18n
from app.i18n.middleware import get_locale


class Translator:
    """
    Class helper để sử dụng translation trong endpoint
    
    Cung cấp interface tiện lợi để dịch chuỗi theo ngôn ngữ của request
    """
    
    def __init__(self, locale: str):
        """
        Khởi tạo Translator
        
        Args:
            locale: Mã ngôn ngữ
        """
        self.locale = locale
        self.i18n = get_i18n()
    
    def __call__(self, key: str, **kwargs) -> str:
        """
        Dịch chuỗi theo key
        
        Args:
            key: Key của bản dịch
            **kwargs: Các biến để thay thế
        
        Returns:
            Chuỗi đã dịch
        """
        return self.i18n.get(key, locale=self.locale, **kwargs)
    
    def t(self, key: str, **kwargs) -> str:
        """
        Alias cho __call__
        
        Args:
            key: Key của bản dịch
            **kwargs: Các biến để thay thế
        
        Returns:
            Chuỗi đã dịch
        """
        return self(key, **kwargs)


def get_translator(request: Request) -> Translator:
    """
    Dependency để inject Translator vào endpoint
    
    Usage:
        @app.get("/")
        async def index(t: Translator = Depends(get_translator)):
            return {"message": t("messages.welcome")}
    
    Args:
        request: FastAPI Request object
    
    Returns:
        Translator instance
    """
    locale = get_locale(request)
    return Translator(locale)


def create_translator_factory(default_locale: str = "vi") -> Callable:
    """
    Tạo factory function để tạo translator với locale cố định
    
    Args:
        default_locale: Ngôn ngữ mặc định
    
    Returns:
        Function để tạo Translator
    """
    def factory() -> Translator:
        return Translator(default_locale)
    return factory
