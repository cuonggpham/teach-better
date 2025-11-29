import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getPosts } from '../api/postsApi';
import { getCategories } from '../api/categoriesApi';
import { Container, Card, Button, LoadingSpinner } from '../components/ui';
import { BookmarkButton } from '../components/forum';
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
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [popularTags, setPopularTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
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

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [sortBy, sortOrder, currentPage, searchQuery, selectedCategory, selectedTag]);

  const fetchCategories = async () => {
    try {
      console.log('[ForumPage] Fetching categories...');
      const response = await getCategories();
      console.log('[ForumPage] Categories response:', response);
      console.log('[ForumPage] Categories array:', response.categories);
      setCategories(response.categories || []);
    } catch (error) {
      console.error('[ForumPage] Failed to fetch categories:', error);
      console.error('[ForumPage] Error details:', error.response?.data);
      setCategories([]);
    }
  };

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
      if (selectedCategory) {
        params.category = selectedCategory;
      }
      if (selectedTag) {
        params.tag_ids = [selectedTag];
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
      
      // Extract popular tags from posts
      extractPopularTags(data);
    } catch (error) {
      console.error('[ForumPage] Failed to fetch posts:', error);
      setPosts([]);
      setTotalPosts(0);
    } finally {
      setLoading(false);
    }
  };

  const extractPopularTags = (posts) => {
    const tagMap = new Map();
    posts.forEach(post => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => {
          if (tagMap.has(tag.name)) {
            tagMap.set(tag.name, { ...tag, count: tagMap.get(tag.name).count + 1 });
          } else {
            tagMap.set(tag.name, { ...tag, count: 1 });
          }
        });
      }
    });
    const sortedTags = Array.from(tagMap.values()).sort((a, b) => b.count - a.count);
    setPopularTags(sortedTags.slice(0, 10));
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

  const handleCategoryClick = (categoryName) => {
    if (selectedCategory === categoryName) {
      setSelectedCategory(null); // Deselect if clicking the same category
    } else {
      setSelectedCategory(categoryName);
    }
    setCurrentPage(1);
  };

  const handleTagClick = (tagId) => {
    if (selectedTag === tagId) {
      setSelectedTag(null); // Deselect if clicking the same tag
    } else {
      setSelectedTag(tagId);
    }
    setCurrentPage(1);
  };

  return (
    <div className="forum-page">
      <Container size="large">
        <div className="forum-header">
          <h1>{t('forum.title')}</h1>
          {isAuthenticated && (
            <Button as={Link} to="/forum/create" variant="primary" className="create-post-btn">
              + {t('forum.create_post')}
            </Button>
          )}
        </div>

        <div className="forum-layout">
          {/* Left Sidebar - Categories */}
          <aside className="forum-sidebar">
            <Card variant="elevated" padding="medium" className="categories-card">
              <h3 className="sidebar-title">{t('forum.categories', 'Danh mục')}</h3>
              <ul className="category-list">
                <li 
                  className={`category-item ${!selectedCategory ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(null)}
                >
                  <span className="category-name">{t('forum.all_categories', 'Tất cả')}</span>
                </li>
                {categories.map((category) => (
                  <li 
                    key={category._id} 
                    className={`category-item ${selectedCategory === category.name ? 'active' : ''}`}
                    onClick={() => handleCategoryClick(category.name)}
                  >
                    <span className="category-name">{category.name}</span>
                    <span className="category-count">{category.post_count || 0}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Popular Tags */}
            {popularTags.length > 0 && (
              <Card variant="elevated" padding="medium" className="tags-card">
                <h3 className="sidebar-title">{t('forum.popular_tags', 'Thẻ phổ biến')}</h3>
                <div className="tag-list">
                  {popularTags.map((tag) => (
                    <button
                      key={tag._id}
                      className={`tag-button ${selectedTag === tag._id ? 'active' : ''}`}
                      onClick={() => handleTagClick(tag._id)}
                    >
                      {tag.name}
                      <span className="tag-count">({tag.count})</span>
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </aside>

          {/* Main Content */}
          <main className="forum-main">
            <div className="forum-controls">
              <form className="search-bar" onSubmit={handleSearch}>
                <input
                  type="text"
                  placeholder={t('forum.search_placeholder', 'Tìm kiếm theo tiêu đề, từ khóa, tag hoặc tên người đăng')}
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
              <>
                <div className="forum-posts">
                  {posts.map((post) => (
                    <Card key={post._id} variant="elevated" padding="medium" className="forum-post-card">
                      <div className="post-card-header">
                        <h2
                          className="post-card-title"
                          onClick={() => navigate(`/forum/${post._id}`)}
                        >
                          {post.title}
                        </h2>
                        <BookmarkButton
                          postId={post._id}
                          isBookmarked={isBookmarked(post)}
                          onToggle={() => fetchPosts()}
                        />
                      </div>

                      <p className="post-card-excerpt">{post.content?.substring(0, 150)}...</p>

                      {(post.category || (post.tags && post.tags.length > 0)) && (
                        <div className="post-card-tags">
                          {post.category && (
                            <span className="post-category-badge">{post.category}</span>
                          )}
                          {post.tags && post.tags.map((tag) => (
                            <span key={tag._id} className="post-tag">{tag.name}</span>
                          ))}
                        </div>
                      )}

                      <div className="post-card-footer">
                        <div className="post-card-meta">
                          {post.author && (
                            <span className="post-author">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                              </svg>
                              {post.author.name || post.author.email}
                            </span>
                          )}
                          <span className="post-date">{formatDate(post.created_at, i18n.language)}</span>
                        </div>

                        <div className="post-card-stats">
                          <span className="stat-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            {post.answer_count || 0}
                          </span>
                          <span className="stat-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            {post.view_count || 0}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
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
              </>
            )}
          </main>
        </div>
      </Container>
    </div>
  );
};

export default ForumPage;

