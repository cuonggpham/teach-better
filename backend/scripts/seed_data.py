"""
Seed data script for teach-better application
Creates: 10 users (2 admins), 10 categories, tags for each category, 20 posts
"""
import asyncio
from datetime import datetime, timedelta
import random
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from passlib.context import CryptContext

# Database settings
MONGODB_URL = "mongodb://localhost:27017"
MONGODB_DB_NAME = "teach_better_db"

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
DEFAULT_PASSWORD = "password123"


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


# ============ USERS DATA ============
USERS = [
    # Admins
    {
        "name": "Admin Nguyễn",
        "email": "admin@teachbetter.com",
        "role": "admin",
        "bio": "Quản trị viên hệ thống Teach Better",
        "avatar_url": None
    },
    {
        "name": "Admin Trần",
        "email": "admin2@teachbetter.com",
        "role": "admin",
        "bio": "Quản trị viên phụ trách nội dung",
        "avatar_url": None
    },
    # Regular users
    {
        "name": "Lê Văn A",
        "email": "levan.a@gmail.com",
        "role": "user",
        "bio": "Giáo viên Toán THPT",
        "avatar_url": None
    },
    {
        "name": "Trần Thị B",
        "email": "tranthi.b@gmail.com",
        "role": "user",
        "bio": "Sinh viên Đại học Sư phạm Hà Nội",
        "avatar_url": None
    },
    {
        "name": "Phạm Văn C",
        "email": "phamvan.c@gmail.com",
        "role": "user",
        "bio": "Giáo viên Tiếng Anh THCS",
        "avatar_url": None
    },
    {
        "name": "Nguyễn Thị D",
        "email": "nguyenthi.d@gmail.com",
        "role": "user",
        "bio": "Gia sư môn Vật lý",
        "avatar_url": None
    },
    {
        "name": "Hoàng Văn E",
        "email": "hoangvan.e@gmail.com",
        "role": "user",
        "bio": "Giáo viên Hóa học THPT Chuyên",
        "avatar_url": None
    },
    {
        "name": "Vũ Thị F",
        "email": "vuthi.f@gmail.com",
        "role": "user",
        "bio": "Sinh viên năm cuối ngành Sư phạm Văn",
        "avatar_url": None
    },
    {
        "name": "Đặng Văn G",
        "email": "dangvan.g@gmail.com",
        "role": "user",
        "bio": "Giáo viên Tin học",
        "avatar_url": None
    },
    {
        "name": "Bùi Thị H",
        "email": "buithi.h@gmail.com",
        "role": "user",
        "bio": "Giáo viên Sinh học THCS",
        "avatar_url": None
    }
]


# ============ CATEGORIES DATA ============
CATEGORIES = [
    {
        "name": "Toán học",
        "description": "Các câu hỏi về đại số, hình học, giải tích và các chủ đề toán học khác"
    },
    {
        "name": "Tiếng Anh",
        "description": "Ngữ pháp, từ vựng, kỹ năng đọc và viết tiếng Anh"
    },
    {
        "name": "Vật lý",
        "description": "Cơ học, điện học, quang học và các hiện tượng vật lý"
    },
    {
        "name": "Hóa học",
        "description": "Hóa học hữu cơ, vô cơ, phản ứng hóa học"
    },
    {
        "name": "Ngữ văn",
        "description": "Văn học Việt Nam, văn học nước ngoài, làm văn"
    },
    {
        "name": "Lịch sử",
        "description": "Lịch sử Việt Nam và lịch sử thế giới"
    },
    {
        "name": "Địa lý",
        "description": "Địa lý tự nhiên và địa lý kinh tế - xã hội"
    },
    {
        "name": "Sinh học",
        "description": "Di truyền học, sinh thái học, giải phẫu sinh lý"
    },
    {
        "name": "Tin học",
        "description": "Lập trình, thuật toán, cơ sở dữ liệu và công nghệ thông tin"
    },
    {
        "name": "Giáo dục công dân",
        "description": "Đạo đức, pháp luật và kỹ năng sống"
    }
]


