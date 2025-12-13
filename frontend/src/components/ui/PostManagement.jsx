import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import axiosConfig from '../../api/axiosConfig';
import './PostManagement.css';

const PostManagement = () => {
    const { t, ready } = useTranslation('translation');
    const navigate = useNavigate();

    // State management
    const [posts, setPosts] = useState([]);
    const [filteredPosts, setFilteredPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [categories, setCategories] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const postsPerPage = 10;

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        filterPosts();
    }, [posts, searchQuery, selectedCategory]);

    // Update categories when language changes
    useEffect(() => {
        if (categories.length > 1 && ready && t) {
            // Update the "All" option with new translation
            const updatedCategories = [
                { id: 'all', name: t('posts.filter.all') || 'Tất cả' },
                ...categories.slice(1) // Keep the rest of the categories unchanged
            ];
            setCategories(updatedCategories);
        }
    }, [ready, t]);

    // Remove this useEffect as selectedCategory is now initialized as 'all'

    const loadData = async () => {
        setLoading(true);
        try {
            // Load posts and categories in parallel
            const [postsResponse, categoriesResponse] = await Promise.all([
                axiosConfig.get('/posts/?skip=0&limit=100&sort_by=created_at&sort_order=-1'),
                adminApi.getCategories(false).catch(() => ({ categories: [] }))
            ]);

            const postsData = postsResponse.posts || postsResponse.data?.posts || [];
            setPosts(Array.isArray(postsData) ? postsData : []);

            // Process categories
            // The categories are directly in the response array, not nested
            const categoriesData = Array.isArray(categoriesResponse) ? categoriesResponse :
                categoriesResponse.categories || categoriesResponse.data || [];

            const categoryOptions = [
                { id: 'all', name: t('posts.filter.all') || 'Tất cả' },
                ...categoriesData.map(cat => ({ id: cat._id || cat.id, name: cat.name }))
            ];
            setCategories(categoryOptions);

        } catch (error) {
            console.error('Failed to load data:', error);
            setPosts([]);
            setCategories([{ id: 'all', name: t('posts.filter.all') || 'Tất cả' }]);
        }
        setLoading(false);
    };

    const filterPosts = () => {
        let filtered = [...posts];

        // Apply search query filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(post => {
                const title = getPostField(post, 'title', '').toLowerCase();
                const content = getPostField(post, 'content', '').toLowerCase();
                const author = (post.author?.name || getPostField(post, 'author', '')).toLowerCase();
                const tags = getPostTags(post).map(tag =>
                    (typeof tag === 'string' ? tag : tag.name || '').toLowerCase()
                ).join(' ');

                return title.includes(query) ||
                    content.includes(query) ||
                    author.includes(query) ||
                    tags.includes(query);
            });
        }

        // Apply category filter
        if (selectedCategory && selectedCategory !== 'all') {
            filtered = filtered.filter(post => {
                const postCategories = post.categories || [];
                if (Array.isArray(postCategories)) {
                    return postCategories.some(cat =>
                        (typeof cat === 'string' ? cat : cat._id || cat.id) === selectedCategory
                    );
                }
                return false;
            });
        }

        setFilteredPosts(filtered);
        setCurrentPage(1); // Reset to first page when filtering
    };

    const handleSearch = () => {
        filterPosts();
    };

    const handleReset = () => {
        setSearchQuery('');
        setSelectedCategory('all');
    };

    const handleDelete = async (postId) => {
        const confirmMessage = t ? t('posts.confirmDelete') || 'Bạn có chắc chắn muốn xóa bài viết này?' : 'Bạn có chắc chắn muốn xóa bài viết này?';
        if (window.confirm(confirmMessage)) {
            try {
                await adminApi.deletePost(postId);
                // Remove from local state after successful deletion
                const updatedPosts = posts.filter(post =>
                    (post.id || post._id) !== postId
                );
                setPosts(updatedPosts);
                alert(t ? t('posts.deleteSuccess') || 'Xóa bài viết thành công!' : 'Xóa bài viết thành công!');
            } catch (error) {
                console.error('Failed to delete post:', error);
                alert(t ? t('posts.deleteError') || 'Có lỗi xảy ra khi xóa bài viết!' : 'Có lỗi xảy ra khi xóa bài viết!');
            }
        }
    };

    const handleViewDetails = (postId) => {
        // Navigate to forum post detail page
        navigate(`/forum/${postId}`);
    };

    const handleTitleClick = (postId) => {
        // Same as view details - navigate to post
        handleViewDetails(postId);
    };

    // Pagination
    const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
    const indexOfLastPost = currentPage * postsPerPage;
    const indexOfFirstPost = indexOfLastPost - postsPerPage;
    const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);

    const formatDate = (dateString) => {
        if (!dateString) return '不明';
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP') + ' ' + date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    };

    const getPostField = (post, field, defaultValue = '') => {
        return post[field] || defaultValue;
    };

    const getPostTags = (post) => {
        if (post.tags && Array.isArray(post.tags)) {
            return post.tags.map(tag => typeof tag === 'string' ? tag : tag.name || tag);
        }
        return [];
    };

    // Show loading if i18n is not ready
    if (!ready) {
        return (
            <div className="post-management">
                <div className="admin-header">
                    <h1 className="admin-title">Loading translations...</h1>
                </div>
            </div>
        );
    }

    return (
        <div className="post-management">
            {/* Header */}
            <div className="admin-header">
                <h1 className="admin-title">{t('posts.title')}</h1>
            </div>

            {/* Search and Filter Section */}
            <div className="search-filter-section">
                <div className="search-controls">
                    <div className="search-bar">
                        <input
                            type="text"
                            placeholder={t('posts.search.placeholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="category-filter"
                        >
                            {categories.map(category => (
                                <option key={category.id} value={category.id}>{category.name}</option>
                            ))}
                        </select>
                        <button onClick={handleSearch} className="search-btn">{t('posts.search.button')}</button>
                        <button onClick={handleReset} className="reset-btn">{t('posts.search.reset')}</button>
                    </div>
                </div>

                {/* Results count */}
                <div className="results-info">
                    {t('posts.results.total', { count: filteredPosts.length })}
                </div>
            </div>

            {/* Content List */}
            <div className="content-list">
                {loading ? (
                    <div className="loading-state">読み込み中...</div>
                ) : currentPosts.length === 0 ? (
                    <div className="empty-state">投稿がありません</div>
                ) : (
                    <>
                        {currentPosts.map(post => {
                            const postId = post.id || post._id;
                            const postTags = getPostTags(post);
                            const authorName = post.author?.name || getPostField(post, 'author', t('posts.unknown_author'));

                            return (
                                <div key={postId} className="post-item">
                                    <div className="post-content">
                                        <h3
                                            className="post-title clickable"
                                            onClick={() => handleTitleClick(postId)}
                                            title="Click to view post details"
                                        >
                                            {getPostField(post, 'title', t('posts.no_title'))}
                                        </h3>
                                        <p className="post-description">{getPostField(post, 'content', t('posts.no_content')).substring(0, 100)}...</p>
                                        <div className="post-meta">
                                            <span className="post-author">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                    <circle cx="12" cy="7" r="4" />
                                                </svg>
                                                {authorName}
                                            </span>
                                            <span className="post-time">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <polyline points="12 6 12 12 16 14" />
                                                </svg>
                                                {formatDate(post.created_at)}
                                            </span>
                                        </div>

                                        <div className="post-tags">
                                            {postTags.length > 0 ? postTags.map((tag, index) => (
                                                <span key={index} className="tag">{typeof tag === 'string' ? tag : tag.name}</span>
                                            )) : null}
                                        </div>
                                    </div>

                                    <div className="post-right">
                                        <div className="post-actions">
                                            <button
                                                className="detail-btn"
                                                onClick={() => handleViewDetails(postId)}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                                {t('posts.actions.details')}
                                            </button>
                                            <button
                                                className="delete-btn"
                                                onClick={() => handleDelete(postId)}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                    <line x1="10" y1="11" x2="10" y2="17" />
                                                    <line x1="14" y1="11" x2="14" y2="17" />
                                                </svg>
                                                {t('posts.actions.delete')}
                                            </button>
                                        </div>

                                        <div className="post-stats">
                                            <span className="comment-count">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                                </svg>
                                                {getPostField(post, 'answer_count', 0)}
                                            </span>
                                            <span className="view-count">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                                {getPostField(post, 'view_count', 0)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="pagination">
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    className={`page-btn ${currentPage === 1 ? 'active' : ''}`}
                                >
                                    1
                                </button>

                                {currentPage > 3 && (
                                    <span className="page-dots">...</span>
                                )}

                                {currentPage > 2 && currentPage !== 2 && (
                                    <button
                                        onClick={() => setCurrentPage(currentPage - 1)}
                                        className="page-btn"
                                    >
                                        {currentPage - 1}
                                    </button>
                                )}

                                {currentPage !== 1 && currentPage !== totalPages && (
                                    <button
                                        onClick={() => setCurrentPage(currentPage)}
                                        className="page-btn active"
                                    >
                                        {currentPage}
                                    </button>
                                )}

                                {currentPage < totalPages - 1 && currentPage !== totalPages - 1 && (
                                    <button
                                        onClick={() => setCurrentPage(currentPage + 1)}
                                        className="page-btn"
                                    >
                                        {currentPage + 1}
                                    </button>
                                )}

                                {currentPage < totalPages - 2 && (
                                    <span className="page-dots">...</span>
                                )}

                                {totalPages > 1 && (
                                    <button
                                        onClick={() => setCurrentPage(totalPages)}
                                        className={`page-btn ${currentPage === totalPages ? 'active' : ''}`}
                                    >
                                        {totalPages}
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default PostManagement;