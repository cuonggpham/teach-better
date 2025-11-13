# Teach Better - Nền tảng Giáo dục

Một nền tảng giáo dục hiện đại được xây dựng với React (Frontend) và FastAPI (Backend), hỗ trợ đa ngôn ngữ (Tiếng Việt, Tiếng Nhật).

## Mục lục

- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Cài đặt và chạy dự án](#cài-đặt-và-chạy-dự-án)

---

## Công nghệ sử dụng

### Frontend

- **React 19.2.0** - Thư viện xây dựng giao diện người dùng
- **Vite 7.2.2** - Công cụ build nhanh cho ứng dụng web hiện đại
- **React Router v7** - Quản lý điều hướng (routing) trong ứng dụng
- **i18next** - Thư viện hỗ trợ đa ngôn ngữ (internationalization)
- **Axios** - Thư viện HTTP client để gọi API

### Backend

- **FastAPI** - Framework Python hiệu năng cao để xây dựng API
- **MongoDB** - Cơ sở dữ liệu NoSQL linh hoạt
- **Motor** - Driver bất đồng bộ (async) để kết nối MongoDB
- **JWT (JSON Web Token)** - Xác thực và phân quyền người dùng
- **Pydantic** - Validation và quản lý dữ liệu

### DevOps

- **Docker & Docker Compose** - Container hóa ứng dụng
- **Nginx** - Web server cho môi trường production

---

## Cấu trúc dự án

```
teach-better/
├── docker-compose.yml          # File cấu hình Docker Compose
├── I18N_GUIDE.md              # Tài liệu hướng dẫn đa ngôn ngữ
├── README.md                   # File tài liệu chính
│
├── frontend/                   # Thư mục chứa ứng dụng React
│   ├── public/
│   │   └── locales/           # Các file dịch ngôn ngữ cho frontend
│   │       ├── vi/            # Tiếng Việt
│   │       │   └── translation.json
│   │       └── ja/            # Tiếng Nhật
│   │           └── translation.json
│   │
│   ├── src/
│   │   ├── api/               # Tích hợp API
│   │   │   ├── axiosConfig.js     # Cấu hình Axios (base URL, interceptors)
│   │   │   └── itemsApi.js        # Các hàm gọi API
│   │   │
│   │   ├── assets/            # Hình ảnh, fonts, và static files
│   │   │
│   │   ├── components/        # Các React components
│   │   │   ├── ExampleComponent.jsx    # Component ví dụ
│   │   │   ├── ExampleComponent.css    # Style cho component
│   │   │   ├── LanguageSwitcher.jsx    # Component chuyển đổi ngôn ngữ
│   │   │   ├── LanguageSwitcher.css
│   │   │   ├── layout/        # Components layout chung
│   │   │   │   ├── Footer.jsx         # Footer của website
│   │   │   │   ├── Footer.css
│   │   │   │   ├── Navbar.jsx         # Navigation bar
│   │   │   │   └── Navbar.css
│   │   │   └── ui/            # Components UI tái sử dụng (buttons, inputs...)
│   │   │
│   │   ├── contexts/          # React Context API
│   │   │   └── ThemeContext.jsx       # Context quản lý theme (dark/light mode)
│   │   │
│   │   ├── hooks/             # Custom React hooks
│   │   │   └── useFetch.js            # Hook để fetch data từ API
│   │   │
│   │   ├── i18n/              # Cấu hình đa ngôn ngữ
│   │   │   └── config.js              # Setup i18next
│   │   │
│   │   ├── pages/             # Các trang (pages) của ứng dụng
│   │   │   ├── HomePage.jsx           # Trang chủ
│   │   │   ├── HomePage.css
│   │   │   ├── ItemsPage.jsx          # Trang danh sách items
│   │   │   └── ItemsPage.css
│   │   │
│   │   ├── router/            # Cấu hình routing
│   │   │   └── index.jsx              # Định nghĩa các routes
│   │   │
│   │   ├── styles/            # Global styles
│   │   │   └── global.css             # CSS toàn cục
│   │   │
│   │   ├── utils/             # Các hàm tiện ích
│   │   │   └── formatters.js          # Hàm format date, currency, etc.
│   │   │
│   │   ├── App.jsx            # Component root của ứng dụng
│   │   └── main.jsx           # Entry point của React app
│   │
│   ├── Dockerfile             # File build Docker image cho frontend
│   ├── nginx.conf             # Cấu hình Nginx cho production
│   ├── package.json           # Dependencies và scripts của frontend
│   ├── vite.config.js         # Cấu hình Vite
│   ├── eslint.config.js       # Cấu hình ESLint
│   ├── index.html             # HTML template chính
│   └── README.md              # Tài liệu riêng cho frontend
│
└── backend/                   # Thư mục chứa ứng dụng FastAPI
    ├── app/
    │   ├── __init__.py        # Khởi tạo app package
    │   │
    │   ├── api/               # API endpoints
    │   │   ├── __init__.py
    │   │   └── v1/            # API version 1
    │   │       ├── __init__.py
    │   │       ├── api.py             # Router chính tổng hợp các endpoints
    │   │       └── endpoints/         # Các endpoint modules
    │   │           ├── __init__.py
    │   │           ├── auth.py        # Endpoints đăng ký, đăng nhập
    │   │           ├── users.py       # Endpoints quản lý users
    │   │           ├── i18n.py        # Endpoints liên quan đa ngôn ngữ
    │   │           └── i18n_examples.py
    │   │
    │   ├── core/              # Core functionality
    │   │   ├── __init__.py
    │   │   ├── config.py              # Cấu hình ứng dụng (settings)
    │   │   ├── database.py            # Kết nối và quản lý MongoDB
    │   │   └── security.py            # Mã hóa password, tạo JWT tokens
    │   │
    │   ├── i18n/              # Hệ thống đa ngôn ngữ cho backend
    │   │   ├── __init__.py
    │   │   ├── i18n.py                # Logic xử lý đa ngôn ngữ
    │   │   ├── middleware.py          # Middleware detect ngôn ngữ
    │   │   └── dependencies.py        # Dependencies cho i18n
    │   │
    │   ├── locales/           # Các file dịch ngôn ngữ cho backend
    │   │   ├── vi/            # Tiếng Việt
    │   │   │   └── messages.json
    │   │   └── ja/            # Tiếng Nhật
    │   │       └── messages.json
    │   │
    │   ├── models/            # Database models (MongoDB schemas)
    │   │   ├── __init__.py
    │   │   └── user.py                # Model User
    │   │
    │   ├── schemas/           # Pydantic schemas (validation)
    │   │   ├── __init__.py
    │   │   └── user.py                # Schema cho User (request/response)
    │   │
    │   ├── services/          # Business logic layer
    │   │   ├── __init__.py
    │   │   └── user_service.py        # Service xử lý logic liên quan User
    │   │
    │   └── utils/             # Các hàm tiện ích
    │       ├── __init__.py
    │       └── helpers.py             # Helper functions
    │
    ├── main.py                # Entry point của FastAPI application
    ├── requirements.txt       # Python dependencies
    ├── Dockerfile             # File build Docker image cho backend
    ├── docker-compose.yml     # Docker Compose riêng cho backend (nếu cần)
    └── README.md              # Tài liệu riêng cho backend
```

### Giải thích chi tiết

#### Frontend (React + Vite)

- **api/**: Chứa các file cấu hình và hàm gọi API. Axios được config ở `axiosConfig.js` với base URL, interceptors để xử lý token, error handling.
- **components/**: Chứa các React components tái sử dụng. Mỗi component có file `.jsx` và file `.css` riêng.
  - **layout/**: Components dùng chung cho layout như Header, Footer, Sidebar.
  - **ui/**: Các components UI nhỏ như Button, Input, Card để tái sử dụng.
- **contexts/**: React Context để quản lý state toàn cục (theme, auth, etc.).
- **hooks/**: Custom hooks để tái sử dụng logic (useFetch, useAuth, useForm...).
- **i18n/**: Cấu hình i18next để hỗ trợ đa ngôn ngữ.
- **pages/**: Các trang chính của ứng dụng, mỗi page tương ứng với một route.
- **router/**: Cấu hình React Router, định nghĩa các routes và protected routes.
- **styles/**: CSS toàn cục, variables, themes.
- **utils/**: Các hàm utility như format date, currency, validation...

#### Backend (FastAPI + MongoDB)

- **api/v1/endpoints/**: Chứa các API endpoints được chia theo chức năng (auth, users, courses...).
- **core/**: Chứa các module cốt lõi:
  - `config.py`: Đọc environment variables, cấu hình app.
  - `database.py`: Kết nối MongoDB, khởi tạo database.
  - `security.py`: Xử lý JWT, hash password, verify token.
- **i18n/**: Hệ thống đa ngôn ngữ cho API responses:
  - `middleware.py`: Detect ngôn ngữ từ header `Accept-Language`.
  - `i18n.py`: Load và trả về message theo ngôn ngữ.
- **models/**: MongoDB models, định nghĩa cấu trúc collection.
- **schemas/**: Pydantic schemas để validate request body và định nghĩa response format.
- **services/**: Business logic layer, xử lý các nghiệp vụ phức tạp, tương tác với database.
- **utils/**: Các hàm helper, utilities dùng chung.

---

## Cài đặt và chạy dự án

## Cài đặt và chạy dự án

### Yêu cầu hệ thống

- **Node.js** >= 20.x
- **Python** >= 3.11
- **MongoDB** >= 6.0
- **Docker & Docker Compose** (cho Option 1)
- **Git**

---

### Option 1: Chạy với Docker Compose (Khuyến nghị)

Cách này đơn giản nhất, không cần cài đặt MongoDB, Python, Node.js riêng lẻ. Docker sẽ tự động setup tất cả.

```bash
# 1. Clone repository về máy
git clone https://github.com/your-org/teach-better.git
cd teach-better

# 2. Chạy tất cả services (frontend, backend, mongodb)
docker-compose up -d

# 3. Xem logs để kiểm tra
docker-compose logs -f

# 4. Dừng tất cả services
docker-compose down
```

**Truy cập ứng dụng:**

- Frontend: http://localhost:80
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

**Giải thích:**

- `docker-compose up -d`: Khởi động tất cả containers ở chế độ background (-d = detached)
- `docker-compose logs -f`: Xem logs realtime của tất cả services
- `docker-compose down`: Dừng và xóa tất cả containers

---

### Option 2: Chạy local development (Không dùng Docker)

Cách này phù hợp khi bạn muốn phát triển và debug chi tiết từng phần.

#### Bước 1: Cài đặt và chạy MongoDB

**Sử dụng Docker (đơn giản nhất):**

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Hoặc cài đặt MongoDB trực tiếp:**

- **macOS**:
  ```bash
  brew install mongodb-community
  brew services start mongodb-community
  ```
- **Ubuntu/Debian**:
  ```bash
  sudo apt-get update
  sudo apt-get install -y mongodb
  sudo systemctl start mongodb
  ```

#### Bước 2: Chạy Backend (FastAPI)

```bash
# Di chuyển vào thư mục backend
cd backend

# Tạo Python virtual environment
python -m venv venv

# Kích hoạt virtual environment
source venv/bin/activate  # Linux/macOS
# Hoặc: venv\Scripts\activate  # Windows

# Cài đặt các thư viện Python cần thiết
pip install -r requirements.txt

# Tạo file .env (nếu chưa có)
cat > .env << EOF
PROJECT_NAME=Teach Better API
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=teach_better_db
SECRET_KEY=your-secret-key-change-this-in-production
ENVIRONMENT=development
EOF

# Chạy server backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Backend sẽ chạy tại:** http://localhost:8000

**Giải thích:**

- `python -m venv venv`: Tạo môi trường Python ảo để cài đặt packages riêng biệt
- `source venv/bin/activate`: Kích hoạt virtual environment
- `pip install -r requirements.txt`: Cài tất cả dependencies từ file requirements.txt
- `uvicorn main:app --reload`: Chạy FastAPI server với auto-reload khi code thay đổi

#### Bước 3: Chạy Frontend (React + Vite)

Mở terminal mới (giữ terminal backend đang chạy):

```bash
# Di chuyển vào thư mục frontend
cd frontend

# Cài đặt các thư viện Node.js
npm install

# Tạo file .env (nếu chưa có)
cat > .env << EOF
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_APP_ENV=development
EOF

# Chạy development server
npm run dev
```

**Frontend sẽ chạy tại:** http://localhost:5173

**Giải thích:**

- `npm install`: Cài tất cả dependencies từ package.json
- `npm run dev`: Chạy Vite dev server với hot reload

#### Bước 4: Kiểm tra ứng dụng

- Mở trình duyệt và truy cập http://localhost:5173
- API documentation có sẵn tại http://localhost:8000/docs
- MongoDB đang chạy ở port 27017

#### Dừng các services

```bash
# Dừng Frontend: Ctrl + C trong terminal đang chạy npm run dev
# Dừng Backend: Ctrl + C trong terminal đang chạy uvicorn
# Dừng MongoDB (nếu dùng Docker):
docker stop mongodb
```

---

### Troubleshooting (Xử lý lỗi thường gặp)

**1. Lỗi kết nối MongoDB:**

```bash
# Kiểm tra MongoDB đang chạy
docker ps | grep mongodb
# Hoặc
sudo systemctl status mongodb

# Khởi động lại MongoDB
docker restart mongodb
# Hoặc
sudo systemctl restart mongodb
```

**2. Port đã được sử dụng:**

```bash
# Tìm process đang sử dụng port 8000
lsof -i :8000
# Kill process nếu cần
kill -9 <PID>
```

**3. Lỗi cài đặt dependencies:**

```bash
# Backend: Xóa và cài lại
cd backend
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend: Xóa và cài lại
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

**Last Updated:** November 13, 2025
