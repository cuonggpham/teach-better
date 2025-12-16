import axiosInstance from './axiosConfig';

/**
 * API cho user public info
 */

/**
 * Lấy thông tin public của user (cho popup)
 * @param {string} userId - ID của user
 * @returns {Promise<Object>} Thông tin user: name, avatar_url, created_at, post_count
 */
export const getPublicUserInfo = async (userId) => {
    return await axiosInstance.get(`/users/${userId}/public`);
};
