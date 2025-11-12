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
