import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { adminApi } from '../api/adminApi';
import { Container, Card, Button, Input, LoadingSpinner } from '../components/ui';
import './UserManagement.css';

/**
 * UserManagement - Trang quản lý người dùng cho admin
 */
const UserManagement = () => {
  const { t, i18n } = useTranslation();
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all', // all, active, locked
    role: 'all' // all, admin, user
  });

  useEffect(() => {
    // Check if user is admin
    if (!isAuthenticated || user?.role !== 'admin') {
      toast.error(t('admin.access_denied'));
      navigate('/home');
      return;
    }

    fetchUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filters, users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getAllUsers({ limit: 100 });
      const userData = response.users || [];

      // Map API response to include post_count and is_active (converted from status field)
      // Backend returns 'status' field with values 'active' or 'locked'
      const mappedUsers = userData.map(user => ({
        ...user,
        id: user._id || user.id,
        post_count: user.post_count || 0,
        // Convert status field ('active'/'locked') to is_active boolean
        is_active: user.status === 'active' || (user.status === undefined && user.is_active !== false)
      }));

      setUsers(mappedUsers);
      setFilteredUsers(mappedUsers);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error(t('admin.fetch_users_error'));
      // Empty array on error
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(user =>
        filters.status === 'active' ? user.is_active : !user.is_active
      );
    }

    // Role filter
    if (filters.role !== 'all') {
      filtered = filtered.filter(user => user.role === filters.role);
    }

    setFilteredUsers(filtered);
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      // Try to use admin endpoint first, fallback to update user
      try {
        await adminApi.updateUserStatus(userId, !currentStatus);
      } catch (adminError) {
        // If admin endpoint doesn't exist, use regular update
        await adminApi.updateUser(userId, { is_active: !currentStatus });
      }
      toast.success(t('admin.user_status_updated'));
      fetchUsers();
    } catch (error) {
      console.error('Failed to update user status:', error);
      toast.error(t('admin.user_status_update_error'));
    }
  };

  const handleViewDetails = (userId) => {
    navigate(`/admin/users/${userId}`);
  };

  const getRoleLabel = (role) => {
    const roleMap = {
      admin: t('admin.role_admin'),
      user: t('admin.role_user')
    };
    return roleMap[role] || role;
  };

  const getStatusLabel = (isActive) => {
    return isActive ? t('admin.status_active') : t('admin.status_locked');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="user-management loading-container">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="user-management">
      <Container size="large">
        {/* Header */}
        <div className="user-management-header">
          <h1 className="page-title">{t('admin.user_management')}</h1>
        </div>

        <Card className="user-management-card">
          {/* Search and Filter Section */}
          <div className="search-filter-section">
            <div className="search-box">
              <Input
                type="text"
                placeholder={t('admin.search_users_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </span>
            </div>

            <div className="filter-container">
              <Button
                variant="outlined"
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="filter-btn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                {t('admin.filter')}
              </Button>

              {showFilterMenu && (
                <div className="filter-menu">
                  <div className="filter-group">
                    <label>{t('admin.filter_status')}</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    >
                      <option value="all">{t('admin.all')}</option>
                      <option value="active">{t('admin.status_active')}</option>
                      <option value="locked">{t('admin.status_locked')}</option>
                    </select>
                  </div>

                  <div className="filter-group">
                    <label>{t('admin.filter_role')}</label>
                    <select
                      value={filters.role}
                      onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                    >
                      <option value="all">{t('admin.all')}</option>
                      <option value="admin">{t('admin.role_admin')}</option>
                      <option value="user">{t('admin.role_user')}</option>
                    </select>
                  </div>

                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => {
                      setFilters({ status: 'all', role: 'all' });
                      setShowFilterMenu(false);
                    }}
                  >
                    {t('admin.clear_filters')}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Users Table */}
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>{t('admin.name')}</th>
                  <th>{t('admin.email')}</th>
                  <th>{t('admin.role')}</th>
                  <th>{t('admin.status')}</th>
                  <th>{t('admin.post_count')}</th>
                  <th>{t('admin.registration_date')}</th>
                  <th>{t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="no-users">
                      {t('admin.no_users_found')}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const userId = user.id || user._id;
                    return (
                      <tr
                        key={userId}
                        className="user-row"
                        onClick={() => handleViewDetails(userId)}
                      >
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`role-badge role-${user.role}`}>
                            {getRoleLabel(user.role)}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${user.is_active ? 'active' : 'locked'}`}>
                            {getStatusLabel(user.is_active)}
                          </span>
                        </td>
                        <td>{user.post_count || 0}</td>
                        <td>{formatDate(user.created_at)}</td>
                        <td className="actions-cell">
                          <Button
                            variant="ghost"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(userId);
                            }}
                            className="action-btn detail-btn"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </Button>
                          <Button
                            variant="ghost"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleUserStatus(userId, user.is_active);
                            }}
                            className="action-btn lock-btn"
                          >
                            {user.is_active ? (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                              </svg>
                            ) : (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                              </svg>
                            )}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </Container>
    </div>
  );
};

export default UserManagement;
