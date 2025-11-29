from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.schemas.answer import Answer, AnswerCreate, AnswerUpdate, CommentCreate
from app.services.answer_service import AnswerService
from app.services.post_service import PostService
from app.services.notification_service import NotificationService
from app.services.user_service import UserService
from app.api.v1.endpoints.users import get_current_user
from app.schemas.user import User
from app.i18n.dependencies import get_translator, Translator
from app.models.notification import NotificationType

router = APIRouter()


def get_answer_service(db: AsyncIOMotorDatabase = Depends(get_database)) -> AnswerService:
    """
    Dependency to get answer service
    """
    return AnswerService(db)


def get_post_service(db: AsyncIOMotorDatabase = Depends(get_database)) -> PostService:
    """
    Dependency to get post service
    """
    return PostService(db)


def get_notification_service(db: AsyncIOMotorDatabase = Depends(get_database)) -> NotificationService:
    """
    Dependency to get notification service
    """
    return NotificationService(db)


def get_user_service(db: AsyncIOMotorDatabase = Depends(get_database)) -> UserService:
    """
    Dependency to get user service
    """
    return UserService(db)


async def send_answer_notification(
    post_id: str,
    answer_author_id: str,
    notification_service: NotificationService,
    post_service: PostService,
    user_service: UserService
):
    """
    Send notification to post author and bookmarked users when someone answers
    """
    post = await post_service.get_post_by_id(post_id)
    if not post:
        return
    
    # Notify post author
    if str(post.author_id) != answer_author_id:
        print(f"[DEBUG] Creating notification for post author {post.author_id}, answerer: {answer_author_id}")
        await notification_service.create_notification(
            user_id=str(post.author_id),
            notification_type=NotificationType.NEW_ANSWER,
            message="Có câu trả lời mới cho bài viết của bạn",
            link=f"/forum/{post_id}"
        )
        print(f"[DEBUG] Notification created successfully")
    
    # Get all users who bookmarked this post
    from bson import ObjectId
    
    # Find users who have bookmarked this post
    users_cursor = user_service.collection.find({
        "bookmarked_post_ids": ObjectId(post_id)
    })
    bookmarked_users = await users_cursor.to_list(length=None)
    
    # Notify bookmarked users (except the answer author and post author)
    for user in bookmarked_users:
        user_id = str(user["_id"])
        if user_id not in [answer_author_id, str(post.author_id)]:
            print(f"[DEBUG] Creating notification for bookmarked user {user_id}")
            await notification_service.create_notification(
                user_id=user_id,
                notification_type=NotificationType.NEW_ANSWER,
                message="Có câu trả lời mới trong bài viết bạn đã lưu",
                link=f"/forum/{post_id}"
            )


async def send_comment_notification(
    answer_id: str,
    comment_author_id: str,
    notification_service: NotificationService,
    answer_service: AnswerService,
    post_service: PostService,
    user_service: UserService
):
    """
    Send notification to answer author and bookmarked users when someone comments
    """
    answer = await answer_service.get_answer_by_id(answer_id)
    if not answer:
        return
    
    post_id = str(answer.post_id)
    
    # Notify answer author
    if str(answer.author_id) != comment_author_id:
        print(f"[DEBUG] Creating notification for answer author {answer.author_id}, commenter: {comment_author_id}")
        await notification_service.create_notification(
            user_id=str(answer.author_id),
            notification_type=NotificationType.NEW_COMMENT,
            message="Có bình luận mới cho câu trả lời của bạn",
            link=f"/forum/{post_id}"
        )
        print(f"[DEBUG] Notification created successfully")
    
    # Get post details
    post = await post_service.get_post_by_id(post_id)
    if not post:
        return
    
    # Notify post author if different from comment author and answer author
    if str(post.author_id) != comment_author_id and str(post.author_id) != str(answer.author_id):
        print(f"[DEBUG] Creating notification for post author {post.author_id}")
        await notification_service.create_notification(
            user_id=str(post.author_id),
            notification_type=NotificationType.NEW_COMMENT,
            message="Có bình luận mới trong bài viết của bạn",
            link=f"/forum/{post_id}"
        )
    
    # Get all users who bookmarked this post
    from bson import ObjectId
    from app.services.user_service import UserService
    from motor.motor_asyncio import AsyncIOMotorDatabase
    
    # Find users who have bookmarked this post
    users_cursor = user_service.collection.find({
        "bookmarked_post_ids": ObjectId(post_id)
    })
    bookmarked_users = await users_cursor.to_list(length=None)
    
    # Notify bookmarked users (except the comment author, post author, and answer author)
    for user in bookmarked_users:
        user_id = str(user["_id"])
        if user_id not in [comment_author_id, str(post.author_id), str(answer.author_id)]:
            print(f"[DEBUG] Creating notification for bookmarked user {user_id}")
            await notification_service.create_notification(
                user_id=user_id,
                notification_type=NotificationType.NEW_COMMENT,
                message="Có bình luận mới trong bài viết bạn đã lưu",
                link=f"/forum/{post_id}"
            )