# ============ TAGS DATA (mapped to categories) ============
TAGS_BY_CATEGORY = {
    "Toán học": [
        {"name": "Đại số", "description": "Đại số cơ bản và nâng cao"},
        {"name": "Hình học", "description": "Hình học phẳng và không gian"},
        {"name": "Giải tích", "description": "Đạo hàm, tích phân, giới hạn"},
        {"name": "Tổ hợp - Xác suất", "description": "Tổ hợp, hoán vị và xác suất"}
    ],
    "Tiếng Anh": [
        {"name": "Grammar", "description": "Ngữ pháp tiếng Anh"},
        {"name": "Vocabulary", "description": "Từ vựng tiếng Anh"},
        {"name": "IELTS", "description": "Luyện thi IELTS"},
        {"name": "TOEIC", "description": "Luyện thi TOEIC"}
    ],
    "Vật lý": [
        {"name": "Cơ học", "description": "Động học, động lực học"},
        {"name": "Điện học", "description": "Điện tích, điện trường, mạch điện"},
        {"name": "Quang học", "description": "Ánh sáng, thấu kính, gương"},
        {"name": "Nhiệt học", "description": "Nhiệt độ, nhiệt lượng, các quá trình nhiệt"}
    ],
    "Hóa học": [
        {"name": "Hóa hữu cơ", "description": "Hợp chất hữu cơ"},
        {"name": "Hóa vô cơ", "description": "Hợp chất vô cơ"},
        {"name": "Bảng tuần hoàn", "description": "Nguyên tố hóa học"},
        {"name": "Phản ứng hóa học", "description": "Cân bằng và tính toán hóa học"}
    ],
    "Ngữ văn": [
        {"name": "Văn học cổ điển", "description": "Văn học trung đại Việt Nam"},
        {"name": "Văn học hiện đại", "description": "Văn học Việt Nam từ 1930"},
        {"name": "Nghị luận văn học", "description": "Cách viết bài nghị luận"},
        {"name": "Văn học nước ngoài", "description": "Tác phẩm văn học thế giới"}
    ],
    "Lịch sử": [
        {"name": "Lịch sử Việt Nam", "description": "Các thời kỳ lịch sử Việt Nam"},
        {"name": "Lịch sử thế giới", "description": "Lịch sử các nước trên thế giới"},
        {"name": "Cách mạng Việt Nam", "description": "Các phong trào cách mạng"}
    ],
    "Địa lý": [
        {"name": "Địa lý tự nhiên", "description": "Khí hậu, địa hình, thủy văn"},
        {"name": "Địa lý kinh tế", "description": "Kinh tế các vùng và ngành"},
        {"name": "Địa lý dân cư", "description": "Dân số và phân bố dân cư"}
    ],
    "Sinh học": [
        {"name": "Di truyền học", "description": "Gen, biến dị, đột biến"},
        {"name": "Sinh thái học", "description": "Hệ sinh thái và môi trường"},
        {"name": "Sinh học tế bào", "description": "Cấu trúc và chức năng tế bào"}
    ],
    "Tin học": [
        {"name": "Python", "description": "Lập trình Python"},
        {"name": "Thuật toán", "description": "Giải thuật và cấu trúc dữ liệu"},
        {"name": "Web Development", "description": "Phát triển web"},
        {"name": "Cơ sở dữ liệu", "description": "SQL và NoSQL"}
    ],
    "Giáo dục công dân": [
        {"name": "Đạo đức", "description": "Giáo dục đạo đức"},
        {"name": "Pháp luật", "description": "Kiến thức pháp luật cơ bản"},
        {"name": "Kỹ năng sống", "description": "Kỹ năng mềm và phát triển bản thân"}
    ]
}


