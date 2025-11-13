# Hướng dẫn sử dụng hệ thống i18n (Internationalization)

## Tổng quan

Dự án này đã được tích hợp hệ thống i18n hoàn chỉnh cho cả Frontend (React) và Backend (FastAPI), hỗ trợ Tiếng Việt và Tiếng Nhật.

## 🎯 Tính năng chính

- ✅ Hỗ trợ đa ngôn ngữ: Tiếng Việt (vi) và Tiếng Nhật (ja)
- ✅ Tự động phát hiện ngôn ngữ từ trình duyệt
- ✅ Lưu lựa chọn ngôn ngữ trong localStorage (Frontend) và cookie (Backend)
- ✅ Chuyển đổi ngôn ngữ động không cần reload trang
- ✅ Hỗ trợ interpolation (thay thế biến trong chuỗi dịch)
- ✅ Cấu trúc file translation dễ quản lý và mở rộng

---

## 📁 Cấu trúc thư mục

### Frontend

```
frontend/src/
├── i18n/
│   └── config.js              # Cấu hình i18n
├── locales/
│   ├── vi/
│   │   └── translation.json   # File dịch Tiếng Việt
│   └── ja/
│       └── translation.json   # File dịch Tiếng Nhật
└── components/
    ├── LanguageSwitcher.jsx   # Component chuyển đổi ngôn ngữ
    └── ExampleComponent.jsx   # Component ví dụ
```

### Backend

```
backend/app/
├── i18n/
│   ├── __init__.py
│   ├── i18n.py                # Core i18n module
│   ├── middleware.py          # Middleware phát hiện ngôn ngữ
│   └── dependencies.py        # FastAPI dependencies
├── locales/
│   ├── vi/
│   │   └── messages.json      # File dịch Tiếng Việt
│   └── ja/
│       └── messages.json      # File dịch Tiếng Nhật
└── api/v1/endpoints/
    └── i18n.py                # API endpoints cho i18n
```

---

## 🚀 Sử dụng Frontend

### 1. Import và sử dụng hook useTranslation

```jsx
import { useTranslation } from "react-i18next";

function MyComponent() {
  const { t, i18n } = useTranslation();

  return (
    <div>
      <h1>{t("welcome")}</h1>
      <p>{t("auth.login_success")}</p>
      <button onClick={() => i18n.changeLanguage("ja")}>日本語</button>
    </div>
  );
}
```

### 2. Sử dụng component LanguageSwitcher

```jsx
import LanguageSwitcher from "./components/LanguageSwitcher";

function App() {
  return (
    <div>
      <LanguageSwitcher />
      {/* Nội dung khác */}
    </div>
  );
}
```

### 3. Translation với interpolation (biến)

Trong file `translation.json`:

```json
{
  "greeting": "Xin chào, {{name}}!",
  "items_count": "Bạn có {{count}} mục"
}
```

Sử dụng trong component:

```jsx
const { t } = useTranslation();

<p>{t('greeting', { name: 'Nguyễn Văn A' })}</p>
// Output: Xin chào, Nguyễn Văn A!

<p>{t('items_count', { count: 5 })}</p>
// Output: Bạn có 5 mục
```

### 4. Lấy ngôn ngữ hiện tại

```jsx
const { i18n } = useTranslation();
const currentLanguage = i18n.language; // 'vi' hoặc 'ja'
```

---

## 🔧 Sử dụng Backend

### 1. Sử dụng trong endpoint

```python
from fastapi import APIRouter, Depends
from app.i18n.dependencies import get_translator, Translator

router = APIRouter()

@router.get("/example")
async def example(t: Translator = Depends(get_translator)):
    return {
        "message": t("messages.welcome"),
        "success": t("auth.login_success")
    }
```

### 2. Sử dụng với interpolation

```python
@router.post("/create-user")
async def create_user(t: Translator = Depends(get_translator)):
    # File JSON: "password_min_length": "Mật khẩu phải có ít nhất {min} ký tự"
    return {
        "error": t("validation.password_min_length", min=8)
    }
    # Output: "Mật khẩu phải có ít nhất 8 ký tự"
```

### 3. Gửi request với ngôn ngữ cụ thể

Client có thể chọn ngôn ngữ bằng 3 cách:

**Cách 1: Query parameter**

```
GET /api/v1/i18n/demo?lang=vi
GET /api/v1/i18n/demo?lang=ja
```

**Cách 2: Header**

```
Accept-Language: vi
Accept-Language: ja
```

**Cách 3: Cookie**

```
Cookie: locale=vi
Cookie: locale=ja
```

### 4. API endpoints demo

```bash
# Lấy danh sách ngôn ngữ được hỗ trợ
GET /api/v1/i18n/languages

# Lấy ngôn ngữ hiện tại
GET /api/v1/i18n/current-language

# Demo translation
GET /api/v1/i18n/demo?lang=vi

# Dịch một key cụ thể
GET /api/v1/i18n/translate/auth.login_success?lang=ja
```

---

## 🌍 Mở rộng thêm ngôn ngữ

### Frontend

#### Bước 1: Tạo file translation mới

Tạo thư mục và file cho ngôn ngữ mới (ví dụ: Tiếng Anh)

```bash
mkdir -p frontend/src/locales/en
```

Tạo file `frontend/src/locales/en/translation.json`:

