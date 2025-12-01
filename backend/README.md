# FastAPI MongoDB Backend

A professional FastAPI backend template with MongoDB Motor driver.

## Features

- ✨ FastAPI framework
- 🗄️ MongoDB with Motor (async driver)
- 🔒 JWT Authentication
- 📝 Pydantic models for request/response validation
- 🏗️ Clean architecture with separation of concerns
- 🔄 CRUD operations
- 📚 Auto-generated API documentation (Swagger/ReDoc)
- 🧪 Ready for testing
- 🐳 Docker support

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── api.py
│   │       └── endpoints/
│   │           ├── auth.py
│   │           └── users.py
│   ├── core/
│   │   ├── config.py
│   │   ├── database.py
│   │   └── security.py
│   ├── models/
│   │   └── user.py
│   ├── schemas/
│   │   └── user.py
│   ├── services/
│   │   └── user_service.py
│   └── utils/
│       └── helpers.py
├── main.py
├── requirements.txt
└── .env
```

## Setup

1. **Create virtual environment**

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment**

   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Run MongoDB**

   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

5. **Run the application**

   ```bash
   uvicorn main:app --reload
   ```

6. **Access the API**
   - API: http://localhost:8000
   - Swagger docs: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

## API Endpoints

### Public

- `GET /` - Root endpoint
- `GET /health` - Health check

### Authentication

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login

### Users

- `GET /api/v1/users/me` - Get current user
- `GET /api/v1/users/{user_id}` - Get user by ID
- `PUT /api/v1/users/{user_id}` - Update user
- `DELETE /api/v1/users/{user_id}` - Delete user
- `GET /api/v1/users/` - List users

### Posts

- `POST /api/v1/posts/` - Create post
- `GET /api/v1/posts/` - List posts
- `GET /api/v1/posts/{post_id}` - Get post details
- `PUT /api/v1/posts/{post_id}` - Update post
- `DELETE /api/v1/posts/{post_id}` - Delete post

### Answers

- `POST /api/v1/answers/` - Create answer
- `GET /api/v1/answers/` - List answers
- `GET /api/v1/answers/{answer_id}` - Get answer details
- `PUT /api/v1/answers/{answer_id}` - Update answer
- `DELETE /api/v1/answers/{answer_id}` - Delete answer

### Reports (New Feature!)

- `POST /api/v1/reports/` - Create report (báo cáo vi phạm)
- `GET /api/v1/reports/` - List reports (user: own reports, admin: all reports)
- `GET /api/v1/reports/my-reports` - Get current user's reports
- `GET /api/v1/reports/{report_id}` - Get report details
- `POST /api/v1/reports/{report_id}/resolve` - Resolve report (admin only)
- `POST /api/v1/reports/{report_id}/dismiss` - Dismiss report (admin only)
- `GET /api/v1/reports/target/{type}/{id}` - Get reports for target (admin only)

**Report Features:**

- Users can report violations on posts, answers, comments, or users
- Report categories: spam, inappropriate content, harassment, offensive, misleading info
- Minimum 20 characters for detailed reason
- Optional evidence URL attachment
- Admin resolution workflow with action tracking

See [REPORTS_API.md](app/api/v1/endpoints/REPORTS_API.md) for detailed documentation.

### Categories

- `GET /api/v1/categories/` - List categories
- `POST /api/v1/categories/` - Create category

### Tags

- `GET /api/v1/tags/` - List tags
- `POST /api/v1/tags/` - Create tag

### Bookmarks

- `GET /api/v1/bookmarks/` - List bookmarks
- `POST /api/v1/bookmarks/` - Create bookmark
- `DELETE /api/v1/bookmarks/{bookmark_id}` - Delete bookmark

### Notifications

- `GET /api/v1/notifications/` - List notifications
- `PUT /api/v1/notifications/{notification_id}/read` - Mark as read

## Development

### Running tests

```bash
pytest
```

### Code formatting

```bash
black .
```

### Linting

```bash
flake8
```

## Docker

```bash
docker build -t fastapi-backend .
docker run -p 8000:8000 fastapi-backend
```

## License

MIT
