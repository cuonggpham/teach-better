import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getPostComments, addComment, updateComment, deleteComment } from '../../api/postsApi';
import { useToast } from '../../contexts/ToastContext';
import './CommentSection.css';

const CommentSection = ({ postId, onCommentAdded }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [newCommentId, setNewCommentId] = useState(null);
  const [isReloading, setIsReloading] = useState(false);
  const commentsEndRef = useRef(null);
  const newCommentRef = useRef(null);

  const token = localStorage.getItem('token');

  // Load comments on mount
  useEffect(() => {
    loadComments();
  }, [postId]);

  // Scroll to new comment when it appears
  useEffect(() => {
    if (newCommentId && newCommentRef.current) {
      setTimeout(() => {
        newCommentRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 300);
    }
  }, [newCommentId, comments]);

  const loadComments = async () => {
    try {
      setIsLoadingComments(true);
      const response = await getPostComments(postId, token);
      setComments(response.data || response || []);
    } catch (error) {
      console.error('Error loading comments:', error);
      showToast('Lỗi khi tải bình luận', 'error');
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!user) {
      showToast('Vui lòng đăng nhập để bình luận', 'warning');
      return;
    }

    if (!newComment.trim()) {
      showToast('Bình luận không được để trống', 'warning');
      return;
    }

    try {
      setLoading(true);

      // Gửi bình luận
      const response = await addComment(token, postId, {
        content: newComment,
      });

      const createdComment = response.data || response;

      // Hiệu ứng reload mượt mà
      setIsReloading(true);

      // Reset form
      setNewComment('');
      setNewCommentId(createdComment._id);

      // Tải lại danh sách comments với animation
      await new Promise(resolve => setTimeout(resolve, 300));
      await loadComments();

      showToast('Bình luận đã được đăng thành công!', 'success');

      // Gọi callback nếu có
      if (onCommentAdded) {
        onCommentAdded(createdComment);
      }

    } catch (error) {
      console.error('Error adding comment:', error);
      showToast(
        error.message || 'Lỗi khi đăng bình luận',
        'error'
      );
    } finally {
      setLoading(false);
      setIsReloading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa bình luận này?')) {
      return;
    }

    try {
      await deleteComment(token, postId, commentId);

      // Tải lại comments
      await loadComments();
      showToast('Bình luận đã được xóa', 'success');
    } catch (error) {
      console.error('Error deleting comment:', error);
      showToast('Lỗi khi xóa bình luận', 'error');
    }
  };

  const handleEditComment = async (commentId, newContent) => {
    if (!newContent.trim()) {
      showToast('Nội dung bình luận không được để trống', 'warning');
      return;
    }

    try {
      await updateComment(token, postId, commentId, {
        content: newContent,
      });

      await loadComments();
      showToast('Bình luận đã được cập nhật', 'success');
    } catch (error) {
      console.error('Error updating comment:', error);
      showToast('Lỗi khi cập nhật bình luận', 'error');
    }
  };

  return (
    <div className="comment-section">
      {/* Hiệu ứng reload */}
      {isReloading && <div className="reload-overlay"></div>}

      <h3 className="comment-title">💬 Bình luận ({comments.length})</h3>

      {/* Form đăng bình luận */}
      {user ? (
        <form onSubmit={handleSubmitComment} className="comment-form">
          <div className="comment-input-wrapper">
            <img
              src={user.avatar || '/default-avatar.png'}
              alt="Avatar"
              className="user-avatar"
            />
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Chia sẻ ý kiến của bạn..."
              className="comment-textarea"
              disabled={loading}
              rows="3"
            />
          </div>

          <div className="comment-form-actions">
            <button
              type="submit"
              disabled={loading || !newComment.trim()}
              className="btn-submit-comment"
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Đang đăng...
                </>
              ) : (
                <>
                  📤 Đăng bình luận
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="comment-login-prompt">
          <p>🔒 Vui lòng <a href="/signin">đăng nhập</a> để bình luận</p>
        </div>
      )}

      {/* Danh sách bình luận */}
      <div className="comments-list">
        {isLoadingComments ? (
          <div className="loading-state">
            <div className="spinner-large"></div>
            <p>Đang tải bình luận...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="empty-state">
            <p>Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              isNew={comment._id === newCommentId}
              isOwner={user?._id === comment.user?._id}
              onDelete={() => handleDeleteComment(comment._id)}
              onEdit={(newContent) =>
                handleEditComment(comment._id, newContent)
              }
              ref={comment._id === newCommentId ? newCommentRef : null}
            />
          ))
        )}
      </div>

      <div ref={commentsEndRef} />
    </div>
  );
};

// Comment Item Component
const CommentItem = React.forwardRef(
  ({ comment, isNew, isOwner, onDelete, onEdit }, ref) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(comment.content);

    const handleSaveEdit = () => {
      onEdit(editedContent);
      setIsEditing(false);
    };

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    return (
      <div
        ref={ref}
        className={`comment-item ${isNew ? 'comment-new' : ''}`}
      >
        <div className="comment-header">
          <div className="comment-user-info">
            <img
              src={comment.user?.avatar || '/default-avatar.png'}
              alt={comment.user?.name}
              className="comment-avatar"
            />
            <div className="comment-user-details">
              <h4 className="comment-username">{comment.user?.name}</h4>
              <span className="comment-date">{formatDate(comment.createdAt)}</span>
            </div>
          </div>

          {isNew && <span className="badge-new">✨ Mới</span>}
        </div>

        {isEditing ? (
          <div className="comment-edit-form">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="edit-textarea"
              rows="3"
            />
            <div className="edit-actions">
              <button
                onClick={handleSaveEdit}
                className="btn-save-edit"
              >
                💾 Lưu
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedContent(comment.content);
                }}
                className="btn-cancel-edit"
              >
                ❌ Hủy
              </button>
            </div>
          </div>
        ) : (
          <div className="comment-content">
            <p>{comment.content}</p>
          </div>
        )}

        {isOwner && (
          <div className="comment-actions">
            <button
              onClick={() => setIsEditing(true)}
              className="btn-action btn-edit"
              title="Chỉnh sửa"
            >
              ✏️
            </button>
            <button
              onClick={onDelete}
              className="btn-action btn-delete"
              title="Xóa"
            >
              🗑️
            </button>
          </div>
        )}
      </div>
    );
  }
);

CommentItem.displayName = 'CommentItem';

export default CommentSection;