```json
{
  "welcome": "Hello",
  "app_title": "Teach Better - Education Platform",
  "auth": {
    "login": "Login",
    "register": "Register"
  }
  // ... thêm các translation khác
}
```

#### Bước 2: Cập nhật config

Mở file `frontend/src/i18n/config.js` và cập nhật:

```javascript
// Import translation mới
import enTranslation from "../locales/en/translation.json";

// Thêm vào supportedLanguages
export const supportedLanguages = {
  vi: { name: "Tiếng Việt", nativeName: "Tiếng Việt" },
  ja: { name: "Tiếng Nhật", nativeName: "日本語" },
  en: { name: "English", nativeName: "English" }, // Thêm dòng này
};

// Thêm vào resources
const resources = {
  vi: { translation: viTranslation },
  ja: { translation: jaTranslation },
  en: { translation: enTranslation }, // Thêm dòng này
};
```

### Backend

#### Bước 1: Tạo file translation mới

Tạo thư mục và file cho ngôn ngữ mới

```bash
mkdir -p backend/app/locales/en
```

Tạo file `backend/app/locales/en/messages.json`:

```json
{
  "messages": {
    "welcome": "Hello",
    "goodbye": "Goodbye"
  },
  "auth": {
    "login_success": "Login successful",
    "register_success": "Registration successful"
  }
  // ... thêm các translation khác
}
```

#### Bước 2: Cập nhật i18n initialization

Mở file `backend/main.py` và cập nhật:

```python
# Trong hàm lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    # Thêm ngôn ngữ mới vào danh sách
    init_i18n(
        default_locale="vi",
        supported_locales=["vi", "ja", "en"]  # Thêm "en"
    )
    yield
    await close_mongo_connection()
```

---

## 🎨 Best Practices

### 1. Cấu trúc key translation

Sử dụng cấu trúc nested để tổ chức tốt hơn:

```json
{
  "auth": {
    "login": "...",
    "register": "...",
    "errors": {
      "invalid_credentials": "...",
      "account_locked": "..."
    }
  },
  "user": {
    "profile": {
      "title": "...",
      "edit": "..."
    }
  }
}
```

### 2. Đặt tên key rõ ràng

❌ Không nên:

```json
{
  "btn1": "Save",
  "msg": "Success"
}
```

✅ Nên:

```json
{
  "common": {
    "save_button": "Save",
    "success_message": "Success"
  }
}
```

### 3. Sử dụng namespace cho các module lớn

Tách file translation theo module:

```
locales/
  vi/
    common.json
    auth.json
    user.json
    course.json
```

### 4. Consistency trong interpolation

Luôn sử dụng cùng một convention cho biến:

```json
{
  "greeting": "Xin chào, {{userName}}",
  "items": "Có {{itemCount}} mục"
}
```

---

## 🧪 Testing

### Frontend

```bash
cd frontend
npm run dev
```

Kiểm tra:

1. Mở http://localhost:5173
2. Thử chuyển đổi ngôn ngữ bằng LanguageSwitcher
3. Reload trang - ngôn ngữ vẫn được giữ nguyên (localStorage)
4. Kiểm tra developer console để xem locale được lưu

### Backend

```bash
cd backend
python main.py
```

Kiểm tra:

```bash
# Test với Tiếng Việt
curl "http://localhost:8000/api/v1/i18n/demo?lang=vi"

# Test với Tiếng Nhật
curl "http://localhost:8000/api/v1/i18n/demo?lang=ja"

# Test với header
curl -H "Accept-Language: ja" "http://localhost:8000/api/v1/i18n/demo"
```

---

## 🐛 Troubleshooting

### Frontend

**Vấn đề: Không load được translation**

- Kiểm tra file JSON có syntax đúng không
- Kiểm tra import trong `config.js`
- Xóa cache trình duyệt và reload

**Vấn đề: Ngôn ngữ không được lưu**

- Kiểm tra localStorage trong DevTools
- Đảm bảo LanguageDetector được cấu hình đúng

### Backend

**Vấn đề: Module not found**

- Đảm bảo đã cài đặt tất cả dependencies
- Kiểm tra PYTHONPATH

**Vấn đề: Translation không đúng**

- Kiểm tra file JSON trong thư mục locales
- Verify locale được detect đúng bằng endpoint `/api/v1/i18n/current-language`

---

## 📚 Tài liệu tham khảo

### Frontend (react-i18next)

- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Documentation](https://www.i18next.com/)

### Backend (Custom Implementation)

- FastAPI Dependencies: https://fastapi.tiangolo.com/tutorial/dependencies/
- FastAPI Middleware: https://fastapi.tiangolo.com/tutorial/middleware/

---

## 💡 Tips

1. **Tách translation theo feature**: Tạo namespace riêng cho mỗi feature lớn
2. **Sử dụng fallback**: Luôn có ngôn ngữ mặc định
3. **Version control**: Commit cả file translation khi thêm feature mới
4. **Review translation**: Có native speaker review translation cho chính xác
5. **Performance**: Lazy load translation nếu có quá nhiều ngôn ngữ

---

## 📝 License & Credits

Hệ thống i18n này sử dụng:

- Frontend: i18next, react-i18next
- Backend: Custom Python implementation

---

Nếu có câu hỏi hoặc gặp vấn đề, vui lòng tạo issue trên repository!
