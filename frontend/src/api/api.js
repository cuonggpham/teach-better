import axiosInstance from './axiosConfig';

/**
 * API functions for authentication
 */

export const authApi = {
  // Sign up
  signup: async (userData) => {
    return await axiosInstance.post('/auth/signup', userData);
  },

  // Sign in
  signin: async (credentials) => {
    return await axiosInstance.post('/auth/signin', credentials);
  },

  // Get current user
  getCurrentUser: async () => {
    return await axiosInstance.get('/auth/me');
  },
};

/**
 * API functions for posts
 */

export const postsApi = {
  // Get all posts
  getPosts: async (params = {}) => {
    return await axiosInstance.get('/posts', { params });
  },

  // Get single post
  getPost: async (postId) => {
    return await axiosInstance.get(`/posts/${postId}`);
  },

  // Create post
  createPost: async (postData) => {
    return await axiosInstance.post('/posts', postData);
  },

  // Update post
  updatePost: async (postId, postData) => {
    return await axiosInstance.put(`/posts/${postId}`, postData);
  },

  // Delete post
  deletePost: async (postId) => {
    return await axiosInstance.delete(`/posts/${postId}`);
  },

  // Vote post
  votePost: async (postId, voteType) => {
    return await axiosInstance.post(`/posts/${postId}/vote`, { vote_type: voteType });
  },

  // Bookmark post
  bookmarkPost: async (postId) => {
    return await axiosInstance.post(`/posts/${postId}/bookmark`);
  },

  // Get answers for a post
  getAnswers: async (postId) => {
    return await axiosInstance.get(`/posts/${postId}/answers`);
  },

  // Create answer
  createAnswer: async (postId, answerData) => {
    return await axiosInstance.post(`/posts/${postId}/answers`, answerData);
  },

  // Add comment to answer
  addComment: async (postId, answerId, commentData) => {
    return await axiosInstance.post(`/posts/${postId}/answers/${answerId}/comments`, commentData);
  },
};

/**
 * API functions for notifications
 */

export const notificationsApi = {
  // Get all notifications
  getNotifications: async (params = {}) => {
    return await axiosInstance.get('/notifications', { params });
  },

  // Get notification count
  getNotificationCount: async () => {
    return await axiosInstance.get('/notifications/count');
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    return await axiosInstance.put(`/notifications/${notificationId}`, { is_read: true });
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    return await axiosInstance.put('/notifications/mark-all-read');
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    return await axiosInstance.delete(`/notifications/${notificationId}`);
  },
};
