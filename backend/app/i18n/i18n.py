"""
Module i18n cho FastAPI
Cung cấp chức năng đa ngôn ngữ cho backend
"""
import json
import os
from typing import Dict, Optional
from pathlib import Path


class I18n:
    """
    Class quản lý i18n cho backend
    
    Attributes:
        locales_dir: Thư mục chứa các file ngôn ngữ
        default_locale: Ngôn ngữ mặc định
        supported_locales: Danh sách ngôn ngữ được hỗ trợ
        translations: Dict chứa các bản dịch đã load
    """
    
    def __init__(
        self,
        locales_dir: str = None,
        default_locale: str = "vi",
        supported_locales: list = None
    ):
        """
        Khởi tạo I18n
        
        Args:
            locales_dir: Đường dẫn đến thư mục chứa file ngôn ngữ
            default_locale: Ngôn ngữ mặc định
            supported_locales: Danh sách ngôn ngữ được hỗ trợ
        """
        if locales_dir is None:
            # Tự động tìm thư mục locales
            current_dir = Path(__file__).parent.parent
            locales_dir = current_dir / "locales"
        
        self.locales_dir = Path(locales_dir)
        self.default_locale = default_locale
        self.supported_locales = supported_locales or ["vi", "ja"]
        self.translations: Dict[str, Dict] = {}
        
        # Load tất cả translations
        self._load_translations()
    
    def _load_translations(self):
        """Load tất cả file translation từ thư mục locales"""
        for locale in self.supported_locales:
            locale_file = self.locales_dir / locale / "messages.json"
            if locale_file.exists():
                with open(locale_file, "r", encoding="utf-8") as f:
                    self.translations[locale] = json.load(f)
            else:
                print(f"Warning: Translation file not found for locale '{locale}': {locale_file}")
                self.translations[locale] = {}
    
    def get(
        self,
        key: str,
        locale: str = None,
        default: str = None,
        **kwargs
    ) -> str:
        """
        Lấy bản dịch theo key
        
        Args:
            key: Key của bản dịch (hỗ trợ nested key như "auth.login_success")
            locale: Ngôn ngữ cần lấy (nếu None sẽ dùng default_locale)
            default: Giá trị mặc định nếu không tìm thấy
            **kwargs: Các biến để thay thế trong chuỗi dịch
        
        Returns:
            Chuỗi đã dịch hoặc key nếu không tìm thấy
        
        Examples:
            >>> i18n.get("auth.login_success", locale="vi")
            "Đăng nhập thành công"
            
            >>> i18n.get("validation.password_min_length", min=8)
            "Mật khẩu phải có ít nhất 8 ký tự"
        """
        if locale is None:
            locale = self.default_locale
        
        # Nếu locale không được hỗ trợ, dùng default
        if locale not in self.supported_locales:
            locale = self.default_locale
        
        # Lấy translation dict cho locale
        translation_dict = self.translations.get(locale, {})
        
        # Xử lý nested key (vd: "auth.login_success")
        keys = key.split(".")
        value = translation_dict
        
        for k in keys:
            if isinstance(value, dict):
                value = value.get(k)
            else:
                value = None
                break
        
        # Nếu không tìm thấy, thử locale mặc định
        if value is None and locale != self.default_locale:
            return self.get(key, locale=self.default_locale, default=default, **kwargs)
        
        # Nếu vẫn không tìm thấy, trả về default hoặc key
        if value is None:
            return default if default is not None else key
        
        # Format chuỗi với các biến
        if kwargs:
            try:
                value = value.format(**kwargs)
            except KeyError:
                pass
        
        return value
    
    def t(self, key: str, locale: str = None, **kwargs) -> str:
        """
        Alias ngắn gọn cho get()
        
        Args:
            key: Key của bản dịch
            locale: Ngôn ngữ
            **kwargs: Các biến để thay thế
        
        Returns:
            Chuỗi đã dịch
        """
        return self.get(key, locale=locale, **kwargs)
    
    def is_supported(self, locale: str) -> bool:
        """
        Kiểm tra ngôn ngữ có được hỗ trợ không
        
        Args:
            locale: Mã ngôn ngữ cần kiểm tra
        
        Returns:
            True nếu được hỗ trợ, False nếu không
        """
        return locale in self.supported_locales
    
    def get_supported_locales(self) -> list:
        """
        Lấy danh sách ngôn ngữ được hỗ trợ
        
        Returns:
            List các mã ngôn ngữ được hỗ trợ
        """
        return self.supported_locales.copy()


# Singleton instance
_i18n_instance: Optional[I18n] = None


def get_i18n() -> I18n:
    """
    Lấy instance singleton của I18n
    
    Returns:
        Instance I18n
    """
    global _i18n_instance
    if _i18n_instance is None:
        _i18n_instance = I18n()
    return _i18n_instance


def init_i18n(
    locales_dir: str = None,
    default_locale: str = "vi",
    supported_locales: list = None
) -> I18n:
    """
    Khởi tạo I18n với cấu hình tùy chỉnh
    
    Args:
        locales_dir: Đường dẫn đến thư mục locales
        default_locale: Ngôn ngữ mặc định
        supported_locales: Danh sách ngôn ngữ được hỗ trợ
    
    Returns:
        Instance I18n đã được khởi tạo
    """
    global _i18n_instance
    _i18n_instance = I18n(
        locales_dir=locales_dir,
        default_locale=default_locale,
        supported_locales=supported_locales
    )
    return _i18n_instance
