import axiosInstance from './axiosConfig';

/**
 * API cho report (báo cáo vi phạm)
 */

/**
 * Tạo báo cáo mới
 * @param {Object} reportData - Dữ liệu báo cáo
 * @param {string} reportData.report_type - Loại báo cáo ('post', 'answer', 'comment', 'user')
 * @param {string} reportData.target_id - ID của đối tượng bị báo cáo
 * @param {string} reportData.reason_category - Danh mục vi phạm ('spam', 'inappropriate', 'harassment', 'offensive', 'misleading', 'other')
 * @param {string} reportData.reason_detail - Chi tiết lý do (tối thiểu 20 ký tự)
 * @param {string} [reportData.evidence_url] - URL ảnh bằng chứng (tùy chọn)
 * @returns {Promise<Object>} Báo cáo đã tạo
 */
export const createReport = async (reportData) => {
  return await axiosInstance.post('/reports/', reportData);
};

/**
 * Lấy danh sách báo cáo của người dùng hiện tại
 * @param {number} skip - Số lượng bỏ qua
 * @param {number} limit - Số lượng tối đa
 * @returns {Promise<Array>} Danh sách báo cáo
 */
export const getMyReports = async (skip = 0, limit = 10) => {
  return await axiosInstance.get('/reports/my-reports', {
    params: { skip, limit }
  });
};

/**
 * Lấy chi tiết một báo cáo
 * @param {string} reportId - ID báo cáo
 * @returns {Promise<Object>} Chi tiết báo cáo
 */
export const getReportById = async (reportId) => {
  return await axiosInstance.get(`/reports/${reportId}`);
};

/**
 * Lấy danh sách tất cả báo cáo (Admin only)
 * @param {Object} params - Tham số lọc
 * @returns {Promise<Array>} Danh sách báo cáo
 */
export const getAllReports = async (params = {}) => {
  return await axiosInstance.get('/reports/', { params });
};
