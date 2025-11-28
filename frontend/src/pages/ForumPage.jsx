import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getPosts, votePost } from '../api/postsApi';
import { Container, Card, Button, LoadingSpinner } from '../components/ui';
import { VoteButton, BookmarkButton } from '../components/forum';
import { formatDate } from '../utils/formatters';
import './ForumPage.css';

/**
 * ForumPage - Trang danh sách bài viết (diễn đàn)
 */
const ForumPage = () => {
  const { t, i18n } = useTranslation();
  const { token, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState(-1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
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
  }, [sortBy, sortOrder, currentPage, searchQuery]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const skip = (currentPage - 1) * postsPerPage;
      const params = {
        sort_by: sortBy,
        sort_order: sortOrder,
        skip,
        limit: postsPerPage,
      };
      if (searchQuery) {
        params.search = searchQuery;
      }
      console.log('[ForumPage] Fetching posts with params:', params);
      const response = await getPosts(token, params);

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
      toast.warning(t('auth.login_required'));
      navigate('/signin');
      return;
    }

    try {
      const updatedPost = await votePost(token, postId, isUpvote);
      setPosts((prev) =>
        prev.map((post) => (post._id === postId ? updatedPost : post))
      );
      toast.success(t('post.vote_success'));
    } catch (error) {
      console.error('Failed to vote:', error);
      toast.error(t('post.vote_error'));
    }
  };


  const isUpvoted = (post) => {
    if (!user || !post.votes?.upvoted_by) return false;
    const userId = user.id || user._id;
    // Check if user ID is in the upvoted list (compare as strings)
    return post.votes.upvoted_by.some(id => String(id) === String(userId));
  };

  const isDownvoted = (post) => {
    if (!user || !post.votes?.downvoted_by) return false;
    const userId = user.id || user._id;
    // Check if user ID is in the downvoted list (compare as strings)
    return post.votes.downvoted_by.some(id => String(id) === String(userId));
  };

  const isBookmarked = (post) => {
    if (!user || !user.bookmarked_post_ids) return false;
    return user.bookmarked_post_ids.includes(post._id);
  };

  const isAuthor = (post) => {
    if (!user || !post.author_id) return false;
    return user.id === post.author_id || user._id === post.author_id;
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

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setCurrentPage(1); // Reset to page 1 when searching
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setCurrentPage(1);
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

        <div className="forum-controls">
          <form className="search-bar" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="search-input"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="clear-search-btn"
                title={t('common.close')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
            <button type="submit" className="search-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </button>
          </form>

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
                      disabled={!isAuthenticated || isAuthor(post)}
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
                      {post.author && (
                        <span className="post-author">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                          {post.author.name || post.author.email}
                        </span>
                      )}
                      <span className="post-stats">
                        {post.answer_count || 0} {t('post.answers')} •{' '}
                        {post.view_count || 0} {t('post.views')}
                      </span>
                      <span className="post-date">{formatDate(post.created_at, i18n.language)}</span>
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