# ============ POSTS DATA ============
POSTS = [
    # Toán học posts
    {
        "title": "Cách giải phương trình bậc hai dạng đặc biệt?",
        "content": """Mình đang gặp khó khăn với dạng phương trình: ax² + bx + c = 0 khi a + b + c = 0.

Có ai biết cách giải nhanh không ạ? Mình thấy công thức nghiệm delta dài quá.

Ví dụ: 2x² - 3x + 1 = 0

Mong các bạn hướng dẫn!""",
        "category": "Toán học",
        "tags": ["Đại số"]
    },
    {
        "title": "Tính tích phân bằng phương pháp đổi biến",
        "content": """Cho tích phân: ∫(0→1) x√(1-x²) dx

Mình muốn hỏi cách đặt u = 1 - x² có đúng không? Và các bước tính chi tiết như thế nào?

Cảm ơn mọi người!""",
        "category": "Toán học",
        "tags": ["Giải tích"]
    },
    # Tiếng Anh posts
    {
        "title": "Phân biệt 'Present Perfect' và 'Past Simple'",
        "content": """Mình hay bị nhầm lẫn giữa hai thì này. Ví dụ:
        
- I have visited Paris. (Present Perfect)
- I visited Paris last year. (Past Simple)

Khi nào dùng thì nào? Có quy tắc gì dễ nhớ không ạ?""",
        "category": "Tiếng Anh",
        "tags": ["Grammar"]
    },
    {
        "title": "Cách học từ vựng IELTS hiệu quả?",
        "content": """Mình đang chuẩn bị thi IELTS và cần học khoảng 3000 từ vựng.

Có ai có kinh nghiệm học từ vựng hiệu quả không? Dùng app nào tốt? Nên học theo chủ đề hay theo tần suất xuất hiện?

Mục tiêu của mình là 7.0 trong 4 tháng.""",
        "category": "Tiếng Anh",
        "tags": ["IELTS", "Vocabulary"]
    },
    # Vật lý posts
    {
        "title": "Bài toán chuyển động ném xiên",
        "content": """Một vật được ném xiên với vận tốc ban đầu v₀ = 20 m/s, góc ném α = 30°.

Hỏi:
1. Độ cao cực đại của vật?
2. Tầm bay xa?
3. Thời gian chuyển động?

(Bỏ qua sức cản không khí, g = 10 m/s²)""",
        "category": "Vật lý",
        "tags": ["Cơ học"]
    },
    {
        "title": "Cách tính điện trở tương đương mạch cầu",
        "content": """Cho mạch điện hình cầu với 5 điện trở bằng nhau R.

Mình không biết cách xác định mạch cầu cân bằng và tính điện trở tương đương.

Mong các bạn giải thích chi tiết!""",
        "category": "Vật lý",
        "tags": ["Điện học"]
    },
    # Hóa học posts
    {
        "title": "Cân bằng phương trình phản ứng oxi hóa khử",
        "content": """Fe + HNO₃ → Fe(NO₃)₃ + NO↑ + H₂O

Mình cần cân bằng phương trình trên bằng phương pháp thăng bằng electron.

Ai có thể hướng dẫn từng bước không ạ?""",
        "category": "Hóa học",
        "tags": ["Phản ứng hóa học"]
    },
    {
        "title": "Phân biệt các loại isomer trong hóa hữu cơ",
        "content": """Mình đang học phần đồng phân trong hóa hữu cơ nhưng hay nhầm lẫn:

- Đồng phân cấu tạo
- Đồng phân hình học
- Đồng phân quang học

Có ai giải thích và cho ví dụ rõ ràng không?""",
        "category": "Hóa học",
        "tags": ["Hóa hữu cơ"]
    },
    # Ngữ văn posts
    {
        "title": "Phân tích nhân vật Chí Phèo trong tác phẩm cùng tên",
        "content": """Mình cần làm bài phân tích nhân vật Chí Phèo.

Các ý chính cần triển khai là gì? Làm sao để bài viết không bị lan man?

Mọi người có thể chia sẻ dàn ý không ạ?""",
        "category": "Ngữ văn",
        "tags": ["Văn học hiện đại", "Nghị luận văn học"]
    },
    {
        "title": "Cách viết mở bài nghị luận xã hội hay?",
        "content": """Mình thấy phần mở bài nghị luận xã hội rất quan trọng nhưng không biết viết sao cho hấp dẫn.

Có những cách mở bài nào? Ví dụ cho đề: "Sống là cho đâu chỉ nhận riêng mình"?""",
        "category": "Ngữ văn",
        "tags": ["Nghị luận văn học"]
    },
    # Lịch sử posts
    {
        "title": "Nguyên nhân thắng lợi cách mạng tháng 8/1945",
        "content": """Bạn nào có thể tổng hợp các nguyên nhân chủ quan và khách quan dẫn đến thắng lợi của Cách mạng tháng Tám 1945?

Mình cần chuẩn bị cho bài kiểm tra tuần tới.""",
        "category": "Lịch sử",
        "tags": ["Lịch sử Việt Nam", "Cách mạng Việt Nam"]
    },
    {
        "title": "So sánh hai cuộc chiến tranh thế giới",
        "content": """Mình cần so sánh Chiến tranh thế giới thứ nhất và thứ hai về:
- Nguyên nhân
- Diễn biến chính
- Kết quả và hậu quả

Mọi người giúp mình với!""",
        "category": "Lịch sử",
        "tags": ["Lịch sử thế giới"]
    },
    # Địa lý posts
    {
        "title": "Đặc điểm khí hậu nhiệt đới gió mùa Việt Nam",
        "content": """Mình cần trình bày đặc điểm khí hậu nhiệt đới gió mùa của Việt Nam và ảnh hưởng đến sản xuất nông nghiệp.

Có ai có tài liệu hoặc ý chính không ạ?""",
        "category": "Địa lý",
        "tags": ["Địa lý tự nhiên"]
    },
    {
        "title": "Phân tích thế mạnh kinh tế vùng Đông Nam Bộ",
        "content": """Vùng Đông Nam Bộ có những thế mạnh kinh tế gì?

Tại sao vùng này lại là đầu tàu kinh tế của cả nước?""",
        "category": "Địa lý",
        "tags": ["Địa lý kinh tế"]
    },
    # Sinh học posts
    {
        "title": "Quy luật phân li độc lập của Mendel",
        "content": """Mình không hiểu rõ quy luật phân li độc lập.

Ví dụ: Nếu P: AaBb x AaBb thì tỉ lệ kiểu gen và kiểu hình ở F1 là bao nhiêu?

Giải thích chi tiết giúp mình với!""",
        "category": "Sinh học",
        "tags": ["Di truyền học"]
    },
    {
        "title": "Chuỗi thức ăn và lưới thức ăn trong hệ sinh thái",
        "content": """Phân biệt chuỗi thức ăn và lưới thức ăn?

Cho ví dụ về một lưới thức ăn trong hệ sinh thái rừng nhiệt đới.""",
        "category": "Sinh học",
        "tags": ["Sinh thái học"]
    },
    # Tin học posts
    {
        "title": "Cách viết hàm đệ quy tính giai thừa trong Python",
        "content": """Mình mới học Python và muốn viết hàm đệ quy tính n!

```python
def factorial(n):
    # ???
```

Mọi người hướng dẫn giúp mình với!""",
        "category": "Tin học",
        "tags": ["Python", "Thuật toán"]
    },
    {
        "title": "Khác biệt giữa SQL và NoSQL?",
        "content": """Mình đang tìm hiểu về database và thấy có 2 loại: SQL và NoSQL.

Khi nào nên dùng SQL? Khi nào nên dùng NoSQL?

Cho ví dụ cụ thể giúp mình với!""",
        "category": "Tin học",
        "tags": ["Cơ sở dữ liệu"]
    },
    # Giáo dục công dân posts
    {
        "title": "Quyền và nghĩa vụ cơ bản của công dân",
        "content": """Theo Hiến pháp 2013, công dân Việt Nam có những quyền và nghĩa vụ cơ bản nào?

Mình cần chuẩn bị cho buổi thảo luận nhóm.""",
        "category": "Giáo dục công dân",
        "tags": ["Pháp luật"]
    },
    {
        "title": "Làm thế nào để rèn luyện kỹ năng giao tiếp?",
        "content": """Mình khá nhút nhát và muốn cải thiện kỹ năng giao tiếp.

Có bạn nào có kinh nghiệm không? Chia sẻ tips giúp mình với!""",
        "category": "Giáo dục công dân",
        "tags": ["Kỹ năng sống"]
    }
]


