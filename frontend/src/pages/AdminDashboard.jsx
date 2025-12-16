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
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      label: t('admin.user_management'),
      path: '/admin/users'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
      label: t('admin.content_management'),
      path: '/admin/posts'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      ),
      label: t('admin.category_management'),
      path: '/admin/categories'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
      label: t('admin.settings'),
      path: '/admin/settings'
    }
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_registration':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        );
      case 'post':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        );
      case 'comment':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        );
      case 'report':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        );
    }
  };

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
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-label">{t('admin.total_users')}</div>
              <div className="stat-value">{stats?.total_users?.toLocaleString() || 0}</div>
              <div className={`stat-growth ${stats?.user_growth >= 0 ? 'positive' : 'negative'}`}>
                {t('admin.previous_week')} {stats?.user_growth >= 0 ? '+' : ''}{stats?.user_growth || 0}%
              </div>
            </div>
          </Card>

          <Card className="stat-card">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-label">{t('admin.total_posts')}</div>
              <div className="stat-value">{stats?.total_posts?.toLocaleString() || 0}</div>
              <div className={`stat-growth ${stats?.post_growth >= 0 ? 'positive' : 'negative'}`}>
                {t('admin.previous_week')} {stats?.post_growth >= 0 ? '+' : ''}{stats?.post_growth || 0}%
              </div>
            </div>
          </Card>

          <Card className="stat-card">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-label">{t('admin.total_comments')}</div>
              <div className="stat-value">{stats?.total_comments?.toLocaleString() || 0}</div>
              <div className={`stat-growth ${stats?.comment_growth >= 0 ? 'positive' : 'negative'}`}>
                {t('admin.previous_week')} {stats?.comment_growth >= 0 ? '+' : ''}{stats?.comment_growth || 0}%
              </div>
            </div>
          </Card>

          <Card className="stat-card">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
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
              {userChart.length === 0 ? (
                <div className="no-chart-data">{t('admin.no_data_available')}</div>
              ) : (
                <>
                  <svg width="100%" height="200" viewBox="0 0 400 200" preserveAspectRatio="none">
                    {(() => {
                      const maxCount = Math.max(...userChart.map(p => p.count), 1);
                      const dataLength = userChart.length > 1 ? userChart.length - 1 : 1;
                      return (
                        <>
                          <polyline
                            fill="none"
                            stroke="#ec407a"
                            strokeWidth="2"
                            points={userChart.map((point, index) => {
                              const x = (index / dataLength) * 400;
                              const y = 180 - (point.count / maxCount) * 160;
                              return `${x},${y}`;
                            }).join(' ')}
                          />
                          {userChart.map((point, index) => {
                            const x = (index / dataLength) * 400;
                            const y = 180 - (point.count / maxCount) * 160;
                            return (
                              <circle key={index} cx={x} cy={y} r="4" fill="#d81b60" />
                            );
                          })}
                        </>
                      );
                    })()}
                  </svg>
                  <div className="chart-labels">
                    {userChart.map((point, index) => (
                      <div key={index} className="chart-label">
                        {new Date(point.date).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })}
                      </div>
                    ))}
                  </div>
                </>
              )}
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
                    {getActivityIcon(activity.type)}
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
