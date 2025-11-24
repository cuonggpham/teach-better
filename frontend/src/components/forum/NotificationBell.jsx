import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getNotifications, getUnreadCount, markAsRead } from '../../api/notificationsApi';
import { Card } from '../ui';
import './NotificationBell.css';

/**
 * NotificationBell Component - Icon bell với dropdown danh sách thông báo
 */
const NotificationBell = () => {
  const { t } = useTranslation();
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchUnreadCount();
      if (isOpen) {
        fetchNotifications();
      }
    }
  }, [isAuthenticated, token, isOpen]);

  useEffect(() => {
    // Auto refresh unread count every 30 seconds
    if (isAuthenticated && token) {
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    if (!token) return;
    try {
      const count = await getUnreadCount(token);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    if (!token || isLoading) return;
    setIsLoading(true);
    try {
      const data = await getNotifications(token, { limit: 10, unread_only: false });
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!token) return;

    // Mark as read if unread
    if (!notification.is_read) {
      try {
        await markAsRead(token, notification._id);
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) =>
          prev.map((n) => (n._id === notification._id ? { ...n, is_read: true } : n))
        );
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }

    // Navigate to link
    if (notification.link) {
      navigate(notification.link);
      setIsOpen(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t('notification.just_now');
    if (minutes < 60) return `${minutes} ${t('notification.minutes_ago')}`;
    if (hours < 24) return `${hours} ${t('notification.hours_ago')}`;
    if (days < 7) return `${days} ${t('notification.days_ago')}`;
    return date.toLocaleDateString('vi-VN');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button
        className="notification-bell-button"
        onClick={() => setIsOpen(!isOpen)}
        title={t('notification.title')}
      >
        🔔
        {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {isOpen && (
        <Card variant="elevated" padding="none" className="notification-dropdown">
          <div className="notification-header">
            <h3>{t('notification.title')}</h3>
            {unreadCount > 0 && (
              <span className="unread-count">{unreadCount} {t('notification.unread')}</span>
            )}
          </div>

          <div className="notification-list">
            {isLoading ? (
              <div className="notification-loading">{t('common.loading')}</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">{t('notification.no_notifications')}</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-content">
                    <p className="notification-message">{notification.message}</p>
                    <span className="notification-time">{formatDate(notification.created_at)}</span>
                  </div>
                  {!notification.is_read && <div className="notification-dot"></div>}
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default NotificationBell;

