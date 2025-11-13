"""
Script to seed database with fake data
"""
import asyncio
import random
from datetime import datetime, timedelta
from faker import Faker
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from bson import ObjectId
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Faker
fake = Faker(['en_US', 'vi_VN'])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# MongoDB connection
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "teach_better")

# Collections
COLLECTIONS = [
    "users",
    "tags",
    "posts",
    "answers",
    "aiDiagnoses",
    "reports",
    "notifications"
]


async def clear_database(db):
    """Clear all collections"""
    print("🗑️  Xóa dữ liệu cũ...")
    for collection in COLLECTIONS:
        await db[collection].delete_many({})
    print("✅ Đã xóa dữ liệu cũ")


async def create_indexes(db):
    """Create indexes for collections"""
    print("📑 Tạo indexes...")
    
    # Users indexes
    await db.users.create_index("email", unique=True)
    
    # Tags indexes
    await db.tags.create_index("name", unique=True)
    
    # Posts indexes
    await db.posts.create_index("title")
    await db.posts.create_index("author_id")
    await db.posts.create_index([("tag_ids", 1)])
    
    # Answers indexes
    await db.answers.create_index("post_id")
    await db.answers.create_index("author_id")
    
    # AI Diagnoses indexes
    await db.aiDiagnoses.create_index("user_id")
    
    # Reports indexes
    await db.reports.create_index("reporter_id")
    await db.reports.create_index("target_id")
    
    # Notifications indexes
    await db.notifications.create_index("user_id")
    await db.notifications.create_index("is_read")
    
    print("✅ Đã tạo indexes")


async def seed_users(db, count=50):
    """Seed users collection"""
    print(f"👥 Tạo {count} người dùng...")
    users = []
    
    # Create admin user
    admin = {
        "_id": ObjectId(),
        "name": "Admin User",
        "email": "admin@teachbetter.com",
        "password": pwd_context.hash("admin123"),
        "avatar_url": fake.image_url(width=200, height=200),
        "role": "admin",
        "status": "active",
        "bookmarked_post_ids": [],
        "created_at": datetime.utcnow() - timedelta(days=365),
        "updated_at": datetime.utcnow()
    }
    users.append(admin)
    
    # Create regular users
    for i in range(count - 1):
        user = {
            "_id": ObjectId(),
            "name": fake.name(),
            "email": fake.unique.email(),
            "password": pwd_context.hash("password123"),
            "avatar_url": fake.image_url(width=200, height=200) if random.random() > 0.3 else None,
            "role": "user",
            "status": "active" if random.random() > 0.1 else "locked",
            "bookmarked_post_ids": [],
            "created_at": fake.date_time_between(start_date="-2y", end_date="now"),
            "updated_at": datetime.utcnow()
        }
        users.append(user)
    
    await db.users.insert_many(users)
    print(f"✅ Đã tạo {len(users)} người dùng")
    return users


async def seed_tags(db, users, count=30):
    """Seed tags collection"""
    print(f"🏷️  Tạo {count} thẻ...")
    
    # Vietnamese teaching related tags
    tag_names = [
        "Ngữ pháp", "Phát âm", "Từ vựng", "Tiếng Nhật N5", "Tiếng Nhật N4",
        "Tiếng Nhật N3", "Tiếng Nhật N2", "Tiếng Nhật N1", "Kanji", "Hiragana",
        "Katakana", "Giao tiếp", "Nghe hiểu", "Đọc hiểu", "Viết", "Dịch thuật",
        "JLPT", "Văn hóa Nhật Bản", "Tiểu học", "THCS", "THPT", "Đại học",
        "Toán học", "Vật lý", "Hóa học", "Sinh học", "Lịch sử", "Địa lý",
        "Tiếng Anh", "Python", "JavaScript", "Web Development"
    ]
    
    tags = []
    for i, name in enumerate(tag_names[:count]):
        tag = {
            "_id": ObjectId(),
            "name": name,
            "description": fake.sentence(nb_words=10),
            "post_count": 0,  # Will be updated when creating posts
            "created_by": random.choice(users)["_id"],
            "created_at": fake.date_time_between(start_date="-1y", end_date="now")
        }
        tags.append(tag)
    
    await db.tags.insert_many(tags)
    print(f"✅ Đã tạo {len(tags)} thẻ")
    return tags


