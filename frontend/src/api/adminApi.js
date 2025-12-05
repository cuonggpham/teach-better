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

    deleteCategory: async (categoryId) => {
        const response = await axios.delete(`/admin/categories/${categoryId}`);
        return response;
    },

    deleteTag: async (tagId) => {
        const response = await axios.delete(`/admin/tags/${tagId}`);
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
    }
};