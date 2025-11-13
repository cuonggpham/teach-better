# Quick Start Guide

Hướng dẫn nhanh để chạy project Teach Better Backend.

## Yêu cầu

- Python 3.8+
- MongoDB 4.4+
- pip

## Cài đặt nhanh

### 1. Clone và cài đặt dependencies

```bash
cd /media/DATA/ITSS/teach-better/backend
pip install -r requirements.txt
```

### 2. Cấu hình môi trường

Tạo file `.env` với nội dung:

```env
# MongoDB
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=teach_better

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
BACKEND_CORS_ORIGINS=["http://localhost:3000"]
```

### 3. Khởi chạy MongoDB

**Sử dụng Docker (Khuyên dùng):**

```bash
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  mongo:latest
```

**Hoặc cài đặt trực tiếp:**

```bash
# Ubuntu/Debian
sudo apt install mongodb

# macOS
brew install mongodb-community
```

### 4. Seed dữ liệu mẫu

```bash
python scripts/seed_data.py
```

Output:

```
✅ HOÀN THÀNH SEED DỮ LIỆU
================================
👥 Users: 50
🏷️  Tags: 30
📝 Posts: 100
💬 Answers: ~300
🤖 AI Diagnoses: 30
🚨 Reports: 20
🔔 Notifications: 100
================================

Thông tin đăng nhập Admin:
  Email: admin@teachbetter.com
  Password: admin123
```

### 5. Chạy server

```bash
uvicorn main:app --reload
```

Server sẽ chạy tại: http://localhost:8000

### 6. Truy cập API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Kiểm tra kết nối

### Test API

```bash
# Health check
curl http://localhost:8000/health

# Root endpoint
curl http://localhost:8000/
```

### Test MongoDB

```bash
# Sử dụng mongo shell
mongosh
> use teach_better
> db.users.countDocuments()
50
```

## Cấu trúc Database

### Collections đã được tạo:

1. **users** (50 documents)
   - 1 admin: `admin@teachbetter.com`
   - 49 users thông thường

2. **tags** (30 documents)
   - Ngữ pháp, Phát âm, JLPT, Kanji, etc.

3. **posts** (100 documents)
   - Câu hỏi với votes, comments, tags

4. **answers** (varies)
   - Câu trả lời với comments nhúng

5. **aiDiagnoses** (30 documents)
   - Chẩn đoán AI với questions

6. **reports** (20 documents)
   - Báo cáo vi phạm

7. **notifications** (100 documents)
   - Thông báo cho users

## Các lệnh hữu ích

### Xem logs MongoDB

```bash
docker logs mongodb -f
```

### Xóa và tạo lại dữ liệu

```bash
python scripts/seed_data.py
# Script tự động xóa dữ liệu cũ trước khi tạo mới
```

### Xem indexes

```python
# Trong Python shell
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

async def show_indexes():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.teach_better
    
    collections = await db.list_collection_names()
    for coll in collections:
        indexes = await db[coll].index_information()
        print(f"\n{coll}:")
        for idx_name, idx_info in indexes.items():
            print(f"  - {idx_name}: {idx_info['key']}")

asyncio.run(show_indexes())
```

## Troubleshooting

### Lỗi: "Connection refused" khi kết nối MongoDB

```bash
# Kiểm tra MongoDB đang chạy
docker ps | grep mongodb

# Khởi động lại MongoDB
docker start mongodb
```

### Lỗi: "Database already exists"

```bash
# Xóa database cũ
mongosh
> use teach_better
> db.dropDatabase()
> exit

# Chạy lại seed
python scripts/seed_data.py
```

### Lỗi: "Module not found"

```bash
# Cài đặt lại dependencies
pip install -r requirements.txt --upgrade
```

### Lỗi: Port 8000 đã được sử dụng

```bash
# Chạy trên port khác
uvicorn main:app --reload --port 8001
```

## Next Steps

1. Xem [docs/DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md) để hiểu rõ về database
2. Xem [scripts/README.md](scripts/README.md) để tùy chỉnh seed data
3. Bắt đầu triển khai API endpoints trong `app/api/v1/endpoints/`

## Thông tin thêm

- **Faker locale**: `en_US` và `vi_VN` cho dữ liệu Tiếng Việt
- **Password hashing**: Sử dụng bcrypt
- **Async driver**: Motor cho MongoDB
- **Validation**: Pydantic v2

## Support

Nếu gặp vấn đề, kiểm tra:
1. MongoDB đang chạy và accessible
2. Python version >= 3.8
3. Dependencies đã được cài đặt đầy đủ
4. File `.env` có đúng cấu hình

