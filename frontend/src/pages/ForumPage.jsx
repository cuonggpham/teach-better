import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { postsApi } from '../api/api';
import './ForumPage.css';

const ForumPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const data = await postsApi.getPosts();
      setPosts(data);
    } catch (error) {
      setError(t('common.error_loading'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    
    if (!newPost.title.trim() || !newPost.content.trim()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await postsApi.createPost({
        title: newPost.title,
        content: newPost.content,
        tag_ids: []
      });
      
      setNewPost({ title: '', content: '' });
      setShowCreateModal(false);
      fetchPosts();
    } catch (error) {
      setError(t('common.error_creating'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return t('time.just_now');
    if (diff < 3600) return `${Math.floor(diff / 60)} ${t('time.minutes_ago')}`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ${t('time.hours_ago')}`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} ${t('time.days_ago')}`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="forum-page">
      <div className="forum-container">
        <div className="forum-header">
          <div>
            <h1>{t('forum.title')}</h1>
            <p>{t('forum.subtitle')}</p>
          </div>
          <button 
            className="btn-create-post"
            onClick={() => setShowCreateModal(true)}
          >
            <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('forum.create_post')}
          </button>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="loading-container">
            <div className="spinner-large"></div>
            <p>{t('common.loading')}</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3>{t('forum.no_posts')}</h3>
            <p>{t('forum.no_posts_desc')}</p>
          </div>
        ) : (
          <div className="posts-list">
            {posts.map((post) => (
              <div 
                key={post._id} 
                className="post-card"
                onClick={() => navigate(`/forum/${post._id}`)}
              >
                <div className="post-votes">
                  <button className="vote-btn">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <span className="vote-count">{post.votes?.score || 0}</span>
                  <button className="vote-btn">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                <div className="post-content">
                  <h2 className="post-title">{post.title}</h2>
                  <p className="post-excerpt">
                    {post.content.substring(0, 200)}
                    {post.content.length > 200 && '...'}
                  </p>
                  
                  <div className="post-meta">
                    <div className="post-author">
                      <div className="avatar">
                        {post.author?.avatar_url ? (
                          <img src={post.author.avatar_url} alt={post.author.name} />
                        ) : (
                          <span>{post.author?.name?.charAt(0) || '?'}</span>
                        )}
                      </div>
                      <span className="author-name">{post.author?.name || t('common.anonymous')}</span>
                    </div>
                    
                    <div className="post-stats">
                      <span className="stat">
                        <svg className="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        {post.answer_count || 0}
                      </span>
                      <span className="stat">
                        <svg className="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {post.view_count || 0}
                      </span>
                      <span className="post-time">{formatDate(post.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('forum.create_post')}</h2>
              <button 
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="modal-form">
              <div className="form-group">
                <label htmlFor="title">{t('forum.post_title')}</label>
                <input
                  type="text"
                  id="title"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  placeholder={t('forum.post_title_placeholder')}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="content">{t('forum.post_content')}</label>
                <textarea
                  id="content"
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder={t('forum.post_content_placeholder')}
                  rows="10"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isSubmitting}
                >
                  {t('common.cancel')}
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner"></span>
                      {t('common.submitting')}
                    </>
                  ) : (
                    t('common.submit')
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForumPage;
