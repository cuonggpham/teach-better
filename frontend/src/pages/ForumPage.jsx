import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { getPosts, votePost } from '../api/postsApi';
import { Container, Card, Button, LoadingSpinner } from '../components/ui';
import { VoteButton, BookmarkButton } from '../components/forum';
import { formatDate } from '../utils/formatters';
import './ForumPage.css';

/**
 * ForumPage - Trang danh sách bài viết (diễn đàn)
 */
const ForumPage = () => {
  const { t } = useTranslation();
  const { token, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState(-1);

  useEffect(() => {
    fetchPosts();
  }, [sortBy, sortOrder]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await getPosts(token, {
        sort_by: sortBy,
        sort_order: sortOrder,
        limit: 20,
      });
      setPosts(data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (postId, isUpvote) => {
    if (!isAuthenticated || !token) {
      navigate('/signin');
      return;
    }

    try {
      const updatedPost = await votePost(token, postId, isUpvote);
      setPosts((prev) =>
        prev.map((post) => (post._id === postId ? updatedPost : post))
      );
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };


  const isUpvoted = (post) => {
    if (!user || !post.votes?.upvoted_by) return false;
    return post.votes.upvoted_by.includes(user.id);
  };

  const isDownvoted = (post) => {
    if (!user || !post.votes?.downvoted_by) return false;
    return post.votes.downvoted_by.includes(user.id);
  };

  const isBookmarked = (post) => {
    if (!user || !user.bookmarked_post_ids) return false;
    return user.bookmarked_post_ids.includes(post._id);
  };

  return (
    <div className="forum-page">
      <Container size="large">
        <div className="forum-header">
          <h1>{t('forum.title')}</h1>
          {isAuthenticated && (
            <Button as={Link} to="/forum/create" variant="primary">
              {t('forum.create_post')}
            </Button>
          )}
        </div>

        <div className="forum-filters">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="created_at">{t('forum.sort.newest')}</option>
            <option value="votes.score">{t('forum.sort.most_voted')}</option>
            <option value="answer_count">{t('forum.sort.most_answers')}</option>
            <option value="view_count">{t('forum.sort.most_views')}</option>
          </select>
        </div>

        {loading ? (
          <div className="forum-loading">
            <LoadingSpinner size="large" />
          </div>
        ) : posts.length === 0 ? (
          <Card variant="elevated" padding="large" className="forum-empty">
            <p>{t('forum.no_posts')}</p>
            {isAuthenticated && (
              <Button as={Link} to="/forum/create" variant="primary">
                {t('forum.create_first_post')}
              </Button>
            )}
          </Card>
        ) : (
          <div className="forum-posts">
            {posts.map((post) => (
              <Card key={post._id} variant="elevated" padding="medium" className="forum-post">
                <div className="post-layout">
                  <div className="post-votes">
                    <VoteButton
                      score={post.votes?.score || 0}
                      isUpvoted={isUpvoted(post)}
                      isDownvoted={isDownvoted(post)}
                      onVote={(isUpvote) => handleVote(post._id, isUpvote)}
                      disabled={!isAuthenticated}
                    />
                  </div>

                  <div className="post-content">
                    <div className="post-header">
                      <h2
                        className="post-title"
                        onClick={() => navigate(`/forum/${post._id}`)}
                      >
                        {post.title}
                      </h2>
                      <BookmarkButton
                        postId={post._id}
                        isBookmarked={isBookmarked(post)}
                      />
                    </div>

                    <p className="post-excerpt">{post.content?.substring(0, 200)}...</p>

                    <div className="post-meta">
                      <span className={`post-status ${post.status === 'open' ? 'status-open' : 'status-closed'}`}>
                        {post.status === 'open'
                          ? t('post.status.open')
                          : t('post.status.closed')}
                      </span>
                      <span className="post-stats">
                        {post.answer_count || 0} {t('post.answers')} •{' '}
                        {post.view_count || 0} {t('post.views')}
                      </span>
                      <span className="post-date">{formatDate(post.created_at)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
};

export default ForumPage;

