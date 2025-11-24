const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

/**
 * Get notifications for current user
 */
export const getNotifications = async (token, params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.skip) queryParams.append('skip', params.skip);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.unread_only) queryParams.append('unread_only', params.unread_only);

  const response = await fetch(`${API_URL}/notifications?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to fetch notifications');
  }

  return data;
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (token) => {
  const response = await fetch(`${API_URL}/notifications/unread-count`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to fetch unread count');
  }

  return data.count || 0;
};

/**
 * Mark notification as read
 */
export const markAsRead = async (token, notificationId) => {
  const response = await fetch(`${API_URL}/notifications/${notificationId}/mark-read`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to mark notification as read');
  }

  return data;
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (token) => {
  const response = await fetch(`${API_URL}/notifications/mark-all-read`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to mark all as read');
  }

  return data;
};