async def clear_collections(db):
    """Clear existing data from collections"""
    print("🧹 Clearing existing data...")
    await db.users.delete_many({})
    await db.categories.delete_many({})
    await db.tags.delete_many({})
    await db.posts.delete_many({})
    await db.answers.delete_many({})
    print("✅ Collections cleared!")


async def seed_users(db):
    """Seed users into database"""
    print("\n👤 Seeding users...")
    hashed_password = get_password_hash(DEFAULT_PASSWORD)
    user_ids = {}
    
    for user in USERS:
        user_doc = {
            "name": user["name"],
            "email": user["email"],
            "hashed_password": hashed_password,
            "avatar_url": user.get("avatar_url"),
            "bio": user.get("bio"),
            "role": user["role"],
            "status": "active",
            "violation_count": 0,
            "ban_expires_at": None,
            "ban_reason": None,
            "bookmarks": [],
            "bookmarked_post_ids": [],
            "created_at": datetime.utcnow() - timedelta(days=random.randint(1, 90)),
            "updated_at": datetime.utcnow()
        }
        result = await db.users.insert_one(user_doc)
        user_ids[user["email"]] = result.inserted_id
        print(f"  ✓ Created user: {user['name']} ({user['email']}) - Role: {user['role']}")
    
    print(f"✅ Created {len(USERS)} users!")
    return user_ids


