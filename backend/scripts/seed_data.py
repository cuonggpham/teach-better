import asyncio
import sys
from pathlib import Path
from datetime import datetime, timedelta, timezone
from bson import ObjectId
import random

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.core.security import get_password_hash


# Fixed Categories (10 categories)
CATEGORIES = [
    {
        "name": "Toán học",
        "description": "Các câu hỏi về toán học từ cơ bản đến nâng cao",
        "post_count": 0
    },
    {
        "name": "Tiếng Anh",
        "description": "Học tiếng Anh, ngữ pháp, từ vựng và giao tiếp",
        "post_count": 0
    },
    {
        "name": "Vật lý",
        "description": "Khám phá các hiện tượng vật lý và định luật tự nhiên",
        "post_count": 0
    },
    {
        "name": "Hóa học",
        "description": "Nghiên cứu về chất, phản ứng hóa học và ứng dụng",
        "post_count": 0
    },
    {
        "name": "Lập trình",
        "description": "Học lập trình, thuật toán và phát triển phần mềm",
        "post_count": 0
    },
    {
        "name": "Tiếng Nhật",
        "description": "Học tiếng Nhật, kanji, ngữ pháp và văn hóa Nhật Bản",
        "post_count": 0
    },
    {
        "name": "Sinh học",
        "description": "Khám phá về sự sống, sinh vật và môi trường",
        "post_count": 0
    },
    {
        "name": "Địa lý",
        "description": "Tìm hiểu về địa hình, khí hậu và con người",
        "post_count": 0
    },
    {
        "name": "Lịch sử",
        "description": "Nghiên cứu các sự kiện lịch sử và văn minh nhân loại",
        "post_count": 0
    },
    {
        "name": "Phương pháp dạy học",
        "description": "Chia sẻ kinh nghiệm và phương pháp giảng dạy hiệu quả",
        "post_count": 0
    }
]

# Users Data (5 users)
USERS = [
    {
        "name": "Nguyễn Văn An",
        "email": "an.nguyen@example.com",
        "password": "password123",
        "avatar_url": "https://i.pravatar.cc/150?img=1",
        "bio": "Giáo viên Toán học với 10 năm kinh nghiệm. Đam mê chia sẻ kiến thức và phương pháp giải toán sáng tạo.",
        "role": "user",
        "status": "active"
    },
    {
        "name": "Trần Thị Bình",
        "email": "binh.tran@example.com",
        "password": "password123",
        "avatar_url": "https://i.pravatar.cc/150?img=5",
        "bio": "Chuyên gia tiếng Anh với bằng TESOL. Yêu thích việc giúp học sinh cải thiện kỹ năng giao tiếp.",
        "role": "user",
        "status": "active"
    },
    {
        "name": "Lê Minh Cường",
        "email": "cuong.le@example.com",
        "password": "password123",
        "avatar_url": "https://i.pravatar.cc/150?img=12",
        "bio": "Developer và giảng viên lập trình. Chuyên về Python, JavaScript và phát triển web.",
        "role": "admin",
        "status": "active"
    },
    {
        "name": "Phạm Thu Dung",
        "email": "dung.pham@example.com",
        "password": "password123",
        "avatar_url": "https://i.pravatar.cc/150?img=9",
        "bio": "Giáo viên Vật lý nhiệt tình. Thích thực hành và thí nghiệm để học sinh hiểu bài sâu hơn.",
        "role": "user",
        "status": "active"
    },
    {
        "name": "Hoàng Văn Em",
        "email": "em.hoang@example.com",
        "password": "password123",
        "avatar_url": "https://i.pravatar.cc/150?img=15",
        "bio": "Sinh viên năm 4 chuyên ngành Sư phạm. Đang tìm hiểu các phương pháp dạy học hiện đại.",
        "role": "user",
        "status": "active"
    }
]

# Tags data - will be created dynamically
TAG_TEMPLATES = {
    "Toán học": ["Đại số", "Hình học", "Giải tích", "Tích phân", "Đạo hàm", "Phương trình"],
    "Tiếng Anh": ["Ngữ pháp", "Từ vựng", "IELTS", "TOEIC", "Phát âm", "Giao tiếp"],
    "Vật lý": ["Cơ học", "Nhiệt học", "Điện học", "Quang học", "Vật lý đại cương"],
    "Hóa học": ["Hóa vô cơ", "Hóa hữu cơ", "Phản ứng", "Bảng tuần hoàn", "Cân bằng hóa học"],
    "Lập trình": ["Python", "JavaScript", "React", "FastAPI", "MongoDB", "Thuật toán"],
    "Tiếng Nhật": ["JLPT N3", "JLPT N2", "Kanji", "Ngữ pháp Nhật", "Từ vựng", "Hội thoại"],
    "Sinh học": ["Tế bào", "Di truyền", "Sinh thái", "Tiến hóa", "Thực vật", "Động vật"],
    "Địa lý": ["Địa hình", "Khí hậu", "Dân cư", "Kinh tế", "Môi trường"],
    "Lịch sử": ["Lịch sử Việt Nam", "Lịch sử Thế giới", "Văn minh", "Chiến tranh"],
    "Phương pháp dạy học": ["Dạy học tích cực", "Công nghệ giáo dục", "Đánh giá", "Quản lý lớp học"]
}

