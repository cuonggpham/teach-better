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
      variant={isBookmarked ? 'primary' : 'outline'}
      size="small"
      onClick={handleToggle}
      disabled={isLoading}
      className={`bookmark-button ${isBookmarked ? 'bookmarked' : ''}`}
    >
      {isBookmarked ? '★' : '☆'} {t('post.bookmark')}
    </Button>
  );
};

export default BookmarkButton;