async def seed_categories(db):
    """Seed categories into database"""
    print("\n📁 Seeding categories...")
    category_names = {}
    
    for category in CATEGORIES:
        category_doc = {
            "name": category["name"],
            "description": category["description"],
            "post_count": 0,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        result = await db.categories.insert_one(category_doc)
        category_names[category["name"]] = result.inserted_id
        print(f"  ✓ Created category: {category['name']}")
    
    print(f"✅ Created {len(CATEGORIES)} categories!")
    return category_names


async def seed_tags(db, user_ids):
    """Seed tags into database"""
    print("\n🏷️  Seeding tags...")
    tag_ids = {}
    admin_id = list(user_ids.values())[0]  # Use first admin to create tags
    
    for category_name, tags in TAGS_BY_CATEGORY.items():
        for tag in tags:
            tag_doc = {
                "name": tag["name"],
                "description": tag["description"],
                "post_count": 0,
                "is_active": True,
                "created_by": admin_id,
                "created_at": datetime.utcnow()
            }
            result = await db.tags.insert_one(tag_doc)
            tag_ids[tag["name"]] = result.inserted_id
            print(f"  ✓ Created tag: {tag['name']} (Category: {category_name})")
    
    total_tags = sum(len(tags) for tags in TAGS_BY_CATEGORY.values())
    print(f"✅ Created {total_tags} tags!")
    return tag_ids


async def seed_posts(db, user_ids, tag_ids):
    """Seed posts into database"""
    print("\n📝 Seeding posts...")
    
    # Get list of regular users (not admins)
    regular_user_emails = [u["email"] for u in USERS if u["role"] == "user"]
    
    for i, post in enumerate(POSTS):
        # Randomly select an author from regular users
        author_email = random.choice(regular_user_emails)
        author_id = user_ids[author_email]
        
        # Get tag IDs for this post
        post_tag_ids = [tag_ids[tag_name] for tag_name in post["tags"] if tag_name in tag_ids]
        
        post_doc = {
            "title": post["title"],
            "content": post["content"],
            "author_id": author_id,
            "category": post["category"],
            "tag_ids": post_tag_ids,
            "answer_count": 0,
            "view_count": random.randint(10, 500),
            "is_deleted": False,
            "created_at": datetime.utcnow() - timedelta(days=random.randint(1, 30)),
            "updated_at": datetime.utcnow()
        }
        result = await db.posts.insert_one(post_doc)
        
        # Update category post count
        await db.categories.update_one(
            {"name": post["category"]},
            {"$inc": {"post_count": 1}}
        )
        
        # Update tag post counts
        for tag_id in post_tag_ids:
            await db.tags.update_one(
                {"_id": tag_id},
                {"$inc": {"post_count": 1}}
            )
        
        print(f"  ✓ Created post #{i+1}: {post['title'][:50]}... ({post['category']})")
    
    print(f"✅ Created {len(POSTS)} posts!")


async def main():
    """Main function to seed database"""
    print("=" * 60)
    print("🌱 TEACH BETTER - DATABASE SEEDING SCRIPT")
    print("=" * 60)
    print(f"\n📊 Data to be created:")
    print(f"   - Users: {len(USERS)} (2 admins, 8 regular users)")
    print(f"   - Categories: {len(CATEGORIES)}")
    print(f"   - Tags: {sum(len(tags) for tags in TAGS_BY_CATEGORY.values())}")
    print(f"   - Posts: {len(POSTS)}")
    print(f"\n🔐 Default password: {DEFAULT_PASSWORD}")
    print("=" * 60)
    
    # Connect to MongoDB
    print("\n🔗 Connecting to MongoDB...")
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[MONGODB_DB_NAME]
    
    try:
        # Test connection
        await client.admin.command('ping')
        print("✅ Connected to MongoDB!")
        
        # Clear existing data
        await clear_collections(db)
        
        # Seed data
        user_ids = await seed_users(db)
        category_ids = await seed_categories(db)
        tag_ids = await seed_tags(db, user_ids)
        await seed_posts(db, user_ids, tag_ids)
        
        print("\n" + "=" * 60)
        print("🎉 SEEDING COMPLETE!")
        print("=" * 60)
        print("\n📋 Summary:")
        print(f"   ✓ Users: {len(USERS)}")
        print(f"   ✓ Categories: {len(CATEGORIES)}")
        print(f"   ✓ Tags: {sum(len(tags) for tags in TAGS_BY_CATEGORY.values())}")
        print(f"   ✓ Posts: {len(POSTS)}")
        print(f"\n🔑 Login credentials:")
        print(f"   Admin 1: admin@teachbetter.com / {DEFAULT_PASSWORD}")
        print(f"   Admin 2: admin2@teachbetter.com / {DEFAULT_PASSWORD}")
        print(f"   Users: levan.a@gmail.com, tranthi.b@gmail.com, ... / {DEFAULT_PASSWORD}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        raise
    finally:
        client.close()
        print("\n🔌 Disconnected from MongoDB.")


if __name__ == "__main__":
    asyncio.run(main())