@router.post("/", response_model=Answer, status_code=status.HTTP_201_CREATED)
async def create_answer(
    answer_data: AnswerCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    answer_service: AnswerService = Depends(get_answer_service),
    post_service: PostService = Depends(get_post_service),
    notification_service: NotificationService = Depends(get_notification_service),
    user_service: UserService = Depends(get_user_service),
    t: Translator = Depends(get_translator)
):
    """
    Create a new answer for a post
    """
    answer = await answer_service.create_answer(answer_data, current_user.id)

    # Increment answer count on post
    await post_service.increment_answer_count(answer_data.post_id)

    # Send notification to post author and bookmarked users
    background_tasks.add_task(
        send_answer_notification,
        answer_data.post_id,
        current_user.id,
        notification_service,
        post_service,
        user_service
    )

    # Convert to response model
    answer_dict = answer.model_dump(by_alias=True)
    answer_dict["_id"] = str(answer_dict["_id"])
    answer_dict["post_id"] = str(answer_dict["post_id"])
    answer_dict["author_id"] = str(answer_dict["author_id"])
    answer_dict["votes"]["upvoted_by"] = [str(uid) for uid in answer_dict["votes"].get("upvoted_by", [])]
    answer_dict["votes"]["downvoted_by"] = [str(uid) for uid in answer_dict["votes"].get("downvoted_by", [])]

    # Convert comment IDs
    for comment in answer_dict.get("comments", []):
        comment["id"] = str(comment["id"])
        comment["author_id"] = str(comment["author_id"])

    return Answer(**answer_dict)


@router.get("/post/{post_id}", response_model=List[Answer])
async def get_answers_by_post(
    post_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    answer_service: AnswerService = Depends(get_answer_service),
    db: AsyncIOMotorDatabase = Depends(get_database),
    t: Translator = Depends(get_translator)
):
    """
    Get all answers for a post, sorted by score (most helpful first)
    """
    answers = await answer_service.get_answers_by_post(post_id, skip, limit)

    # Convert to response models
    answer_list = []
    for answer in answers:
        answer_dict = answer.model_dump(by_alias=True)
        answer_dict["_id"] = str(answer_dict["_id"])
        answer_dict["post_id"] = str(answer_dict["post_id"])
        answer_author_id = answer_dict["author_id"]
        answer_dict["author_id"] = str(answer_author_id)
        answer_dict["votes"]["upvoted_by"] = [str(uid) for uid in answer_dict["votes"].get("upvoted_by", [])]
        answer_dict["votes"]["downvoted_by"] = [str(uid) for uid in answer_dict["votes"].get("downvoted_by", [])]

        # Fetch answer author name from users collection
        from bson import ObjectId
        if ObjectId.is_valid(str(answer_author_id)):
            user = await db.users.find_one({"_id": ObjectId(str(answer_author_id))})
            if user:
                answer_dict["author_name"] = user.get("name", "Unknown User")
            else:
                answer_dict["author_name"] = "Unknown User"
        else:
            answer_dict["author_name"] = "Unknown User"

        # Populate author names for comments
        for comment in answer_dict.get("comments", []):
            comment["id"] = str(comment["id"])
            comment_author_id = comment["author_id"]
            comment["author_id"] = str(comment_author_id)
            
            # Fetch author name from users collection
            if ObjectId.is_valid(str(comment_author_id)):
                user = await db.users.find_one({"_id": ObjectId(str(comment_author_id))})
                if user:
                    comment["author_name"] = user.get("name", "Unknown User")
                else:
                    comment["author_name"] = "Unknown User"

        answer_list.append(Answer(**answer_dict))

    return answer_list