# Posts data templates (will create 20 posts)
POST_TEMPLATES = [
    {
        "title": "Cách giải phương trình bậc 2 hiệu quả nhất?",
        "content": "Các bạn có thể chia sẻ phương pháp giải phương trình bậc 2 một cách dễ hiểu cho học sinh lớp 9 không? Tôi muốn tìm cách giải thích delta một cách trực quan hơn.",
        "category": "Toán học",
        "tags": ["Đại số", "Phương trình"]
    },
    {
        "title": "Phân biệt Present Perfect và Past Simple",
        "content": "Học sinh của tôi thường nhầm lẫn giữa Present Perfect và Past Simple. Các thầy cô có mẹo nào để giúp các em phân biệt hai thì này không?",
        "category": "Tiếng Anh",
        "tags": ["Ngữ pháp", "IELTS"]
    },
    {
        "title": "Định luật Newton thứ 2 trong thực tế",
        "content": "Làm sao để giải thích định luật F = ma cho học sinh một cách sinh động? Tôi muốn đưa ra ví dụ thực tế gần gũi với cuộc sống.",
        "category": "Vật lý",
        "tags": ["Cơ học"]
    },
    {
        "title": "Cân bằng phương trình hóa học phức tạp",
        "content": "Có phương pháp nào để cân bằng các phương trình hóa học phức tạp một cách nhanh chóng không? Đặc biệt là các phản ứng oxi hóa khử.",
        "category": "Hóa học",
        "tags": ["Phản ứng", "Cân bằng hóa học"]
    },
    {
        "title": "Học Python nên bắt đầu từ đâu?",
        "content": "Tôi muốn dạy học sinh học Python cơ bản. Các bạn khuyên nên bắt đầu từ kiến thức nào và sử dụng tài liệu gì?",
        "category": "Lập trình",
        "tags": ["Python", "Thuật toán"]
    },
    {
        "title": "Cách học Kanji hiệu quả cho JLPT N3",
        "content": "Các bạn có phương pháp nào để nhớ Kanji lâu và hiệu quả không? Tôi đang chuẩn bị thi JLPT N3 và cần học khoảng 650 chữ.",
        "category": "Tiếng Nhật",
        "tags": ["JLPT N3", "Kanji"]
    },
    {
        "title": "Quy trình quang hợp ở thực vật",
        "content": "Làm sao giải thích chu trình Calvin và pha sáng, pha tối cho học sinh dễ hiểu? Các em thường bị rối với sơ đồ phức tạp.",
        "category": "Sinh học",
        "tags": ["Thực vật", "Tế bào"]
    },
    {
        "title": "Các vùng khí hậu nhiệt đới",
        "content": "Cần tài liệu hoặc bản đồ minh họa về phân bố khí hậu nhiệt đới trên thế giới. Ai có thể chia sẻ được không?",
        "category": "Địa lý",
        "tags": ["Khí hậu", "Môi trường"]
    },
    {
        "title": "Tầm quan trọng của Cách mạng tháng Tám",
        "content": "Các thầy cô dạy lịch sử thường giảng bài này như thế nào để học sinh hiểu rõ ý nghĩa lịch sử?",
        "category": "Lịch sử",
        "tags": ["Lịch sử Việt Nam"]
    },
    {
        "title": "Áp dụng dạy học tích cực trong lớp học",
        "content": "Mình muốn biết các hoạt động dạy học tích cực phù hợp cho lớp 30-40 học sinh. Các bạn có kinh nghiệm gì không?",
        "category": "Phương pháp dạy học",
        "tags": ["Dạy học tích cực", "Quản lý lớp học"]
    },
    {
        "title": "Tích phân từng phần - Kỹ thuật và bài tập",
        "content": "Có những dạng bài tập nào hay về tích phân từng phần? Tôi cần để luyện tập cho học sinh lớp 12.",
        "category": "Toán học",
        "tags": ["Giải tích", "Tích phân"]
    },
    {
        "title": "Từ vựng TOEIC thường gặp nhất",
        "content": "Mọi người có list từ vựng TOEIC hay ho nào không? Đặc biệt là từ vựng trong phần Reading và Listening.",
        "category": "Tiếng Anh",
        "tags": ["TOEIC", "Từ vựng"]
    },
    {
        "title": "Thí nghiệm về mạch điện đơn giản",
        "content": "Các bạn có hướng dẫn làm thí nghiệm mạch điện cơ bản cho học sinh THCS không? Cần dụng cụ dễ tìm.",
        "category": "Vật lý",
        "tags": ["Điện học"]
    },
    {
        "title": "Phản ứng thế và phản ứng cộng trong hóa hữu cơ",
        "content": "Học sinh hay nhầm lẫn giữa hai loại phản ứng này. Có cách nào giúp các em phân biệt dễ dàng không?",
        "category": "Hóa học",
        "tags": ["Hóa hữu cơ", "Phản ứng"]
    },
    {
        "title": "Build API với FastAPI và MongoDB",
        "content": "Mình đang học FastAPI, có ai có kinh nghiệm tích hợp MongoDB không? Cần lời khuyên về cấu trúc project.",
        "category": "Lập trình",
        "tags": ["FastAPI", "MongoDB", "Python"]
    },
    {
        "title": "Ngữ pháp て-form trong tiếng Nhật",
        "content": "て-form dùng trong những trường hợp nào? Các em học sinh thường mắc lỗi gì khi sử dụng dạng động từ này?",
        "category": "Tiếng Nhật",
        "tags": ["Ngữ pháp", "JLPT N2"]
    },
    {
        "title": "Di truyền học Mendel cơ bản",
        "content": "Cách giảng bài về định luật phân li và định luật phân li độc lập sao cho dễ hiểu? Học sinh hay nhầm giữa F1 và F2.",
        "category": "Sinh học",
        "tags": ["Di truyền"]
    },
    {
        "title": "Phát triển kinh tế vùng Đồng bằng sông Cửu Long",
        "content": "Cần tài liệu phân tích về tiềm năng và thách thức phát triển kinh tế ở ĐBSCL. Ai có thể giúp không?",
        "category": "Địa lý",
        "tags": ["Kinh tế", "Dân cư"]
    },
    {
        "title": "Chiến tranh thế giới thứ 2 - Nguyên nhân và hậu quả",
        "content": "Làm sao để học sinh hiểu được những nguyên nhân sâu xa dẫn đến WW2 chứ không chỉ học thuộc lòng?",
        "category": "Lịch sử",
        "tags": ["Lịch sử Thế giới", "Chiến tranh"]
    },
    {
        "title": "Sử dụng công nghệ trong giảng dạy",
        "content": "Các ứng dụng, công cụ công nghệ nào hữu ích cho việc dạy học trực tuyến và blended learning?",
        "category": "Phương pháp dạy học",
        "tags": ["Công nghệ giáo dục", "Đánh giá"]
    }
]