async def seed_posts(db, users, tags, count=100):
    """Seed posts collection"""
    print(f"📝 Tạo {count} bài viết...")
    
    posts = []
    active_users = [u for u in users if u["status"] == "active"]
    
    for i in range(count):
        author = random.choice(active_users)
        selected_tags = random.sample(tags, k=random.randint(1, 5))
        
        # Generate realistic question titles
        question_templates = [
            f"Làm thế nào để {fake.sentence(nb_words=5)}?",
            f"Tôi không hiểu về {fake.word()}",
            f"Câu hỏi về {fake.word()} trong {random.choice(selected_tags)['name']}",
            f"Giải thích về {fake.word()}",
            f"Sự khác biệt giữa {fake.word()} và {fake.word()}",
            f"Cách sử dụng {fake.word()} trong {random.choice(selected_tags)['name']}",
            f"Tại sao {fake.sentence(nb_words=6)}?",
            f"Ai có thể giúp tôi với {fake.word()}?"
        ]
        
        post = {
            "_id": ObjectId(),
            "title": random.choice(question_templates),
            "content": "\n\n".join(fake.paragraphs(nb=random.randint(2, 5))),
            "author_id": author["_id"],
            "tag_ids": [tag["_id"] for tag in selected_tags],
            "status": "open" if random.random() > 0.3 else "resolved",
            "votes": {
                "upvoted_by": [],
                "downvoted_by": [],
                "score": 0
            },
            "answer_count": 0,  # Will be updated when creating answers
            "view_count": random.randint(0, 1000),
            "is_deleted": False,
            "created_at": fake.date_time_between(start_date="-6m", end_date="now"),
            "updated_at": datetime.utcnow()
        }
        
        # Add random votes
        voters = random.sample(active_users, k=random.randint(0, min(10, len(active_users))))
        for voter in voters:
            if random.random() > 0.3:
                post["votes"]["upvoted_by"].append(voter["_id"])
                post["votes"]["score"] += 1
            else:
                post["votes"]["downvoted_by"].append(voter["_id"])
                post["votes"]["score"] -= 1
        
        posts.append(post)
    
    await db.posts.insert_many(posts)
    
    # Update tag post counts
    for tag in tags:
        tag_post_count = sum(1 for p in posts if tag["_id"] in p["tag_ids"])
        await db.tags.update_one(
            {"_id": tag["_id"]},
            {"$set": {"post_count": tag_post_count}}
        )
    
    print(f"✅ Đã tạo {len(posts)} bài viết")
    return posts


async def seed_answers(db, users, posts, count_per_post_range=(0, 8)):
    """Seed answers collection"""
    print(f"💬 Tạo câu trả lời...")
    
    answers = []
    active_users = [u for u in users if u["status"] == "active"]
    
    for post in posts:
        num_answers = random.randint(*count_per_post_range)
        post_answers = []
        
        for i in range(num_answers):
            author = random.choice(active_users)
            
            answer = {
                "_id": ObjectId(),
                "post_id": post["_id"],
                "author_id": author["_id"],
                "content": "\n\n".join(fake.paragraphs(nb=random.randint(1, 3))),
                "is_accepted_solution": False,
                "votes": {
                    "upvoted_by": [],
                    "downvoted_by": [],
                    "score": 0
                },
                "comments": [],
                "is_deleted": False,
                "created_at": fake.date_time_between(
                    start_date=post["created_at"],
                    end_date="now"
                ),
                "updated_at": datetime.utcnow()
            }
            
            # Add random votes
            voters = random.sample(active_users, k=random.randint(0, min(8, len(active_users))))
            for voter in voters:
                if random.random() > 0.2:
                    answer["votes"]["upvoted_by"].append(voter["_id"])
                    answer["votes"]["score"] += 1
                else:
                    answer["votes"]["downvoted_by"].append(voter["_id"])
                    answer["votes"]["score"] -= 1
            
            # Add random comments
            num_comments = random.randint(0, 5)
            for j in range(num_comments):
                commenter = random.choice(active_users)
                comment = {
                    "_id": ObjectId(),
                    "author_id": commenter["_id"],
                    "content": fake.sentence(nb_words=random.randint(5, 15)),
                    "created_at": fake.date_time_between(
                        start_date=answer["created_at"],
                        end_date="now"
                    )
                }
                answer["comments"].append(comment)
            
            post_answers.append(answer)
            answers.append(answer)
        
        # Mark one answer as accepted solution if post is resolved
        if post_answers and post["status"] == "resolved":
            best_answer = max(post_answers, key=lambda a: a["votes"]["score"])
            best_answer["is_accepted_solution"] = True
        
        # Update post answer count
        await db.posts.update_one(
            {"_id": post["_id"]},
            {"$set": {"answer_count": len(post_answers)}}
        )
    
    if answers:
        await db.answers.insert_many(answers)
    
    print(f"✅ Đã tạo {len(answers)} câu trả lời")
    return answers