@router.put("/{answer_id}", response_model=Answer)
async def update_answer(
    answer_id: str,
    answer_data: AnswerUpdate,
    current_user: User = Depends(get_current_user),
    answer_service: AnswerService = Depends(get_answer_service),
    t: Translator = Depends(get_translator)
):
    """
    Update an answer (only by author)
    """
    answer = await answer_service.update_answer(answer_id, answer_data, current_user.id)

    if not answer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("errors.not_found")
        )

    # Convert to response model
    answer_dict = answer.model_dump(by_alias=True)
    answer_dict["_id"] = str(answer_dict["_id"])
    answer_dict["post_id"] = str(answer_dict["post_id"])
    answer_dict["author_id"] = str(answer_dict["author_id"])
    answer_dict["votes"]["upvoted_by"] = [str(uid) for uid in answer_dict["votes"].get("upvoted_by", [])]
    answer_dict["votes"]["downvoted_by"] = [str(uid) for uid in answer_dict["votes"].get("downvoted_by", [])]

    # Convert comment IDs
    for comment in answer_dict.get("comments", []):
        comment["id"] = str(comment["id"])
        comment["author_id"] = str(comment["author_id"])

    return Answer(**answer_dict)


@router.delete("/{answer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_answer(
    answer_id: str,
    current_user: User = Depends(get_current_user),
    answer_service: AnswerService = Depends(get_answer_service),
    post_service: PostService = Depends(get_post_service),
    t: Translator = Depends(get_translator)
):
    """
    Delete an answer (only by author)
    """
    # Get answer to find post_id
    answer = await answer_service.get_answer_by_id(answer_id)
    if not answer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("errors.not_found")
        )

    success = await answer_service.delete_answer(answer_id, current_user.id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("errors.not_found")
        )

    # Decrement answer count on post
    await post_service.decrement_answer_count(str(answer.post_id))

    return None


@router.post("/{answer_id}/vote")
async def vote_answer(
    answer_id: str,
    is_upvote: bool = Query(..., description="True for helpful, False for not helpful"),
    current_user: User = Depends(get_current_user),
    answer_service: AnswerService = Depends(get_answer_service),
    db: AsyncIOMotorDatabase = Depends(get_database),
    t: Translator = Depends(get_translator)
):
    """
    Vote on an answer (helpful or not helpful)
    """
    answer = await answer_service.vote_answer(answer_id, current_user.id, is_upvote)

    if not answer:
        # Check if answer exists to give appropriate error message
        existing_answer = await answer_service.get_answer_by_id(answer_id)
        if existing_answer and str(existing_answer.author_id) == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=t("errors.cannot_vote_own_answer", "You cannot vote on your own answer")
            )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("errors.not_found")
        )

    # Convert to response model
    answer_dict = answer.model_dump(by_alias=True)
    answer_dict["_id"] = str(answer_dict["_id"])
    answer_dict["post_id"] = str(answer_dict["post_id"])
    answer_author_id = answer_dict["author_id"]
    answer_dict["author_id"] = str(answer_author_id)
    answer_dict["votes"]["upvoted_by"] = [str(uid) for uid in answer_dict["votes"].get("upvoted_by", [])]
    answer_dict["votes"]["downvoted_by"] = [str(uid) for uid in answer_dict["votes"].get("downvoted_by", [])]

    # Fetch answer author name
    from bson import ObjectId
    if ObjectId.is_valid(str(answer_author_id)):
        user = await db.users.find_one({"_id": ObjectId(str(answer_author_id))})
        if user:
            answer_dict["author_name"] = user.get("name", "Unknown User")
        else:
            answer_dict["author_name"] = "Unknown User"
    else:
        answer_dict["author_name"] = "Unknown User"

    # Populate author names for comments
    for comment in answer_dict.get("comments", []):
        comment["id"] = str(comment["id"])
        comment_author_id = comment["author_id"]
        comment["author_id"] = str(comment_author_id)
        
        # Fetch author name from users collection
        if ObjectId.is_valid(str(comment_author_id)):
            user = await db.users.find_one({"_id": ObjectId(str(comment_author_id))})
            if user:
                comment["author_name"] = user.get("name", "Unknown User")
            else:
                comment["author_name"] = "Unknown User"

    return answer_dict


