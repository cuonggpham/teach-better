import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { addBookmark, removeBookmark } from '../../api/bookmarksApi';
import { Button } from '../ui';
import './BookmarkButton.css';

/**
 * BookmarkButton Component - Button để bookmark/unbookmark post
 */
const BookmarkButton = ({ postId, isBookmarked: initialBookmarked, onToggle }) => {
  const { t } = useTranslation();
  const { token, isAuthenticated, user, updateUser } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked || false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsBookmarked(initialBookmarked || false);
  }, [initialBookmarked]);

  const handleToggle = async (e) => {
    e.stopPropagation(); // Prevent click from bubbling to parent elements
    if (!isAuthenticated || !token || isLoading) return;

    setIsLoading(true);
    try {
      if (isBookmarked) {
        await removeBookmark(token, postId);
        setIsBookmarked(false);
        // Update user bookmarks
        if (user && updateUser) {
          updateUser({
            ...user,
            bookmarked_post_ids: (user.bookmarked_post_ids || []).filter(id => id !== postId),
          });
        }
      } else {
        await addBookmark(token, postId);
        setIsBookmarked(true);
        // Update user bookmarks
        if (user && updateUser) {
          updateUser({
            ...user,
            bookmarked_post_ids: [...(user.bookmarked_post_ids || []), postId],
          });
        }
      }
      if (onToggle) onToggle(!isBookmarked);
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Button
      variant={isBookmarked ? 'primary' : 'ghost'}
      size="small"
      onClick={handleToggle}
      disabled={isLoading}
      className={`bookmark-button ${isBookmarked ? 'bookmarked' : ''}`}
      title={isBookmarked ? t('post.unbookmark', 'Bỏ lưu') : t('post.bookmark', 'Lưu')}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
      </svg>
    </Button>
  );
};

export default BookmarkButton;

