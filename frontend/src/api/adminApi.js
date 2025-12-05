import axios from './axiosConfig';

export const adminApi = {
    // Category management
    getCategories: async (includeInactive = false) => {
        const response = await axios.get('/admin/categories', {
            params: {
                include_inactive: includeInactive
            }
        });
        return response;
    },

    createCategory: async (categoryData) => {
        const response = await axios.post('/admin/categories', categoryData);
        return response;
    },

    updateCategory: async (categoryId, categoryData) => {
        const response = await axios.put(`/admin/categories/${categoryId}`, categoryData);
        return response;
    },

    toggleCategoryStatus: async (categoryId) => {
        const response = await axios.patch(`/admin/categories/${categoryId}/toggle`);
        return response;
    },

    // Tag management
    getTags: async (includeInactive = false) => {
        const response = await axios.get('/admin/tags', {
            params: {
                include_inactive: includeInactive
            }
        });
        return response;
    },

    createTag: async (tagData) => {
        const response = await axios.post('/admin/tags', tagData);
        return response;
    },

    updateTag: async (tagId, tagData) => {
        const response = await axios.put(`/admin/tags/${tagId}`, tagData);
        return response;
    },

    toggleTagStatus: async (tagId) => {
        const response = await axios.patch(`/admin/tags/${tagId}/toggle`);
        return response;
    },

    // Combined category/tag operations
    getCategoriesAndTags: async (includeInactive = false) => {
        const [categoriesResponse, tagsResponse] = await Promise.all([
            adminApi.getCategories(includeInactive),
            adminApi.getTags(includeInactive)
        ]);

        return {
            categories: categoriesResponse.data || [],
            tags: tagsResponse.data || []
        };
    },

    // Dashboard statistics
    getAdminStats: async () => {
        const response = await axios.get('/admin/stats');
        return response;
    },

    // Recent activities
    getRecentActivities: async (limit = 10) => {
        const response = await axios.get('/admin/activities', {
            params: { limit }
        });
        return response;
    },

    // User registration chart
    getUserRegistrationChart: async (days = 7) => {
        const response = await axios.get('/admin/charts/user-registrations', {
            params: { days }
        });
        return response;
    },

    // Posts by category chart
    getPostsByCategoryChart: async () => {
        const response = await axios.get('/admin/charts/posts-by-category');
        return response;
    },

    // User management - Using real API endpoints
    getAllUsers: async (params = {}) => {
        // Using /api/v1/users/ endpoint
        const response = await axios.get('/users/', { 
            params: {
                skip: params.skip || 0,
                limit: params.limit || 100
            }
        });
        return response;
    },

    getUserById: async (userId) => {
        // Using /api/v1/users/{user_id} endpoint
        const response = await axios.get(`/users/${userId}`);
        return response;
    },

    updateUser: async (userId, userData) => {
        // Using /api/v1/users/{user_id} endpoint
        const response = await axios.put(`/users/${userId}`, userData);
        return response;
    },

    deleteUser: async (userId) => {
        // Using /api/v1/users/{user_id} endpoint
        const response = await axios.delete(`/users/${userId}`);
        return response;
    },

    // Note: These endpoints need to be created in backend for admin-specific actions
    updateUserStatus: async (userId, isActive) => {
        // This will need a new backend endpoint: PATCH /admin/users/{user_id}/status
        const response = await axios.patch(`/admin/users/${userId}/status`, {
            is_active: isActive
        });
        return response;
    },

    updateUserRole: async (userId, role) => {
        // This will need a new backend endpoint: PATCH /admin/users/{user_id}/role
        const response = await axios.patch(`/admin/users/${userId}/role`, {
            role
        });
        return response;
    },

    // Get user posts
    getUserPosts: async (userId, params = {}) => {
        // Using /api/v1/posts/ endpoint with author_id filter
        const response = await axios.get('/posts/', {
            params: {
                author_id: userId,
                skip: params.skip || 0,
                limit: params.limit || 100,
                sort_by: params.sort_by || 'created_at',
                sort_order: params.sort_order || -1
            }
        });
        return response;
    }
};