@router.post("/{answer_id}/comments", response_model=Answer)
async def add_comment(
    answer_id: str,
    comment_data: CommentCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    answer_service: AnswerService = Depends(get_answer_service),
    notification_service: NotificationService = Depends(get_notification_service),
    post_service: PostService = Depends(get_post_service),
    user_service: UserService = Depends(get_user_service),
    db: AsyncIOMotorDatabase = Depends(get_database),
    t: Translator = Depends(get_translator)
):
    """
    Add a comment to an answer
    """
    answer = await answer_service.add_comment(answer_id, comment_data, current_user.id)

    if not answer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("errors.not_found")
        )

    # Send notification to answer author and bookmarked users
    background_tasks.add_task(
        send_comment_notification,
        answer_id,
        current_user.id,
        notification_service,
        answer_service,
        post_service,
        user_service
    )

    # Convert to response model
    answer_dict = answer.model_dump(by_alias=True)
    answer_dict["_id"] = str(answer_dict["_id"])
    answer_dict["post_id"] = str(answer_dict["post_id"])
    answer_author_id = answer_dict["author_id"]
    answer_dict["author_id"] = str(answer_author_id)
    answer_dict["votes"]["upvoted_by"] = [str(uid) for uid in answer_dict["votes"].get("upvoted_by", [])]
    answer_dict["votes"]["downvoted_by"] = [str(uid) for uid in answer_dict["votes"].get("downvoted_by", [])]

    # Fetch answer author name
    from bson import ObjectId
    if ObjectId.is_valid(str(answer_author_id)):
        user = await db.users.find_one({"_id": ObjectId(str(answer_author_id))})
        if user:
            answer_dict["author_name"] = user.get("name", "Unknown User")
        else:
            answer_dict["author_name"] = "Unknown User"
    else:
        answer_dict["author_name"] = "Unknown User"

    # Populate author names for comments
    from bson import ObjectId
    for comment in answer_dict.get("comments", []):
        comment["id"] = str(comment["id"])
        comment_author_id = comment["author_id"]
        comment["author_id"] = str(comment_author_id)
        
        # Fetch author name from users collection
        if ObjectId.is_valid(str(comment_author_id)):
            user = await db.users.find_one({"_id": ObjectId(str(comment_author_id))})
            if user:
                comment["author_name"] = user.get("name", "Unknown User")
            else:
                comment["author_name"] = "Unknown User"

    return Answer(**answer_dict)


@router.delete("/{answer_id}/comments/{comment_id}")
async def delete_comment(
    answer_id: str,
    comment_id: str,
    current_user: User = Depends(get_current_user),
    answer_service: AnswerService = Depends(get_answer_service),
    db: AsyncIOMotorDatabase = Depends(get_database),
    t: Translator = Depends(get_translator)
):
    """
    Delete a comment from an answer (only by comment author)
    """
    answer = await answer_service.delete_comment(answer_id, comment_id, current_user.id)

    if not answer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("errors.not_found")
        )

    # Convert to response model
    answer_dict = answer.model_dump(by_alias=True)
    answer_dict["_id"] = str(answer_dict["_id"])
    answer_dict["post_id"] = str(answer_dict["post_id"])
    answer_author_id = answer_dict["author_id"]
    answer_dict["author_id"] = str(answer_author_id)
    answer_dict["votes"]["upvoted_by"] = [str(uid) for uid in answer_dict["votes"].get("upvoted_by", [])]
    answer_dict["votes"]["downvoted_by"] = [str(uid) for uid in answer_dict["votes"].get("downvoted_by", [])]

    # Fetch answer author name
    from bson import ObjectId
    if ObjectId.is_valid(str(answer_author_id)):
        user = await db.users.find_one({"_id": ObjectId(str(answer_author_id))})
        if user:
            answer_dict["author_name"] = user.get("name", "Unknown User")
        else:
            answer_dict["author_name"] = "Unknown User"
    else:
        answer_dict["author_name"] = "Unknown User"

    # Populate author names for comments
    for comment in answer_dict.get("comments", []):
        comment["id"] = str(comment["id"])
        comment_author_id = comment["author_id"]
        comment["author_id"] = str(comment_author_id)
        
        # Fetch author name from users collection
        if ObjectId.is_valid(str(comment_author_id)):
            user = await db.users.find_one({"_id": ObjectId(str(comment_author_id))})
            if user:
                comment["author_name"] = user.get("name", "Unknown User")
            else:
                comment["author_name"] = "Unknown User"

    return answer_dict
