"""
Seed data script để tạo dữ liệu mẫu cho database
Bao gồm: 5 users, 20 posts, 10 categories cố định, và các tags
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.append(str(Path(__file__).parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
from bson import ObjectId
import random

from app.core.config import settings
from app.core.security import get_password_hash


# Dữ liệu mẫu cố định
CATEGORIES = [
    {"name": "Toán học", "description": "Các chủ đề về toán học, đại số, hình học, giải tích"},
    {"name": "Tiếng Anh", "description": "Học tiếng Anh, ngữ pháp, từ vựng, giao tiếp"},
    {"name": "Tiếng Nhật", "description": "Học tiếng Nhật, JLPT, Kanji, Hiragana, Katakana"},
    {"name": "Vật lý", "description": "Vật lý phổ thông, cơ học, điện từ, quang học"},
    {"name": "Hóa học", "description": "Hóa học đại cương, hóa hữu cơ, hóa vô cơ"},
    {"name": "Lập trình", "description": "Lập trình máy tính, Python, JavaScript, Java"},
    {"name": "Sinh học", "description": "Sinh học đại cương, di truyền học, sinh thái học"},
    {"name": "Lịch sử", "description": "Lịch sử Việt Nam, lịch sử thế giới"},
    {"name": "Địa lý", "description": "Địa lý Việt Nam, địa lý thế giới"},
    {"name": "Văn học", "description": "Văn học Việt Nam, văn học thế giới, phân tích tác phẩm"}
]

USERS = [
    {
        "name": "Nguyễn Văn An",
        "email": "nguyenvanan@example.com",
        "password": "password123",
        "avatar_url": "https://i.pravatar.cc/150?img=1",
        "bio": "Giáo viên Toán học với 10 năm kinh nghiệm",
        "role": "admin"
    },
    {
        "name": "Trần Thị Bình",
        "email": "tranthibinh@example.com",
        "password": "password123",
        "avatar_url": "https://i.pravatar.cc/150?img=2",
        "bio": "Giáo viên Tiếng Anh, chuyên IELTS",
        "role": "user"
    },
    {
        "name": "Lê Hoàng Cường",
        "email": "lehoangcuong@example.com",
        "password": "password123",
        "avatar_url": "https://i.pravatar.cc/150?img=3",
        "bio": "Lập trình viên và giảng viên Python",
        "role": "user"
    },
    {
        "name": "Phạm Thị Dung",
        "email": "phamthidung@example.com",
        "password": "password123",
        "avatar_url": "https://i.pravatar.cc/150?img=4",
        "bio": "Giáo viên Vật lý, yêu thích thí nghiệm",
        "role": "user"
    },
    {
        "name": "Hoàng Văn Em",
        "email": "hoangvanem@example.com",
        "password": "password123",
        "avatar_url": "https://i.pravatar.cc/150?img=5",
        "bio": "Học sinh đam mê học tập và chia sẻ kiến thức",
        "role": "user"
    }
]

TAGS_BY_CATEGORY = {
    "Toán học": ["Đại số", "Hình học", "Giải tích", "Tích phân", "Đạo hàm", "Phương trình", "Bất đẳng thức"],
    "Tiếng Anh": ["Ngữ pháp", "Từ vựng", "IELTS", "TOEIC", "Phát âm", "Giao tiếp", "Viết luận"],
    "Tiếng Nhật": ["JLPT N5", "JLPT N3", "JLPT N1", "Kanji", "Ngữ pháp", "Hội thoại", "Từ vựng"],
    "Vật lý": ["Cơ học", "Điện từ học", "Quang học", "Nhiệt học", "Dao động", "Sóng"],
    "Hóa học": ["Hóa hữu cơ", "Hóa vô cơ", "Hóa phân tích", "Cân bằng", "Phản ứng"],
    "Lập trình": ["Python", "JavaScript", "Java", "React", "FastAPI", "Algorithm", "Data Structure"],
    "Sinh học": ["Tế bào", "Di truyền", "Sinh thái", "Tiến hóa", "Động vật", "Thực vật"],
    "Lịch sử": ["Lịch sử Việt Nam", "Lịch sử thế giới", "Cận đại", "Hiện đại", "Chiến tranh"],
    "Địa lý": ["Địa lý tự nhiên", "Địa lý kinh tế", "Bản đồ", "Khí hậu", "Địa chất"],
    "Văn học": ["Thơ", "Truyện", "Tiểu thuyết", "Phân tích", "Tác giả", "Tác phẩm"]
}

POSTS_TEMPLATES = [
    {
        "title": "Cách giải phương trình bậc 2 nhanh nhất?",
        "content": "Mình đang học phương trình bậc 2 và muốn tìm hiểu các phương pháp giải nhanh. Các bạn có thể chia sẻ kinh nghiệm không?",
        "category": "Toán học"
    },
    {
        "title": "Phương pháp học từ vựng tiếng Anh hiệu quả",
        "content": "Mình muốn hỏi về các phương pháp học từ vựng tiếng Anh hiệu quả. Hiện tại mình đang học khoảng 20 từ mỗi ngày nhưng hay quên. Mọi người có tips gì không?",
        "category": "Tiếng Anh"
    },
    {
        "title": "Lộ trình học lập trình Python cho người mới",
        "content": "Em mới bắt đầu học Python, mọi người có thể gợi ý lộ trình học và các tài liệu hay không ạ? Em muốn theo hướng web development.",
        "category": "Lập trình"
    },
    {
        "title": "Giải thích định luật Newton thứ 3",
        "content": "Em không hiểu rõ về định luật Newton thứ 3. Tại sao lực và phản lực không triệt tiêu nhau? Mong mọi người giải thích chi tiết.",
        "category": "Vật lý"
    },
    {
        "title": "Tài liệu ôn thi JLPT N3",
        "content": "Mình sắp thi JLPT N3, mọi người có thể recommend sách và tài liệu ôn tập tốt không? Đặc biệt là phần đọc hiểu.",
        "category": "Tiếng Nhật"
    },
    {
        "title": "Cách nhớ bảng tuần hoàn hóa học",
        "content": "Các bạn có mẹo gì để nhớ bảng tuần hoàn các nguyên tố hóa học không? Đặc biệt là các nguyên tố từ 20-30.",
        "category": "Hóa học"
    },
    {
        "title": "Phân biệt thì hiện tại đơn và hiện tại tiếp diễn",
        "content": "Em hay nhầm lẫn giữa thì hiện tại đơn và hiện tại tiếp diễn. Mọi người có thể cho em vài ví dụ dễ hiểu không ạ?",
        "category": "Tiếng Anh"
    },
    {
        "title": "Tích phân từng phần - Bài tập nâng cao",
        "content": "Mình đang tự học tích phân từng phần, có ai có bài tập nâng cao và lời giải chi tiết không? Mình muốn luyện thêm.",
        "category": "Toán học"
    },
    {
        "title": "Framework React hay Vue cho người mới?",
        "content": "Em mới học xong JavaScript thuần, giờ muốn học framework. Các anh chị nghĩ em nên học React hay Vue? Cái nào dễ hơn?",
        "category": "Lập trình"
    },
    {
        "title": "Cấu trúc di truyền của DNA",
        "content": "Em cần tìm hiểu về cấu trúc di truyền của DNA. Ai có tài liệu hoặc video giải thích chi tiết không ạ?",
        "category": "Sinh học"
    },
    {
        "title": "Phân tích tác phẩm Chí Phèo của Nam Cao",
        "content": "Mọi người có thể chia sẻ cách phân tích tác phẩm Chí Phèo không? Em cần chuẩn bị cho bài kiểm tra văn.",
        "category": "Văn học"
    },
    {
        "title": "Nguyên nhân chiến tranh thế giới thứ 2",
        "content": "Em đang làm bài tiểu luận về các nguyên nhân dẫn đến chiến tranh thế giới thứ 2. Mọi người có thể gợi ý các nguồn tài liệu uy tín không?",
        "category": "Lịch sử"
    },
    {
        "title": "Biến đổi khí hậu toàn cầu",
        "content": "Các bạn có hiểu biết về biến đổi khí hậu toàn cầu không? Mình cần thông tin để làm đồ án môn Địa lý.",
        "category": "Địa lý"
    },
    {
        "title": "Học Kanji hiệu quả như thế nào?",
        "content": "Mình đang học tiếng Nhật nhưng gặp khó khăn với Kanji. Có ai có phương pháp học Kanji hiệu quả không? Mình hay quên lắm.",
        "category": "Tiếng Nhật"
    },
    {
        "title": "Phản ứng oxi hóa khử trong hóa học",
        "content": "Em không hiểu rõ về phản ứng oxi hóa khử. Làm sao để xác định số oxi hóa và cân bằng phương trình? Mong được giải đáp.",
        "category": "Hóa học"
    },
    {
        "title": "Thuật toán sắp xếp nào nhanh nhất?",
        "content": "Trong các thuật toán sắp xếp như Bubble Sort, Quick Sort, Merge Sort, cái nào là nhanh nhất? Và khi nào nên dùng cái nào?",
        "category": "Lập trình"
    },
    {
        "title": "Dao động điều hòa - Bài tập khó",
        "content": "Mọi người giúp em giải bài dao động điều hòa này với. Em đã thử nhiều cách nhưng không ra đáp án đúng.",
        "category": "Vật lý"
    },
    {
        "title": "Luyện nói tiếng Anh như thế nào?",
        "content": "Em muốn cải thiện kỹ năng nói tiếng Anh nhưng không có bạn để practice. Mọi người có gợi ý app hoặc cách học không?",
        "category": "Tiếng Anh"
    },
    {
        "title": "Giới hạn hàm số - Phương pháp giải",
        "content": "Em đang học giới hạn hàm số và gặp khó khăn. Có bạn nào có thể chia sẻ các dạng bài tập và phương pháp giải không?",
        "category": "Toán học"
    },
    {
        "title": "Hệ sinh thái rừng nhiệt đới",
        "content": "Mình cần tìm hiểu về đặc điểm của hệ sinh thái rừng nhiệt đới. Ai có tài liệu hay video giới thiệu không?",
        "category": "Sinh học"
    }
]


async def seed_database():
    """
    Main function để seed dữ liệu vào database
    """
    print("🌱 Bắt đầu seed dữ liệu...")
    
    # Kết nối MongoDB
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    
    try:
        # Test connection
        await client.admin.command('ping')
        print("✅ Đã kết nối MongoDB thành công")
        
        # Clear existing data (optional - uncomment if you want to start fresh)
        print("\n🗑️  Xóa dữ liệu cũ...")
        await db.users.delete_many({})
        await db.categories.delete_many({})
        await db.tags.delete_many({})
        await db.posts.delete_many({})
        print("✅ Đã xóa dữ liệu cũ")
        
        # 1. Tạo Categories
        print("\n📁 Tạo 10 categories...")
        category_ids = {}
        for cat in CATEGORIES:
            result = await db.categories.insert_one({
                "name": cat["name"],
                "description": cat["description"],
                "post_count": 0,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            })
            category_ids[cat["name"]] = result.inserted_id
            print(f"  ✓ Tạo category: {cat['name']}")
        
        # 2. Tạo Users
        print("\n👥 Tạo 5 users...")
        user_ids = []
        for user in USERS:
            hashed_password = get_password_hash(user["password"])
            result = await db.users.insert_one({
                "name": user["name"],
                "email": user["email"],
                "hashed_password": hashed_password,
                "avatar_url": user["avatar_url"],
                "bio": user["bio"],
                "role": user["role"],
                "status": "active",
                "bookmarked_post_ids": [],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            })
            user_ids.append(result.inserted_id)
            print(f"  ✓ Tạo user: {user['name']} ({user['email']})")
        
        # 3. Tạo Tags cho mỗi category
        print("\n🏷️  Tạo tags cho các categories...")
        tags_by_category = {}
        for cat_name, tag_names in TAGS_BY_CATEGORY.items():
            tags_by_category[cat_name] = []
            for tag_name in tag_names:
                result = await db.tags.insert_one({
                    "name": tag_name,
                    "description": f"Tag về {tag_name} trong {cat_name}",
                    "post_count": 0,
                    "created_by": user_ids[0],  # Admin tạo các tags
                    "created_at": datetime.utcnow()
                })
                tags_by_category[cat_name].append(result.inserted_id)
            print(f"  ✓ Tạo {len(tag_names)} tags cho {cat_name}")
        
        # 4. Tạo Posts
        print("\n📝 Tạo 20 posts...")
        for i, post_template in enumerate(POSTS_TEMPLATES):
            # Random author
            author_id = random.choice(user_ids)
            
            # Get category
            category_name = post_template["category"]
            
            # Random 2-4 tags from the category
            available_tags = tags_by_category.get(category_name, [])
            num_tags = random.randint(2, min(4, len(available_tags)))
            selected_tags = random.sample(available_tags, num_tags) if available_tags else []
            
            # Random votes
            num_upvotes = random.randint(0, 15)
            num_downvotes = random.randint(0, 5)
            upvoted_by = random.sample(user_ids, min(num_upvotes, len(user_ids)))
            downvoted_by = random.sample([uid for uid in user_ids if uid not in upvoted_by], 
                                        min(num_downvotes, len(user_ids) - len(upvoted_by)))
            
            # Random views and answer count
            view_count = random.randint(10, 200)
            answer_count = random.randint(0, 10)
            
            # Random created time (trong 30 ngày qua)
            days_ago = random.randint(0, 30)
            created_at = datetime.utcnow() - timedelta(days=days_ago)
            
            post_data = {
                "title": post_template["title"],
                "content": post_template["content"],
                "author_id": author_id,
                "category": category_name,
                "tag_ids": selected_tags,
                "votes": {
                    "upvoted_by": upvoted_by,
                    "downvoted_by": downvoted_by,
                    "score": len(upvoted_by) - len(downvoted_by)
                },
                "answer_count": answer_count,
                "view_count": view_count,
                "is_deleted": False,
                "created_at": created_at,
                "updated_at": created_at
            }
            
            await db.posts.insert_one(post_data)
            print(f"  ✓ Tạo post #{i+1}: {post_template['title'][:50]}...")
        
        # 5. Update post_count cho categories và tags
        print("\n🔄 Cập nhật post_count...")
        for cat_name in CATEGORIES:
            count = await db.posts.count_documents({"category": cat_name["name"]})
            await db.categories.update_one(
                {"name": cat_name["name"]},
                {"$set": {"post_count": count}}
            )
        
        for cat_name, tag_ids in tags_by_category.items():
            for tag_id in tag_ids:
                count = await db.posts.count_documents({"tag_ids": tag_id})
                await db.tags.update_one(
                    {"_id": tag_id},
                    {"$set": {"post_count": count}}
                )
        print("✅ Đã cập nhật post_count")
        
        # Print summary
        print("\n" + "="*60)
        print("🎉 HOÀN THÀNH SEED DỮ LIỆU!")
        print("="*60)
        print(f"✅ Users: {len(USERS)}")
        print(f"✅ Categories: {len(CATEGORIES)}")
        print(f"✅ Tags: {sum(len(tags) for tags in TAGS_BY_CATEGORY.values())}")
        print(f"✅ Posts: {len(POSTS_TEMPLATES)}")
        print("\n📊 Thông tin đăng nhập:")
        for user in USERS:
            print(f"  👤 {user['email']} / password123 ({user['role']})")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ Lỗi: {e}")
        raise
    finally:
        client.close()
        print("\n✅ Đã đóng kết nối MongoDB")


if __name__ == "__main__":
    asyncio.run(seed_database())
