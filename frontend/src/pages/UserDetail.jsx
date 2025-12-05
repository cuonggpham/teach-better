import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { adminApi } from '../api/adminApi';
import { Container, Card, Button, LoadingSpinner } from '../components/ui';
import './UserDetail.css';

/**
 * UserDetail - Trang chi tiết người dùng cho admin
 */
const UserDetail = () => {
  const { t, i18n } = useTranslation();
  const { userId } = useParams();
  const { user: currentUser, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    // Check if user is admin
    if (!isAuthenticated || currentUser?.role !== 'admin') {
      toast.error(t('admin.access_denied'));
      navigate('/home');
      return;
    }

    fetchUserDetail();
  }, [userId]);

  const fetchUserDetail = async () => {
    setLoading(true);
    try {
      // Fetch user detail and posts in parallel
      const [userResponse, postsResponse] = await Promise.all([
        adminApi.getUserById(userId),
        adminApi.getUserPosts(userId, { limit: 50 })
      ]);
      
      const userData = userResponse.data;
      const postsData = postsResponse.data;
      
      // Map user data
      const mappedUser = {
        ...userData,
        id: userData._id || userData.id,
        post_count: userData.post_count || 0,
        comment_count: userData.comment_count || 0,
        is_active: userData.is_active !== undefined ? userData.is_active : true,
        last_login: userData.last_login || userData.updated_at || userData.created_at
      };
      
      setUser(mappedUser);
      
      // Map posts data
      const posts = postsData.posts || postsData || [];
      const mappedPosts = posts.map(post => ({
        ...post,
        id: post._id || post.id,
        category: post.category_name || post.category || t('common.not_set'),
        view_count: post.view_count || 0
      }));
      
      setUserPosts(mappedPosts);
    } catch (error) {
      console.error('Failed to fetch user detail:', error);
      toast.error(t('admin.fetch_user_error'));
      setUser(null);
      setUserPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    try {
      // Try to use admin endpoint first, fallback to update user
      try {
        await adminApi.updateUserStatus(userId, !user.is_active);
      } catch (adminError) {
        // If admin endpoint doesn't exist, use regular update
        await adminApi.updateUser(userId, { is_active: !user.is_active });
      }
      toast.success(t('admin.user_status_updated'));
      setUser({ ...user, is_active: !user.is_active });
    } catch (error) {
      console.error('Failed to update user status:', error);
      toast.error(t('admin.user_status_update_error'));
    }
  };

  const handleDeleteUser = async () => {
    if (!window.confirm(t('admin.confirm_delete_user'))) {
      return;
    }

    try {
      await adminApi.deleteUser(userId);
      toast.success(t('admin.user_deleted'));
      navigate('/admin/users');
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error(t('admin.user_delete_error'));
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString(i18n.language, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleLabel = (role) => {
    const roleMap = {
      admin: t('admin.role_admin'),
      user: t('admin.role_user'),
      moderator: t('admin.role_moderator')
    };
    return roleMap[role] || role;
  };

  if (loading) {
    return (
      <div className="user-detail loading-container">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="user-detail">
        <Container size="large">
          <Card>
            <p>{t('admin.user_not_found')}</p>
            <Button onClick={() => navigate('/admin/users')}>
              {t('common.back')}
            </Button>
          </Card>
        </Container>
      </div>
    );
  }

  return (
    <div className="user-detail">
      <Container size="large">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/users')}
          className="back-btn"
        >
          ← {t('admin.user_detail')}
        </Button>

        {/* Basic Information Card */}
        <Card className="user-info-card">
          <h2 className="section-title">{t('admin.basic_info')}</h2>
          
          <div className="user-info-content">
            {/* Avatar and Name */}
            <div className="user-profile-header">
              <div className="user-avatar">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} />
                ) : (
                  <div className="avatar-placeholder">
                    {user.name.charAt(0)}
                  </div>
                )}
              </div>
              
              <div className="user-identity">
                <h1 className="user-name">{user.name}</h1>
                <p className="user-email">{user.email}</p>
                <div className="user-badges">
                  <span className={`role-badge role-${user.role}`}>
                    {getRoleLabel(user.role)}
                  </span>
                  <span className={`status-badge ${user.is_active ? 'active' : 'locked'}`}>
                    {user.is_active ? t('admin.status_active') : t('admin.status_locked')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="user-actions">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setShowEditModal(true)}
                  className="action-btn edit-btn"
                  title={t('admin.edit')}
                >
                  ✏️
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleToggleStatus}
                  className="action-btn lock-btn"
                  title={user.is_active ? t('admin.lock') : t('admin.unlock')}
                >
                  {user.is_active ? '🔒' : '🔓'}
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleDeleteUser}
                  className="action-btn delete-btn"
                  title={t('admin.delete')}
                >
                  🗑️
                </Button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="user-stats-grid">
              <div className="stat-item">
                <span className="stat-label">{t('admin.registration_date')}</span>
                <span className="stat-value">{formatDate(user.created_at)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">{t('admin.last_login')}</span>
                <span className="stat-value">{formatDateTime(user.last_login)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">{t('admin.post_count')}</span>
                <span className="stat-value">{user.post_count}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">{t('admin.comment_count')}</span>
                <span className="stat-value">{user.comment_count}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* User Posts Card */}
        <Card className="user-posts-card">
          <h2 className="section-title">{t('admin.user_posts')}</h2>
          
          <div className="posts-table-container">
            {userPosts.length === 0 ? (
              <div className="no-posts">
                {t('admin.no_posts')}
              </div>
            ) : (
              <table className="posts-table">
                <thead>
                  <tr>
                    <th>{t('admin.title')}</th>
                    <th>{t('admin.category')}</th>
                    <th>{t('admin.post_date')}</th>
                    <th>{t('admin.likes')}</th>
                  </tr>
                </thead>
                <tbody>
                  {userPosts.map((post) => (
                    <tr
                      key={post.id || post._id}
                      className="post-row"
                      onClick={() => navigate(`/forum/${post.id || post._id}`)}
                    >
                      <td className="post-title-cell">{post.title}</td>
                      <td>{post.category}</td>
                      <td>{formatDate(post.created_at)}</td>
                      <td>{post.view_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </Container>
    </div>
  );
};

export default UserDetail;
