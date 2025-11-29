import axiosInstance from './axiosConfig';

/**
 * Get all categories
 * @param {object} params - Query parameters
 * @returns {Promise}
 */
export const getCategories = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/categories/', {
      params,
    });
    // axiosInstance already returns response.data from interceptor
    return response;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

/**
 * Get popular categories
 * @param {number} limit - Limit
 * @returns {Promise}
 */
export const getPopularCategories = async (limit = 10) => {
  try {
    const response = await axiosInstance.get('/categories/popular', {
      params: { limit },
    });
    return response;
  } catch (error) {
    console.error('Error fetching popular categories:', error);
    throw error;
  }
};

/**
 * Get category by ID
 * @param {string} categoryId - Category ID
 * @returns {Promise}
 */
export const getCategoryById = async (categoryId) => {
  try {
    const response = await axiosInstance.get(`/categories/${categoryId}`);
    return response;
  } catch (error) {
    console.error('Error fetching category:', error);
    throw error;
  }
};

/**
 * Create a new category
 * @param {string} token - JWT token
 * @param {object} categoryData - Category data
 * @returns {Promise}
 */
export const createCategory = async (token, categoryData) => {
  try {
    const response = await axiosInstance.post('/categories/', categoryData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

/**
 * Update category
 * @param {string} token - JWT token
 * @param {string} categoryId - Category ID
 * @param {object} categoryData - Category data
 * @returns {Promise}
 */
export const updateCategory = async (token, categoryId, categoryData) => {
  try {
    const response = await axiosInstance.put(`/categories/${categoryId}`, categoryData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

/**
 * Delete category
 * @param {string} token - JWT token
 * @param {string} categoryId - Category ID
 * @returns {Promise}
 */
export const deleteCategory = async (token, categoryId) => {
  try {
    const response = await axiosInstance.delete(`/categories/${categoryId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};
