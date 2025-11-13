/**
 * Utility functions cho formatting
 */

/**
 * Format ngày tháng
 * @param {Date|string} date - Ngày cần format
 * @param {string} locale - Locale (vi, ja, en)
 * @returns {string} Ngày đã format
 */
export const formatDate = (date, locale = 'vi') => {
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Format giờ
 * @param {Date|string} date - Ngày giờ cần format
 * @param {string} locale - Locale (vi, ja, en)
 * @returns {string} Giờ đã format
 */
export const formatTime = (date, locale = 'vi') => {
  const dateObj = new Date(date);
  return dateObj.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format ngày giờ đầy đủ
 * @param {Date|string} date - Ngày giờ cần format
 * @param {string} locale - Locale (vi, ja, en)
 * @returns {string} Ngày giờ đã format
 */
export const formatDateTime = (date, locale = 'vi') => {
  const dateObj = new Date(date);
  return dateObj.toLocaleString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format số tiền
 * @param {number} amount - Số tiền
 * @param {string} currency - Loại tiền tệ (VND, JPY, USD)
 * @param {string} locale - Locale (vi, ja, en)
 * @returns {string} Số tiền đã format
 */
export const formatCurrency = (amount, currency = 'VND', locale = 'vi') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Format số lượng
 * @param {number} number - Số cần format
 * @param {string} locale - Locale (vi, ja, en)
 * @returns {string} Số đã format
 */
export const formatNumber = (number, locale = 'vi') => {
  return new Intl.NumberFormat(locale).format(number);
};

/**
 * Truncate text với ellipsis
 * @param {string} text - Text cần truncate
 * @param {number} maxLength - Độ dài tối đa
 * @returns {string} Text đã truncate
 */
export const truncateText = (text, maxLength = 50) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Capitalize first letter
 * @param {string} text - Text cần capitalize
 * @returns {string} Text đã capitalize
 */
export const capitalize = (text) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
};