async def seed_ai_diagnoses(db, users, count=30):
    """Seed AI diagnoses collection"""
    print(f"🤖 Tạo {count} chẩn đoán AI...")
    
    diagnoses = []
    active_users = [u for u in users if u["status"] == "active"]
    
    misunderstanding_examples = [
        "Nhầm lẫn giữa は và が",
        "Phát âm sai âm 'r' và 'l'",
        "Sử dụng thì không đúng ngữ cảnh",
        "Nhầm lẫn thứ tự từ trong câu",
        "Không hiểu cách dùng trợ từ",
        "Phát âm thanh điệu sai",
        "Nhầm lẫn Kanji có hình dạng giống nhau"
    ]
    
    levels = ["N5", "N4", "N3", "N2", "N1", "Tiểu học", "THCS", "THPT", "Đại học"]
    nationalities = ["Việt Nam", "Nhật Bản", "Hàn Quốc", "Trung Quốc", "Thái Lan"]
    
    for i in range(count):
        user = random.choice(active_users)
        
        diagnosis = {
            "_id": ObjectId(),
            "user_id": user["_id"],
            "title": f"Chẩn đoán lần {i+1} - {fake.sentence(nb_words=3)}",
            "input": {
                "type": random.choice(["text", "audio"]),
                "content": fake.paragraph() if random.random() > 0.5 else f"https://example.com/audio/{fake.uuid4()}.mp3"
            },
            "learner_profile": {
                "nationality": random.choice(nationalities),
                "level": random.choice(levels)
            },
            "ai_result": {
                "misunderstanding_points": random.sample(
                    misunderstanding_examples,
                    k=random.randint(1, 4)
                ),
                "simulation": fake.paragraph(nb_sentences=3),
                "suggestions": "\n".join([f"- {fake.sentence()}" for _ in range(3)]),
                "comparison_to_previous": fake.sentence() if random.random() > 0.5 else None
            },
            "generated_questions": [],
            "status": random.choice(["pending", "completed", "failed"]),
            "created_at": fake.date_time_between(start_date="-3m", end_date="now")
        }
        
        # Add generated questions for completed diagnoses
        if diagnosis["status"] == "completed":
            num_questions = random.randint(3, 7)
            for j in range(num_questions):
                question = {
                    "_id": ObjectId(),
                    "question_text": fake.sentence(nb_words=10) + "?",
                    "type": random.choice(["multiple_choice", "short_answer"]),
                    "options": [],
                    "correct_answer": ""
                }
                
                if question["type"] == "multiple_choice":
                    question["options"] = [fake.word() for _ in range(4)]
                    question["correct_answer"] = random.choice(question["options"])
                else:
                    question["correct_answer"] = fake.sentence(nb_words=5)
                
                diagnosis["generated_questions"].append(question)
        
        diagnoses.append(diagnosis)
    
    await db.aiDiagnoses.insert_many(diagnoses)
    print(f"✅ Đã tạo {len(diagnoses)} chẩn đoán AI")
    return diagnoses


async def seed_reports(db, users, posts, answers, count=20):
    """Seed reports collection"""
    print(f"🚨 Tạo {count} báo cáo vi phạm...")
    
    reports = []
    active_users = [u for u in users if u["status"] == "active"]
    
    reason_categories = ["spam", "inappropriate", "harassment", "offensive", "misleading", "other"]
    report_types_data = {
        "user": users,
        "post": posts,
        "answer": answers
    }
    
    for i in range(count):
        reporter = random.choice(active_users)
        report_type = random.choice(list(report_types_data.keys()))
        target = random.choice(report_types_data[report_type])
        
        report = {
            "_id": ObjectId(),
            "reporter_id": reporter["_id"],
            "report_type": report_type,
            "target_id": target["_id"],
            "reason_category": random.choice(reason_categories),
            "reason_detail": fake.paragraph(nb_sentences=3),
            "evidence_url": f"https://example.com/evidence/{fake.uuid4()}.png" if random.random() > 0.5 else None,
            "status": random.choice(["pending", "resolved", "dismissed"]),
            "resolution": None,
            "created_at": fake.date_time_between(start_date="-2m", end_date="now")
        }
        
        # Add resolution for resolved/dismissed reports
        if report["status"] in ["resolved", "dismissed"]:
            admin = next(u for u in users if u["role"] == "admin")
            report["resolution"] = {
                "admin_id": admin["_id"],
                "action_taken": random.choice(["warned", "locked_user", "deleted_content", "no_action"]),
                "notes": fake.sentence(),
                "resolved_at": fake.date_time_between(
                    start_date=report["created_at"],
                    end_date="now"
                )
            }
        
        reports.append(report)
    
    await db.reports.insert_many(reports)
    print(f"✅ Đã tạo {len(reports)} báo cáo")
    return reports


