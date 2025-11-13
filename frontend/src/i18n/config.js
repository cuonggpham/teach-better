import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Cấu hình các ngôn ngữ được hỗ trợ
export const supportedLanguages = {
  vi: { name: 'Tiếng Việt', nativeName: 'Tiếng Việt' },
  ja: { name: 'Tiếng Nhật', nativeName: '日本語' }
};

// Ngôn ngữ mặc định
const defaultLanguage = 'vi';

// Cấu hình Language Detector
const detectionOptions = {
  // Thứ tự ưu tiên phát hiện ngôn ngữ:
  // 1. localStorage: Lưu lựa chọn của người dùng
  // 2. navigator: Ngôn ngữ trình duyệt
  // 3. htmlTag: Thuộc tính lang của thẻ html
  order: ['localStorage', 'navigator', 'htmlTag'],
  
  // Key để lưu trong localStorage
  lookupLocalStorage: 'i18nextLng',
  
  // Cache lựa chọn ngôn ngữ
  caches: ['localStorage'],
  
  // Không cache nếu là ngôn ngữ mặc định
  excludeCacheFor: ['cimode'],
  
  // Chỉ phát hiện các ngôn ngữ được hỗ trợ
  checkWhitelist: true
};

// Khởi tạo i18n
i18n
  // Tích hợp với React
  .use(initReactI18next)
  
  // Tự động phát hiện ngôn ngữ
  .use(LanguageDetector)
  
  // Sử dụng Backend để load translation files từ public folder
  .use(Backend)
  
  // Khởi tạo với cấu hình
  .init({
    // Ngôn ngữ dự phòng khi không tìm thấy translation
    fallbackLng: defaultLanguage,
    
    // Danh sách ngôn ngữ được hỗ trợ
    supportedLngs: Object.keys(supportedLanguages),
    
    // Debug mode (tắt trong production)
    debug: false,
    
    // Namespace mặc định
    ns: ['translation'],
    defaultNS: 'translation',
    
    // Cấu hình phát hiện ngôn ngữ
    detection: detectionOptions,
    
    // Cấu hình Backend để load từ public/locales
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    
    // Cấu hình interpolation
    interpolation: {
      // React đã escape XSS rồi
      escapeValue: false,
      
      // Format cho số, ngày tháng, tiền tệ
      formatSeparator: ',',
      
      // Các hàm format tùy chỉnh
      format: (value, format) => {
        if (format === 'uppercase') return value.toUpperCase();
        if (format === 'lowercase') return value.toLowerCase();
        if (format === 'capitalize') {
          return value.charAt(0).toUpperCase() + value.slice(1);
        }
        return value;
      }
    },
    
    // Hiển thị key nếu không tìm thấy translation
    saveMissing: false,
    
    // Sử dụng Suspense cho React
    react: {
      useSuspense: true,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p', 'span']
    }
  });

// Export hàm helper để thay đổi ngôn ngữ
export const changeLanguage = (lng) => {
  return i18n.changeLanguage(lng);
};

// Export hàm lấy ngôn ngữ hiện tại
export const getCurrentLanguage = () => {
  return i18n.language;
};

// Export hàm kiểm tra ngôn ngữ có được hỗ trợ không
export const isLanguageSupported = (lng) => {
  return Object.keys(supportedLanguages).includes(lng);
};

export default i18n;
