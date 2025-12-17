import axiosInstance from './axiosConfig';

/**
 * API endpoints cho tính năng AI Diagnosis
 */

/**
 * Tạo chẩn đoán mới
 * @param {Object} data - Dữ liệu chẩn đoán
 * @param {string} data.lesson_content - Nội dung bài giảng
 * @param {File} data.audio_file - File ghi âm (optional)
 * @param {File[]} data.document_files - Các file tài liệu (optional)
 * @param {string} data.subject - Môn học
 * @param {string} data.nationality - Quốc tịch học viên
 * @param {string} data.level - Trình độ học viên (N5-N1)
 * @param {string} data.age - Độ tuổi học viên
 * @param {string} token - Token xác thực
 * @returns {Promise} - Kết quả chẩn đoán
 * 
 * Expected Response:
 * {
 *   "_id": "string",
 *   "subject": "IT",
 *   "level": "N3",
 *   "age": "22",
 *   "nationality": "vietnam",
 *   "uploaded_files": [
 *     { "name": "File-name.pdf", "uploaded_by": "User", "uploaded_at": "January 1, 2023 at" }
 *   ],
 *   "difficulty_points": [
 *     "専門用語の定義が明確ではなく、混乱しやすい。",
 *     "図や例が少なく、内容流れを追いにくい"
 *   ],
 *   "difficulty_level": "high", // "low" | "medium" | "high"
 *   "comprehension_scores": {
 *     "logic": 60,
 *     "examples": 40,
 *     "level_fit": 80
 *   },
 *   "suggestions": [
 *     "抽象的な部分を、具体例やイラストで補足する。",
 *     "専門用語を使う前に、簡単な言葉で説明する。",
 *     "段階的に説明して、理解を確認しながら進める。",
 *     "動画や図表など、視覚的な教材を活用する。"
 *   ],
 *   "created_at": "2025-01-01T00:00:00Z"
 * }
 */
export const createDiagnosis = async (data, token) => {
  const formData = new FormData();

  if (data.lesson_content) {
    formData.append('lesson_content', data.lesson_content);
  }

  if (data.audio_file) {
    formData.append('audio_file', data.audio_file);
  }

  if (data.document_files && data.document_files.length > 0) {
    data.document_files.forEach((file, index) => {
      formData.append(`document_files[${index}]`, file);
    });
  }

  if (data.subject) {
    formData.append('subject', data.subject);
  }

  formData.append('nationality', data.nationality);
  formData.append('level', data.level);

  if (data.age) {
    formData.append('age', data.age);
  }

  const response = await axiosInstance.post('/diagnoses/form', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`,
    },
  });

  // Note: axiosConfig.js response interceptor already returns response.data
  // so 'response' here is already the data object
  return response;
};

/**
 * Lưu kết quả chẩn đoán
 * @param {string} diagnosisId - ID chẩn đoán
 * @param {string} token - Token xác thực
 * @returns {Promise} - Kết quả lưu
 */
export const saveDiagnosisResult = async (diagnosisId, token) => {
  const response = await axiosInstance.post(`/diagnoses/${diagnosisId}/save/`, {}, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Note: axiosConfig.js response interceptor already returns response.data
  return response;
};

/**
 * Lấy danh sách lịch sử chẩn đoán
 * @param {string} token - Token xác thực
 * @param {Object} params - Tham số lọc
 * @param {string} params.search - Từ khóa tìm kiếm
 * @param {string} params.subject - Môn học
 * @param {string} params.start_date - Ngày bắt đầu (YYYY-MM-DD)
 * @param {string} params.end_date - Ngày kết thúc (YYYY-MM-DD)
 * @param {number} params.skip - Số bản ghi bỏ qua (pagination)
 * @param {number} params.limit - Số bản ghi trả về
 * @returns {Promise} - Danh sách chẩn đoán
 * 
 * Expected Response:
 * {
 *   "diagnoses": [
 *     {
 *       "_id": "string",
 *       "title": "教育方法に関する質問",
 *       "subject": "math",
 *       "created_at": "2025-08-08T00:00:00Z"
 *     }
 *   ],
 *   "total": 10
 * }
 */
export const getDiagnosisHistory = async (token, params = {}) => {
  const queryParams = new URLSearchParams();

  if (params.search) {
    queryParams.append('search', params.search);
  }
  if (params.subject) {
    queryParams.append('subject', params.subject);
  }
  if (params.start_date) {
    queryParams.append('start_date', params.start_date);
  }
  if (params.end_date) {
    queryParams.append('end_date', params.end_date);
  }
  if (params.skip !== undefined) {
    queryParams.append('skip', params.skip);
  }
  if (params.limit !== undefined) {
    queryParams.append('limit', params.limit);
  }

  const response = await axiosInstance.get(`/diagnoses/?${queryParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Note: axiosConfig.js response interceptor already returns response.data
  return response;
};

/**
 * Lấy chi tiết một chẩn đoán
 * @param {string} diagnosisId - ID chẩn đoán
 * @param {string} token - Token xác thực
 * @returns {Promise} - Chi tiết chẩn đoán (same format as createDiagnosis response)
 */
export const getDiagnosisDetail = async (diagnosisId, token) => {
  const response = await axiosInstance.get(`/diagnoses/${diagnosisId}/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Note: axiosConfig.js response interceptor already returns response.data
  return response;
};

/**
 * Xóa một chẩn đoán
 * @param {string} diagnosisId - ID chẩn đoán
 * @param {string} token - Token xác thực
 * @returns {Promise} - Kết quả xóa
 */
export const deleteDiagnosis = async (diagnosisId, token) => {
  const response = await axiosInstance.delete(`/diagnoses/${diagnosisId}/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Note: axiosConfig.js response interceptor already returns response.data
  return response;
};