async def seed_notifications(db, users, posts, answers, count=100):
    """Seed notifications collection"""
    print(f"🔔 Tạo {count} thông báo...")
    
    notifications = []
    
    notification_types = [
        "new_answer",
        "new_comment",
        "report_update",
        "post_upvote",
        "answer_accepted",
        "system_notice"
    ]
    
    for i in range(count):
        user = random.choice(users)
        notif_type = random.choice(notification_types)
        
        # Generate appropriate message based on type
        messages = {
            "new_answer": f"{fake.name()} đã trả lời câu hỏi của bạn",
            "new_comment": f"{fake.name()} đã bình luận về câu trả lời của bạn",
            "report_update": "Báo cáo của bạn đã được xử lý",
            "post_upvote": f"Câu hỏi của bạn nhận được {random.randint(1, 10)} upvote",
            "answer_accepted": "Câu trả lời của bạn đã được chấp nhận",
            "system_notice": fake.sentence()
        }
        
        notification = {
            "_id": ObjectId(),
            "user_id": user["_id"],
            "type": notif_type,
            "message": messages[notif_type],
            "link": f"/posts/{random.choice(posts)['_id']}" if posts else None,
            "is_read": random.random() > 0.4,
            "created_at": fake.date_time_between(start_date="-1m", end_date="now")
        }
        
        notifications.append(notification)
    
    await db.notifications.insert_many(notifications)
    print(f"✅ Đã tạo {len(notifications)} thông báo")
    return notifications


async def update_bookmarks(db, users, posts):
    """Update user bookmarks"""
    print("🔖 Cập nhật bookmarks...")
    
    active_users = [u for u in users if u["status"] == "active"]
    
    for user in active_users:
        if random.random() > 0.5:
            num_bookmarks = random.randint(1, min(10, len(posts)))
            bookmarked_posts = random.sample(posts, k=num_bookmarks)
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"bookmarked_post_ids": [p["_id"] for p in bookmarked_posts]}}
            )
    
    print("✅ Đã cập nhật bookmarks")


async def main():
    """Main function to seed all data"""
    print("=" * 60)
    print("🌱 BẮT ĐẦU SEED DỮ LIỆU")
    print("=" * 60)
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[MONGODB_DB_NAME]
    
    try:
        # Test connection
        await client.admin.command('ping')
        print(f"✅ Kết nối thành công tới MongoDB: {MONGODB_DB_NAME}\n")
        
        # Clear old data
        await clear_database(db)
        print()
        
        # Seed data
        users = await seed_users(db, count=50)
        print()
        
        tags = await seed_tags(db, users, count=30)
        print()
        
        posts = await seed_posts(db, users, tags, count=100)
        print()
        
        answers = await seed_answers(db, users, posts, count_per_post_range=(0, 8))
        print()
        
        diagnoses = await seed_ai_diagnoses(db, users, count=30)
        print()
        
        reports = await seed_reports(db, users, posts, answers, count=20)
        print()
        
        notifications = await seed_notifications(db, users, posts, answers, count=100)
        print()
        
        await update_bookmarks(db, users, posts)
        print()
        
        # Create indexes
        await create_indexes(db)
        print()
        
        # Summary
        print("=" * 60)
        print("✅ HOÀN THÀNH SEED DỮ LIỆU")
        print("=" * 60)
        print(f"👥 Users: {len(users)}")
        print(f"🏷️  Tags: {len(tags)}")
        print(f"📝 Posts: {len(posts)}")
        print(f"💬 Answers: {len(answers)}")
        print(f"🤖 AI Diagnoses: {len(diagnoses)}")
        print(f"🚨 Reports: {len(reports)}")
        print(f"🔔 Notifications: {len(notifications)}")
        print("=" * 60)
        print("\n🎉 Tất cả dữ liệu đã được tạo thành công!")
        print(f"\nThông tin đăng nhập Admin:")
        print(f"  Email: admin@teachbetter.com")
        print(f"  Password: admin123")
        print(f"\nThông tin đăng nhập User thông thường:")
        print(f"  Email: {users[1]['email']}")
        print(f"  Password: password123")
        
    except Exception as e:
        print(f"❌ Lỗi: {e}")
        raise
    finally:
        client.close()
        print("\n👋 Đã đóng kết nối MongoDB")


if __name__ == "__main__":
    asyncio.run(main())