async def seed_database():
    """
    Seed the database with initial data
    """
    try:
        # Connect to MongoDB
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        db = client[settings.MONGODB_DB_NAME]
        
        print(f"Connected to MongoDB: {settings.MONGODB_DB_NAME}")
        
        # Clear existing data
        print("\n🗑️  Clearing existing data...")
        await db.users.delete_many({})
        await db.categories.delete_many({})
        await db.tags.delete_many({})
        await db.posts.delete_many({})
        await db.answers.delete_many({})
        await db.notifications.delete_many({})
        print("✅ Cleared all collections")
        
        # 1. Seed Categories
        print("\n📁 Seeding categories...")
        category_ids = {}
        for cat in CATEGORIES:
            cat_doc = {
                "_id": ObjectId(),
                "name": cat["name"],
                "description": cat["description"],
                "post_count": cat["post_count"],
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            await db.categories.insert_one(cat_doc)
            category_ids[cat["name"]] = cat_doc["_id"]
            print(f"  ✓ Created category: {cat['name']}")
        
        # 2. Seed Users
        print("\n👥 Seeding users...")
        user_ids = []
        for user in USERS:
            user_doc = {
                "_id": ObjectId(),
                "name": user["name"],
                "email": user["email"],
                "hashed_password": get_password_hash(user["password"]),
                "avatar_url": user["avatar_url"],
                "bio": user["bio"],
                "role": user["role"],
                "status": user["status"],
                "bookmarked_post_ids": [],
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            await db.users.insert_one(user_doc)
            user_ids.append(user_doc["_id"])
            print(f"  ✓ Created user: {user['name']} ({user['email']})")
        
        # 3. Seed Tags
        print("\n🏷️  Seeding tags...")
        tag_ids = {}
        for category_name, tag_names in TAG_TEMPLATES.items():
            tag_ids[category_name] = []
            for tag_name in tag_names:
                tag_doc = {
                    "_id": ObjectId(),
                    "name": tag_name,
                    "description": f"Tag liên quan đến {category_name}",
                    "post_count": 0,
                    "created_by": random.choice(user_ids),
                    "created_at": datetime.now(timezone.utc)
                }
                try:
                    await db.tags.insert_one(tag_doc)
                except Exception as e:
                    if "E11000" in str(e):
                        print(f"  ⚠️  Tag '{tag_name}' already exists, skipping...")
                        continue
                    else:
                        raise e
                tag_ids[category_name].append((tag_doc["_id"], tag_name))
                print(f"  ✓ Created tag: {tag_name} (in {category_name})")
        
        # 4. Seed Posts
        print("\n📝 Seeding posts...")
        post_ids = []
        for i, post_template in enumerate(POST_TEMPLATES):
            # Random created time (last 30 days)
            days_ago = random.randint(0, 30)
            created_at = datetime.now(timezone.utc) - timedelta(days=days_ago)
            
            # Get tags for this category
            category_tags = tag_ids.get(post_template["category"], [])
            selected_tags = random.sample(category_tags, min(len(post_template["tags"]), len(category_tags)))
            selected_tag_ids = [tag_id for tag_id, tag_name in selected_tags]
            
            post_doc = {
                "_id": ObjectId(),
                "title": post_template["title"],
                "content": post_template["content"],
                "author_id": random.choice(user_ids),
                "category": post_template["category"],
                "tag_ids": selected_tag_ids,
                "answer_count": random.randint(0, 5),
                "view_count": random.randint(10, 500),
                "is_deleted": False,
                "created_at": created_at,
                "updated_at": created_at
            }
            await db.posts.insert_one(post_doc)
            post_ids.append(post_doc["_id"])
            
            # Update category post_count
            await db.categories.update_one(
                {"name": post_template["category"]},
                {"$inc": {"post_count": 1}}
            )
            
            # Update tag post_count
            await db.tags.update_many(
                {"_id": {"$in": selected_tag_ids}},
                {"$inc": {"post_count": 1}}
            )
            
            print(f"  ✓ Created post {i+1}/20: {post_template['title'][:50]}...")
        
        # 5. Seed Answers for some posts
        print("\n💬 Seeding answers...")
        answer_count = 0
        for post_id in random.sample(post_ids, 10):  # Add answers to 10 random posts
            num_answers = random.randint(1, 3)
            for _ in range(num_answers):
                answer_doc = {
                    "_id": ObjectId(),
                    "post_id": post_id,
                    "author_id": random.choice(user_ids),
                    "content": "Đây là câu trả lời mẫu. Tôi nghĩ bạn nên thử cách tiếp cận này...",
                    "is_accepted_solution": False,
                    "votes": {
                        "upvoted_by": [],
                        "downvoted_by": [],
                        "score": random.randint(0, 10)
                    },
                    "comments": [],
                    "is_deleted": False,
                    "created_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc)
                }
                await db.answers.insert_one(answer_doc)
                answer_count += 1
        print(f"  ✓ Created {answer_count} answers")
        
        # 6. Add some bookmarks
        print("\n🔖 Adding bookmarks...")
        bookmark_count = 0
        for user_id in user_ids:
            bookmarked_posts = random.sample(post_ids, random.randint(1, 5))
            await db.users.update_one(
                {"_id": user_id},
                {"$set": {"bookmarked_post_ids": bookmarked_posts}}
            )
            bookmark_count += len(bookmarked_posts)
        print(f"  ✓ Added {bookmark_count} bookmarks")
        
        # Summary
        print("\n" + "="*50)
        print("✅ SEED DATA COMPLETED SUCCESSFULLY!")
        print("="*50)
        print(f"📊 Summary:")
        print(f"  - Users: {len(USERS)}")
        print(f"  - Categories: {len(CATEGORIES)}")
        print(f"  - Tags: {sum(len(tags) for tags in TAG_TEMPLATES.values())}")
        print(f"  - Posts: {len(POST_TEMPLATES)}")
        print(f"  - Answers: {answer_count}")
        print(f"  - Bookmarks: {bookmark_count}")
        print("="*50)
        
        # Close connection
        client.close()
        
    except Exception as e:
        print(f"\n❌ Error seeding database: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(seed_database())

