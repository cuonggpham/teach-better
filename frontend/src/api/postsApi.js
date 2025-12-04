const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

/**
 * Get all posts
 */
export const getPosts = async (token, params = {}) => {
  const queryParams = new URLSearchParams();

  if (params.skip) queryParams.append('skip', params.skip);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.status_filter) queryParams.append('status_filter', params.status_filter);
  if (params.author_id) queryParams.append('author_id', params.author_id);
  if (params.sort_by) queryParams.append('sort_by', params.sort_by);
  if (params.sort_order) queryParams.append('sort_order', params.sort_order);
  if (params.search) queryParams.append('search', params.search);
  if (params.category) queryParams.append('category', params.category);
  if (params.tag_ids && Array.isArray(params.tag_ids)) {
    params.tag_ids.forEach(tagId => queryParams.append('tag_ids', tagId));
  }

  const response = await fetch(`${API_URL}/posts?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to fetch posts');
  }

  return data;
};

/**
 * Get a post by ID
 */
export const getPost = async (postId, token) => {
  const response = await fetch(`${API_URL}/posts/${postId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to fetch post');
  }

  return data;
};

/**
 * Create a new post
 */
export const createPost = async (token, postData) => {
  const response = await fetch(`${API_URL}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(postData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to create post');
  }

  return data;
};

/**
 * Update a post
 */
export const updatePost = async (token, postId, postData) => {
  const response = await fetch(`${API_URL}/posts/${postId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(postData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to update post');
  }

  return data;
};

/**
 * Delete a post
 */
export const deletePost = async (token, postId) => {
  const response = await fetch(`${API_URL}/posts/${postId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to delete post');
  }

  return true;
};

/**
 * Vote on a post
 */
export const votePost = async (token, postId, isUpvote) => {
  const response = await fetch(
    `${API_URL}/posts/${postId}/vote?is_upvote=${isUpvote}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to vote on post');
  }

  return data;
};

/**
 * Get comments for a post
 */
export const getPostComments = async (postId, token) => {
  const response = await fetch(`${API_URL}/posts/${postId}/comments`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to fetch comments');
  }

  return data;
};

/**
 * Add comment to post
 */
export const addComment = async (token, postId, commentData) => {
  const response = await fetch(`${API_URL}/posts/${postId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(commentData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to add comment');
  }

  return data;
};

/**
 * Update comment
 */
export const updateComment = async (token, postId, commentId, commentData) => {
  const response = await fetch(`${API_URL}/posts/${postId}/comments/${commentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(commentData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to update comment');
  }

  return data;
};

/**
 * Delete comment
 */
export const deleteComment = async (token, postId, commentId) => {
  const response = await fetch(`${API_URL}/posts/${postId}/comments/${commentId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to delete comment');
  }

  return true;
};