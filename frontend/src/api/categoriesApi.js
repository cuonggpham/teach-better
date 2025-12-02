import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const categoriesApi = {
  // Get all categories
  getCategories: async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get all tags
  getTags: async () => {
    try {
      const response = await axios.get(`${API_URL}/tags`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new category or tag
  createCategory: async (data) => {
    try {
      const response = await axios.post(`${API_URL}/categories`, data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update category or tag
  updateCategory: async (id, data) => {
    try {
      const response = await axios.put(`${API_URL}/categories/${id}`, data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete category or tag (soft delete)
  deleteCategory: async (id, softDelete = true) => {
    try {
      const response = await axios.delete(`${API_URL}/categories/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        data: {
          soft_delete: softDelete
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get category by ID
  getCategoryById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/categories/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export { categoriesApi };