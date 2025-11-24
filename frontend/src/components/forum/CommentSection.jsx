import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { addComment, deleteComment } from '../../api/answersApi';
import { Button, Input, Card } from '../ui';
import { formatDateTime } from '../../utils/formatters';
import './CommentSection.css';

/**
 * CommentSection Component - Hiển thị và quản lý comments cho một answer
 */
const CommentSection = ({ answerId, comments = [], onCommentAdded, onCommentDeleted }) => {
  const { t } = useTranslation();
  const { token, isAuthenticated, user } = useAuth();
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
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!isAuthenticated || !token || !window.confirm(t('comment.delete_confirm'))) return;

    try {
      await deleteComment(token, answerId, commentId);
      if (onCommentDeleted) onCommentDeleted();
    } catch (error) {
      console.error('Failed to delete comment:', error);
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
            type="text"
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
            <Card key={comment.id} variant="outlined" padding="small" className="comment-item">
              <div className="comment-header">
                <span className="comment-author">{comment.author_name || t('comment.anonymous')}</span>
                <span className="comment-date">{formatDateTime(comment.created_at, 'vi-VN')}</span>
              </div>
              <p className="comment-content">{comment.content}</p>
              {isAuthenticated && user && comment.author_id === user.id && (
                <Button
                  variant="ghost"
                  size="small"
                  onClick={() => handleDelete(comment.id)}
                  className="comment-delete"
                >
                  {t('common.delete')}
                </Button>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;

