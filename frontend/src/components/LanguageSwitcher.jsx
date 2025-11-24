import { useTranslation } from 'react-i18next';
import { supportedLanguages } from '../i18n/config';
import './LanguageSwitcher.css';

/**
 * Component chuyển đổi ngôn ngữ
 * 
 * Hiển thị dropdown để người dùng chọn ngôn ngữ
 * Lưu lựa chọn vào localStorage tự động
 * 
 * @returns {JSX.Element} Language switcher component
 */
const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  const handleLanguageChange = (event) => {
    const newLanguage = event.target.value;
    i18n.changeLanguage(newLanguage);
    
    // Hiển thị thông báo (có thể tùy chỉnh)
    console.log(`Language changed to: ${newLanguage}`);
  };

  return (
    <div className="language-switcher">
      <select
        id="language-select"
        value={i18n.language}
        onChange={handleLanguageChange}
        className="language-select"
      >
        {Object.entries(supportedLanguages).map(([code, { nativeName }]) => (
          <option key={code} value={code}>
            {nativeName}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSwitcher;
