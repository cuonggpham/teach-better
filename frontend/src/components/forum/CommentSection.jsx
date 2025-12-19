import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { addComment, deleteComment } from '../../api/answersApi';
import { Button, Input } from '../ui';
import { ReportButton, UserInfoPopup } from '../forum';
import { formatDateTime } from '../../utils/formatters';
import './CommentSection.css';

/**
 * CommentSection Component - Hiển thị và quản lý comments cho một answer
 */
const CommentSection = ({ answerId, comments = [], onCommentAdded, onCommentDeleted }) => {
  const { t, i18n } = useTranslation();
  const { token, isAuthenticated, user } = useAuth();
  const toast = useToast();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated || !token || !newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addComment(token, answerId, { content: newComment.trim() });
      setNewComment('');
      if (onCommentAdded) onCommentAdded();
      toast.success(t('comment.added'));
      // Trigger notification refresh
      window.dispatchEvent(new CustomEvent('refreshNotifications'));
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error(t('comment.add_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!isAuthenticated || !token) return;

    try {
      await deleteComment(token, answerId, commentId);
      if (onCommentDeleted) onCommentDeleted();
      toast.success(t('comment.deleted'));
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error(t('comment.delete_error'));
    }
  };


  return (
    <div className="comment-section">
      <h4 className="comment-section-title">
        {t('comment.title')} ({comments.length})
      </h4>

      {isAuthenticated && (
        <form onSubmit={handleSubmit} className="comment-form">
          <Input
            as="textarea"
            rows={2}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t('comment.placeholder')}
            className="comment-input"
          />
          <Button type="submit" variant="primary" size="small" disabled={isSubmitting || !newComment.trim()}>
            {t('comment.submit')}
          </Button>
        </form>
      )}

      <div className="comments-list">
        {comments.length === 0 ? (
          <p className="no-comments">{t('comment.no_comments')}</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-header">
                {/* Avatar */}
                <div className="comment-avatar">
                  {comment.author_avatar_url ? (
                    <img src={comment.author_avatar_url} alt={comment.author_name} />
                  ) : (
                    <div className="comment-avatar-placeholder">
                      {(comment.author_name || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="comment-info">
                  <UserInfoPopup userId={comment.author_id} userName={comment.author_name}>
                    <span className="comment-author">{comment.author_name || t('comment.anonymous')}</span>
                  </UserInfoPopup>
                  <span className="comment-date">{formatDateTime(comment.created_at, i18n.language)}</span>
                </div>
              </div>
              <p className="comment-content">{comment.content}</p>
              <div className="comment-actions">
                {isAuthenticated && user && comment.author_id === user.id && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="comment-delete"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    {t('common.delete')}
                  </button>
                )}
                <ReportButton targetType="comment" targetId={comment.id} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;

