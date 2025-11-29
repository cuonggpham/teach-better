import axios from 'axios';

/**
 * Cấu hình Axios instance
 * Base URL và các interceptors
 */

// Tạo axios instance với cấu hình mặc định
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Thêm token vào header
axiosInstance.interceptors.request.use(
  (config) => {
    // Lấy token từ localStorage
    const token = localStorage.getItem('access_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Thêm language header
    const language = localStorage.getItem('i18nextLng') || 'vi';
    config.headers['Accept-Language'] = language;
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Xử lý response và lỗi
axiosInstance.interceptors.response.use(
  (response) => {
    // Trả về data để tránh phải extract .data nhiều lần
    return response.data;
  },
  (error) => {
    // Xử lý các lỗi phổ biến
    if (error.response) {
      // Server trả về lỗi
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - Xóa token và redirect về login
          localStorage.removeItem('access_token');
          window.location.href = '/login';
          break;
        case 403:
          // Forbidden - Không có quyền truy cập
          console.error('Bạn không có quyền truy cập tài nguyên này');
          break;
        case 404:
          // Not Found
          console.error('Không tìm thấy tài nguyên');
          break;
        case 500:
          // Server Error
          console.error('Lỗi server, vui lòng thử lại sau');
          break;
        default:
          console.error('Đã xảy ra lỗi:', data.message || error.message);
      }
      
      return Promise.reject(error.response.data);
    } else if (error.request) {
      // Request được gửi nhưng không nhận được response
      console.error('Không thể kết nối đến server');
      return Promise.reject({
        message: 'Không thể kết nối đến server',
        error: error.message
      });
    } else {
      // Lỗi khác
      console.error('Lỗi:', error.message);
      return Promise.reject({
        message: error.message,
        error: error
      });
    }
  }
);

export default axiosInstance;
