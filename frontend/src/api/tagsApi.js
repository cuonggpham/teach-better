import axiosInstance from './axiosConfig';

/**
 * Get all tags with optional search
 * @param {number} skip - Number of tags to skip
 * @param {number} limit - Maximum number of tags to return
 * @param {string} search - Optional search query
 * @returns {Promise<Object>} Tags data with total count
 */
export const getTags = async (skip = 0, limit = 100, search = null) => {
  try {
    const params = { skip, limit };
    if (search) {
      params.search = search;
    }
    const response = await axiosInstance.get('/tags/', { params });
    return response;
  } catch (error) {
    console.error('Error fetching tags:', error);
    throw error;
  }
};

/**
 * Get popular tags (most used)
 * @param {number} limit - Maximum number of tags to return
 * @returns {Promise<Object>} Popular tags data
 */
export const getPopularTags = async (limit = 20) => {
  try {
    const response = await axiosInstance.get('/tags/popular/list', {
      params: { limit }
    });
    return response;
  } catch (error) {
    console.error('Error fetching popular tags:', error);
    throw error;
  }
};

/**
 * Get tag by ID
 * @param {string} tagId - Tag ID
 * @returns {Promise<Object>} Tag data
 */
export const getTagById = async (tagId) => {
  try {
    const response = await axiosInstance.get(`/tags/${tagId}`);
    return response;
  } catch (error) {
    console.error('Error fetching tag:', error);
    throw error;
  }
};

/**
 * Create a new tag
 * @param {string} token - Authentication token
 * @param {Object} tagData - Tag data {name, description}
 * @returns {Promise<Object>} Created tag
 */
export const createTag = async (token, tagData) => {
  try {
    const response = await axiosInstance.post('/tags/', tagData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
  } catch (error) {
    console.error('Error creating tag:', error);
    throw error;
  }
};

/**
 * Update tag
 * @param {string} token - Authentication token
 * @param {string} tagId - Tag ID
 * @param {Object} tagData - Updated tag data
 * @returns {Promise<Object>} Updated tag
 */
export const updateTag = async (token, tagId, tagData) => {
  try {
    const response = await axiosInstance.put(`/tags/${tagId}`, tagData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
  } catch (error) {
    console.error('Error updating tag:', error);
    throw error;
  }
};

/**
 * Delete tag
 * @param {string} token - Authentication token
 * @param {string} tagId - Tag ID
 * @returns {Promise<void>}
 */
export const deleteTag = async (token, tagId) => {
  try {
    await axiosInstance.delete(`/tags/${tagId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error('Error deleting tag:', error);
    throw error;
  }
};
