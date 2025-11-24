const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

/**
 * Get user's bookmarked posts
 */
export const getBookmarks = async (token) => {
  const response = await fetch(`${API_URL}/bookmarks`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to fetch bookmarks');
  }

  return data;
};

/**
 * Add a bookmark
 */
export const addBookmark = async (token, postId) => {
  const response = await fetch(`${API_URL}/bookmarks/${postId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to add bookmark');
  }

  return data;
};

/**
 * Remove a bookmark
 */
export const removeBookmark = async (token, postId) => {
  const response = await fetch(`${API_URL}/bookmarks/${postId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to remove bookmark');
  }

  return data;
};
