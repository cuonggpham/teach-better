import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile } from '../api/authApi';
import { uploadImage } from '../api/imgbbApi';
import { getPosts } from '../api/postsApi';
import { getBookmarks } from '../api/bookmarksApi';
import { Container, Card, LoadingSpinner, Button, Input } from '../components/ui';
import { formatDate } from '../utils/formatters';
import './ProfilePage.css';

/**
 * Profile Management Page
 */
const ProfilePage = () => {
  const { t } = useTranslation();
  const { user, token, isAuthenticated, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');
  const [userPosts, setUserPosts] = useState([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    avatar_url: '',
  });

  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || '',
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
      // You might want to show a toast here, but for now we'll rely on the UI update
      alert(response.message);
    } catch (error) {
      console.error(error);
      alert(error.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    if (isEditing) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const imageUrl = await uploadImage(file);
      setEditForm(prev => ({ ...prev, avatar_url: imageUrl }));
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert(t('user.upload_failed', 'Failed to upload image'));
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (activeTab === 'posts' && userPosts.length === 0) {
      fetchUserPosts();
    } else if (activeTab === 'bookmarks' && bookmarkedPosts.length === 0) {
      fetchBookmarks();
    }
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
      <Container size="large">
        <Card variant="elevated" padding="none" className="profile-container">
          <div className="profile-header">
            <div className="profile-avatar">
              <div
                className={`avatar-wrapper ${isEditing ? 'editable' : ''}`}
                onClick={handleAvatarClick}
                style={{ cursor: isEditing ? 'pointer' : 'default', position: 'relative' }}
              >
                {uploading ? (
                  <div className="avatar-loading">
                    <LoadingSpinner size="small" />
                  </div>
                ) : (
                  <>
                    {(editForm.avatar_url || user.avatar_url) ? (
                      <img src={editForm.avatar_url || user.avatar_url} alt={user.name} />
                    ) : (
                      <div className="avatar-placeholder">
                        {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                      </div>
                    )}
                    {isEditing && (
                      <div className="avatar-overlay">
                        <span>{t('user.change_avatar', 'Change')}</span>
                      </div>
                    )}
                  </>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  accept="image/*"
                />
              </div>
            </div>
            <div className="profile-info">
              <h1>{user.name || user.email}</h1>
              <p className="profile-email">{user.email}</p>
              <p className="profile-role">
                {user.role === 'admin' ? t('user.roles.admin') : t('user.roles.user')}
              </p>
            </div>
          </div>

          <div className="profile-tabs">
            <button
              className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => setActiveTab('info')}
            >
              {t('user.profile')}
            </button>
            <button
              className={`tab-button ${activeTab === 'posts' ? 'active' : ''}`}
              onClick={() => setActiveTab('posts')}
            >
              {t('user.my_posts')} ({userPosts.length})
            </button>
            <button
              className={`tab-button ${activeTab === 'bookmarks' ? 'active' : ''}`}
              onClick={() => setActiveTab('bookmarks')}
            >
              {t('user.bookmarks')} ({bookmarkedPosts.length})
            </button>
          </div>

          <div className="profile-content">
            {activeTab === 'info' && (
              <div className="info-section">
                <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2>{t('user.personal_info')}</h2>
                  {!isEditing && (
                    <Button onClick={() => setIsEditing(true)}>
                      {t('user.update_profile', 'Update Info')}
                    </Button>
                  )}
                </div>

                {isEditing ? (
                  <div className="edit-form">
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('user.name')}</label>
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder={user.name}
                      />
                    </div>
                    <div className="form-actions" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                      <Button onClick={handleUpdate} disabled={loading}>
                        {loading ? <LoadingSpinner size="small" /> : t('common.save')}
                      </Button>
                      <Button variant="secondary" onClick={() => setIsEditing(false)} disabled={loading}>
                        {t('common.cancel')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="info-grid">
                    <Card variant="outlined" padding="medium" className="info-item">
                      <label>{t('user.name')}</label>
                      <span>{user.name || t('common.not_set')}</span>
                    </Card>
                    <Card variant="outlined" padding="medium" className="info-item">
                      <label>{t('auth.email', 'Email')}</label>
                      <span>{user.email}</span>
                    </Card>
                    <Card variant="outlined" padding="medium" className="info-item">
                      <label>{t('user.role')}</label>
                      <span>
                        {user.role === 'admin' ? t('user.roles.admin') : t('user.roles.user')}
                      </span>
                    </Card>
                    <Card variant="outlined" padding="medium" className="info-item">
                      <label>{t('user.joined_date')}</label>
                      <span>{user.created_at ? formatDate(user.created_at) : 'N/A'}</span>
                    </Card>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'posts' && (
              <div className="posts-section">
                <h2>{t('user.my_posts')}</h2>
                {loading ? (
                  <div className="loading-container">
                    <LoadingSpinner size="medium" />
                  </div>
                ) : userPosts.length === 0 ? (
                  <p className="empty-message">{t('user.no_posts')}</p>
                ) : (
                  <div className="posts-list">
                    {userPosts.map((post) => (
                      <Card
                        key={post._id}
                        variant="outlined"
                        padding="medium"
                        className="post-item"
                        onClick={() => navigate(`/forum/${post._id}`)}
                      >
                        <h3>{post.title}</h3>
                        <div className="post-meta">
                          <span className={`post-status ${post.status === 'open' ? 'status-open' : 'status-closed'}`}>
                            {post.status === 'open' ? t('post.status.open') : t('post.status.closed')}
                          </span>
                          <span className="post-stats">
                            {post.answer_count} {t('post.answers')} • {post.votes?.score || 0} {t('post.points')} • {post.view_count || 0} {t('post.views')}
                          </span>
                          <span className="post-date">{formatDate(post.created_at)}</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'bookmarks' && (
              <div className="bookmarks-section">
                <h2>{t('user.bookmarks')}</h2>
                {loading ? (
                  <div className="loading-container">
                    <LoadingSpinner size="medium" />
                  </div>
                ) : bookmarkedPosts.length === 0 ? (
                  <p className="empty-message">{t('user.no_bookmarks')}</p>
                ) : (
                  <div className="posts-list">
                    {bookmarkedPosts.map((post) => (
                      <Card
                        key={post._id}
                        variant="outlined"
                        padding="medium"
                        className="post-item"
                        onClick={() => navigate(`/forum/${post._id}`)}
                      >
                        <h3>{post.title}</h3>
                        <div className="post-meta">
                          <span className={`post-status ${post.status === 'open' ? 'status-open' : 'status-closed'}`}>
                            {post.status === 'open' ? t('post.status.open') : t('post.status.closed')}
                          </span>
                          <span className="post-stats">
                            {post.answer_count} {t('post.answers')} • {post.votes?.score || 0} {t('post.points')} • {post.view_count || 0} {t('post.views')}
                          </span>
                          <span className="post-date">{formatDate(post.created_at)}</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </Container>
    </div>
  );
};

export default ProfilePage;
