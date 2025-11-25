import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState(-1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const postsPerPage = 10;

  const totalPages = Math.ceil(totalPosts / postsPerPage);

  // Reset to page 1 when coming from create post
  useEffect(() => {
    if (location.state?.newPostId) {
      setCurrentPage(1);
      setSortBy('created_at');
      setSortOrder(-1);
      // Clear the state to prevent reset on subsequent navigations
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  useEffect(() => {
    fetchPosts();
  }, [sortBy, sortOrder, currentPage]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const skip = (currentPage - 1) * postsPerPage;
      console.log('[ForumPage] Fetching posts with params:', {
        sort_by: sortBy,
        sort_order: sortOrder,
        skip,
        limit: postsPerPage,
      });
      const response = await getPosts(token, {
        sort_by: sortBy,
        sort_order: sortOrder,
        skip,
        limit: postsPerPage,
      });

      // Handle new response format with posts and total
      const data = response.posts || response;
      const total = response.total || 0;

      console.log('[ForumPage] Fetched posts count:', data.length, 'Total:', total);
      if (data.length > 0) {
        console.log('[ForumPage] First 3 posts with dates:');
        data.slice(0, 3).forEach((p, i) => {
          console.log(`  [${i}] "${p.title}" - created: ${p.created_at}`);
        });
      }
      setPosts(data);
      setTotalPosts(total);
    } catch (error) {
      console.error('[ForumPage] Failed to fetch posts:', error);
      setPosts([]);
      setTotalPosts(0);
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

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show smart pagination
      if (currentPage <= 3) {
        // Near the start
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        // In the middle
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
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
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1); // Reset to page 1 when changing sort
            }}
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

        {/* Pagination */}
        {!loading && posts.length > 0 && totalPages > 1 && (
          <div className="pagination">
            <Button
              variant="ghost"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              {t('common.previous')}
            </Button>

            <div className="pagination-numbers">
              {getPageNumbers().map((page, index) => (
                page === '...' ? (
                  <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                )
              ))}
            </div>

            <Button
              variant="ghost"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              {t('common.next')}
            </Button>
          </div>
        )}
      </Container>
    </div>
  );
};

export default ForumPage;

