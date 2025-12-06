import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { adminApi } from '../api/adminApi';
import { Container, Card, LoadingSpinner } from '../components/ui';
import './AdminDashboard.css';

/**
 * AdminDashboard - Trang quản trị chính cho admin
 */
const AdminDashboard = () => {
  const { t, i18n } = useTranslation();
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [userChart, setUserChart] = useState([]);
  const [categoryChart, setCategoryChart] = useState([]);

  useEffect(() => {
    // Check if user is admin
    if (!isAuthenticated || user?.role !== 'admin') {
      toast.error(t('admin.access_denied'));
      navigate('/home');
      return;
    }

    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, activitiesRes, userChartRes, categoryChartRes] = await Promise.all([
        adminApi.getAdminStats(),
        adminApi.getRecentActivities(5),
        adminApi.getUserRegistrationChart(7),
        adminApi.getPostsByCategoryChart()
      ]);

      // Note: axiosConfig already returns response.data, so no need to access .data again
      setStats(statsRes);
      setActivities(activitiesRes || []);
      setUserChart(userChartRes || []);
      setCategoryChart(categoryChartRes || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error(t('admin.fetch_error'));
      // Set empty data on error
      setStats({
        total_users: 0,
        user_growth: 0,
        total_posts: 0,
        post_growth: 0,
        total_comments: 0,
        comment_growth: 0,
        total_diagnoses: 0,
        diagnosis_growth: 0
      });
      setActivities([]);
      setUserChart([]);
      setCategoryChart([]);
    } finally {
      setLoading(false);
    }
  };

  const quickAccessItems = [
    {
      icon: '👥',
      label: t('admin.user_management'),
      path: '/admin/users'
    },
    {
      icon: '📄',
      label: t('admin.content_management'),
      path: '/admin/posts'
    },
    {
      icon: '📁',
      label: t('admin.category_management'),
      path: '/admin/categories'
    },
    {
      icon: '⚙️',
      label: t('admin.settings'),
      path: '/admin/settings'
    }
  ];

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 60) {
      return `${minutes}${t('admin.minutes_ago')}`;
    }
    if (hours < 24) {
      return `${hours}${t('admin.hours_ago')}`;
    }
    return date.toLocaleDateString(i18n.language);
  };

  if (loading) {
    return (
      <div className="admin-dashboard loading-container">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <Container size="large">
        <h1 className="admin-dashboard-title">{t('admin.dashboard_title')}</h1>

        {/* Section 1: Stats Cards */}
        <div className="stats-grid">
          <Card className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-label">{t('admin.total_users')}</div>
              <div className="stat-value">{stats?.total_users?.toLocaleString() || 0}</div>
              <div className={`stat-growth ${stats?.user_growth >= 0 ? 'positive' : 'negative'}`}>
                {t('admin.previous_week')} {stats?.user_growth >= 0 ? '+' : ''}{stats?.user_growth || 0}%
              </div>
            </div>
          </Card>

          <Card className="stat-card">
            <div className="stat-icon">📄</div>
            <div className="stat-content">
              <div className="stat-label">{t('admin.total_posts')}</div>
              <div className="stat-value">{stats?.total_posts?.toLocaleString() || 0}</div>
              <div className={`stat-growth ${stats?.post_growth >= 0 ? 'positive' : 'negative'}`}>
                {t('admin.previous_week')} {stats?.post_growth >= 0 ? '+' : ''}{stats?.post_growth || 0}%
              </div>
            </div>
          </Card>

          <Card className="stat-card">
            <div className="stat-icon">💬</div>
            <div className="stat-content">
              <div className="stat-label">{t('admin.total_comments')}</div>
              <div className="stat-value">{stats?.total_comments?.toLocaleString() || 0}</div>
              <div className={`stat-growth ${stats?.comment_growth >= 0 ? 'positive' : 'negative'}`}>
                {t('admin.previous_week')} {stats?.comment_growth >= 0 ? '+' : ''}{stats?.comment_growth || 0}%
              </div>
            </div>
          </Card>

          <Card className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-label">{t('admin.ai_diagnoses')}</div>
              <div className="stat-value">{stats?.total_diagnoses?.toLocaleString() || 0}</div>
              <div className={`stat-growth ${stats?.diagnosis_growth >= 0 ? 'positive' : 'negative'}`}>
                {t('admin.previous_week')} {stats?.diagnosis_growth >= 0 ? '+' : ''}{stats?.diagnosis_growth || 0}%
              </div>
            </div>
          </Card>
        </div>

        {/* Section 2: Quick Access */}
        <Card className="quick-access-section">
          <h2 className="section-title">{t('admin.quick_access')}</h2>
          <div className="quick-access-grid">
            {quickAccessItems.map((item, index) => (
              <button
                key={index}
                className="quick-access-button"
                onClick={() => navigate(item.path)}
              >
                <span className="quick-access-icon">{item.icon}</span>
                <span className="quick-access-label">{item.label}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Section 3: Charts */}
        <div className="charts-grid">
          {/* User Registration Chart */}
          <Card className="chart-card">
            <h2 className="section-title">{t('admin.new_user_registrations')}</h2>
            <div className="line-chart">
              <svg width="100%" height="200" viewBox="0 0 400 200" preserveAspectRatio="none">
                <polyline
                  fill="none"
                  stroke="#4A90E2"
                  strokeWidth="2"
                  points={userChart.map((point, index) => {
                    const x = (index / (userChart.length - 1)) * 400;
                    const maxCount = Math.max(...userChart.map(p => p.count));
                    const y = 180 - (point.count / maxCount) * 160;
                    return `${x},${y}`;
                  }).join(' ')}
                />
                {userChart.map((point, index) => {
                  const x = (index / (userChart.length - 1)) * 400;
                  const maxCount = Math.max(...userChart.map(p => p.count));
                  const y = 180 - (point.count / maxCount) * 160;
                  return (
                    <circle key={index} cx={x} cy={y} r="4" fill="#4A90E2" />
                  );
                })}
              </svg>
              <div className="chart-labels">
                {userChart.map((point, index) => (
                  <div key={index} className="chart-label">
                    {new Date(point.date).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Category Distribution Chart */}
          <Card className="chart-card">
            <h2 className="section-title">{t('admin.category_distribution')}</h2>
            <div className="bar-chart">
              {categoryChart.map((item, index) => {
                const maxCount = Math.max(...categoryChart.map(c => c.count));
                const height = (item.count / maxCount) * 100;
                return (
                  <div key={index} className="bar-group">
                    <div className="bar-container">
                      <div 
                        className="bar" 
                        style={{ height: `${height}%` }}
                        title={`${item.category}: ${item.count}`}
                      >
                        <span className="bar-value">{item.count}</span>
                      </div>
                    </div>
                    <div className="bar-label">{item.category}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Section 4: Recent Activities */}
        <Card className="activities-section">
          <h2 className="section-title">{t('admin.recent_activities')}</h2>
          <div className="activities-list">
            {activities.length === 0 ? (
              <div className="no-activities">{t('admin.no_recent_activities')}</div>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-icon">
                    {activity.type === 'user_registration' && '👤'}
                    {activity.type === 'post' && '📝'}
                    {activity.type === 'comment' && '💬'}
                    {activity.type === 'report' && '⚠️'}
                  </div>
                  <div className="activity-content">
                    <div className="activity-user">{activity.user_name}</div>
                    <div className="activity-description">{activity.description}</div>
                  </div>
                  <div className="activity-time">{formatTimeAgo(activity.created_at)}</div>
                </div>
              ))
            )}
          </div>
        </Card>
      </Container>
    </div>
  );
};

export default AdminDashboard;
