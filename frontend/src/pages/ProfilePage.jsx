import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile } from '../api/authApi';
import { getPosts } from '../api/postsApi';
import { getBookmarks } from '../api/bookmarksApi';
import { Container, Card, LoadingSpinner, Button, Input, ToastContainer, AvatarUpload } from '../components/ui';
import { formatDate } from '../utils/formatters';
import './ProfilePage.css';

/**
 * Profile Management Page
 */
const ProfilePage = () => {
  const { t, i18n } = useTranslation();
  const { user, token, isAuthenticated, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');
  const [userPosts, setUserPosts] = useState([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration: 5000 }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    avatar_url: '',
  });

  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || '',
        bio: user.bio || '',
        avatar_url: user.avatar_url || '',
      });
    }
  }, [user]);

  const handleUpdate = async () => {
    try {
      setLoading(true);
      const response = await updateProfile(user._id || user.id, editForm, token);
      updateUser(response.data);
      setIsEditing(false);
      showToast(response.message || t('user.update_success', 'Profile updated successfully'), 'success');
    } catch (error) {
      console.error(error);
      showToast(error.message || t('common.error'), 'error');
    } finally {
      setLoading(false);
    }
  };



  const handleAvatarUpload = (avatarUrl) => {
    // Update form state
    setEditForm(prev => ({ ...prev, avatar_url: avatarUrl }));

    // Update user in AuthContext immediately so navbar shows new avatar
    const updatedUser = { ...user, avatar_url: avatarUrl };
    updateUser(updatedUser);

    showToast(t('user.upload_success', 'Avatar updated successfully!'), 'success');
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (activeTab === 'posts') {
      fetchUserPosts();
    } else if (activeTab === 'bookmarks') {
      fetchBookmarks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchUserPosts = async () => {
    if (!token || !user) return;

    setLoading(true);
    try {
      const response = await getPosts(token, {
        author_id: user._id || user.id,
        sort_by: 'created_at',
        sort_order: -1,
      });
      // Handle new response format with posts and total
      const posts = response.posts || response;
      console.log('User posts:', posts);
      setUserPosts(Array.isArray(posts) ? posts : []);
    } catch (error) {
      console.error('Failed to fetch user posts:', error);
      setUserPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookmarks = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const bookmarks = await getBookmarks(token);
      setBookmarkedPosts(bookmarks);
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };


  if (!user) {
    return null;
  }

  return (
    <div className="profile-page">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <Container size="large">
        <div className="profile-layout">
          {/* Sidebar */}
          <aside className="profile-sidebar">
            <Card variant="elevated" padding="large" className="profile-card">
              {/* Avatar Section */}
              <div className="avatar-section">
                <AvatarUpload
                  currentAvatar={editForm.avatar_url || user.avatar_url}
                  userName={user.name || user.email}
                  onUpload={handleAvatarUpload}
                  disabled={!isEditing}
                  size="large"
                />
                <h2 className="user-name">{user.name || user.email}</h2>
                <p className="user-email">{user.email}</p>
                <span className="user-badge">
                  {user.role === 'admin' ? t('user.roles.admin') : t('user.roles.user')}
                </span>
              </div>

              {/* Navigation Menu */}
              <nav className="profile-nav">
                <button
                  className={`nav-item ${activeTab === 'info' ? 'active' : ''}`}
                  onClick={() => setActiveTab('info')}
                >
                  <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span className="nav-text">{t('user.personal_info')}</span>
                </button>
                <button
                  className={`nav-item ${activeTab === 'posts' ? 'active' : ''}`}
                  onClick={() => setActiveTab('posts')}
                >
                  <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  <span className="nav-text">{t('user.my_posts')}</span>
                </button>
                <button
                  className={`nav-item ${activeTab === 'bookmarks' ? 'active' : ''}`}
                  onClick={() => setActiveTab('bookmarks')}
                >
                  <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                  <span className="nav-text">{t('user.bookmarks')}</span>
                </button>
              </nav>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="profile-main">
            <Card variant="elevated" padding="none" className="content-card">
              {activeTab === 'info' && (
                <div className="content-section">
                  <div className="section-header">
                    <div>
                      <h2 className="section-title">{t('user.personal_info')}</h2>
                      <p className="section-subtitle">{t('user.manage_personal_info')}</p>
                    </div>
                    {!isEditing && (
                      <Button onClick={() => setIsEditing(true)} variant="primary" size="medium">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        {t('common.edit')}
                      </Button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="edit-form-container">
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">{t('user.name')}</label>
                          <Input
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            placeholder={t('user.name')}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">{t('auth.email')}</label>
                          <Input
                            value={user.email}
                            disabled
                            placeholder={t('auth.email')}
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">{t('user.avatar_hint')}</label>
                        <AvatarUpload
                          currentAvatar={editForm.avatar_url || user.avatar_url}
                          userName={user.name || user.email}
                          onUpload={handleAvatarUpload}
                          disabled={false}
                          size="medium"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">{t('user.bio')}</label>
                        <Input
                          as="textarea"
                          rows={5}
                          value={editForm.bio}
                          onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                          placeholder={t('user.bio_placeholder')}
                        />
                      </div>
                      <div className="form-actions">
                        <Button onClick={handleUpdate} disabled={loading} variant="primary">
                          {loading ? <LoadingSpinner size="small" /> : t('common.save')}
                        </Button>
                        <Button variant="secondary" onClick={() => setIsEditing(false)} disabled={loading}>
                          {t('common.cancel')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="info-display">
                      <div className="info-row">
                        <div className="info-field">
                          <span className="field-label">{t('user.name')}</span>
                          <span className="field-value">{user.name || t('common.not_set')}</span>
                        </div>
                        <div className="info-field">
                          <span className="field-label">{t('auth.email')}</span>
                          <span className="field-value">{user.email}</span>
                        </div>
                      </div>
                      <div className="info-row full-width">
                        <div className="info-field">
                          <span className="field-label">{t('user.bio')}</span>
                          <span className="field-value bio-text">{user.bio || t('common.not_set')}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'posts' && (
                <div className="content-section">
                  <div className="section-header">
                    <div>
                      <h2 className="section-title">{t('user.my_posts')}</h2>
                      <p className="section-subtitle">{t('user.all_your_posts')}</p>
                    </div>
                  </div>
                  {loading ? (
                    <div className="loading-container">
                      <LoadingSpinner size="medium" />
                    </div>
                  ) : userPosts.length === 0 ? (
                    <div className="empty-state">
                      <svg className="empty-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                      <h3>{t('user.no_posts')}</h3>
                      <p>{t('user.start_sharing')}</p>
                      <Button onClick={() => navigate('/forum/create')} variant="primary">
                        {t('user.create_first_post')}
                      </Button>
                    </div>
                  ) : (
                    <div className="posts-grid">
                      {userPosts.map((post) => (
                        <div
                          key={post._id}
                          className="post-card"
                          onClick={() => navigate(`/forum/${post._id}`)}
                        >
                          <h3 className="post-title">{post.title}</h3>
                          <div className="post-info">
                            <div className="post-stats-group">
                              <span className="post-stat">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                                {post.answer_count}
                              </span>
                              <span className="post-stat">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                                {post.view_count || 0}
                              </span>
                            </div>
                            <span className="post-date">{formatDate(post.created_at, i18n.language)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'bookmarks' && (
                <div className="content-section">
                  <div className="section-header">
                    <div>
                      <h2 className="section-title">{t('user.bookmarks')}</h2>
                      <p className="section-subtitle">{t('user.saved_posts')}</p>
                    </div>
                  </div>
                  {loading ? (
                    <div className="loading-container">
                      <LoadingSpinner size="medium" />
                    </div>
                  ) : bookmarkedPosts.length === 0 ? (
                    <div className="empty-state">
                      <svg className="empty-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                      <h3>{t('user.no_bookmarks')}</h3>
                      <p>{t('user.you_have_no_saved_posts')}</p>
                    </div>
                  ) : (
                    <div className="posts-grid">
                      {bookmarkedPosts.map((post) => (
                        <div
                          key={post._id}
                          className="post-card"
                          onClick={() => navigate(`/forum/${post._id}`)}
                        >
                          <h3 className="post-title">{post.title}</h3>
                          <div className="post-info">
                            <div className="post-stats-group">
                              <span className="post-stat">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                                {post.answer_count}
                              </span>
                              <span className="post-stat">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                                {post.view_count || 0}
                              </span>
                            </div>
                            <span className="post-date">{formatDate(post.created_at, i18n.language)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          </main>
        </div>
      </Container>
    </div>
  );
};

export default ProfilePage;
