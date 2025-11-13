import axiosInstance from './axiosConfig';

/**
 * API functions liên quan đến Items (Todo List)
 */

/**
 * Lấy danh sách tất cả items
 * @returns {Promise<Array>} Danh sách items
 */
export const getItems = async () => {
  return await axiosInstance.get('/items');
};

/**
 * Lấy chi tiết một item theo ID
 * @param {string|number} id - ID của item
 * @returns {Promise<Object>} Chi tiết item
 */
export const getItemById = async (id) => {
  return await axiosInstance.get(`/items/${id}`);
};

/**
 * Tạo item mới
 * @param {Object} itemData - Dữ liệu của item mới
 * @returns {Promise<Object>} Item đã tạo
 */
export const createItem = async (itemData) => {
  return await axiosInstance.post('/items', itemData);
};

/**
 * Cập nhật item
 * @param {string|number} id - ID của item
 * @param {Object} itemData - Dữ liệu cập nhật
 * @returns {Promise<Object>} Item đã cập nhật
 */
export const updateItem = async (id, itemData) => {
  return await axiosInstance.put(`/items/${id}`, itemData);
};

/**
 * Xóa item
 * @param {string|number} id - ID của item
 * @returns {Promise<Object>} Kết quả xóa
 */
export const deleteItem = async (id) => {
  return await axiosInstance.delete(`/items/${id}`);
};

/**
 * Toggle trạng thái completed của item
 * @param {string|number} id - ID của item
 * @returns {Promise<Object>} Item đã cập nhật
 */
export const toggleItemComplete = async (id) => {
  return await axiosInstance.patch(`/items/${id}/toggle`);
};
