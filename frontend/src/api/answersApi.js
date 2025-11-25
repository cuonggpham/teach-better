const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

/**
 * Get all answers for a post
 */
export const getAnswers = async (postId, token, params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.skip) queryParams.append('skip', params.skip);
  if (params.limit) queryParams.append('limit', params.limit);

  const response = await fetch(`${API_URL}/answers/post/${postId}?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && {
        Authorization: `Bearer ${token}`
      }),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to fetch answers');
  }

  return data;
};

/**
 * Create a new answer
 */
export const createAnswer = async (token, answerData) => {
  const response = await fetch(`${API_URL}/answers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(answerData),
  });

  const data = await response.json();

  if (!response.ok) {
    // FastAPI validation errors return detail as array
    let errorMessage = 'Failed to create answer';
    if (data.detail) {
      if (Array.isArray(data.detail)) {
        // Extract first validation error message
        errorMessage = data.detail[0]?.msg || data.detail[0]?.message || errorMessage;
      } else if (typeof data.detail === 'string') {
        errorMessage = data.detail;
      }
    }
    throw new Error(errorMessage);
  }

  return data;
};

/**
 * Vote on an answer
 */
export const voteAnswer = async (token, answerId, isUpvote) => {
  const response = await fetch(
    `${API_URL}/answers/${answerId}/vote?is_upvote=${isUpvote}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to vote on answer');
  }

  return data;
};

/**
 * Add a comment to an answer
 */
export const addComment = async (token, answerId, commentData) => {
  const response = await fetch(`${API_URL}/answers/${answerId}/comments`, {
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
 * Delete a comment
 */
export const deleteComment = async (token, answerId, commentId) => {
  const response = await fetch(`${API_URL}/answers/${answerId}/comments/${commentId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to delete comment');
  }

  return data;
};