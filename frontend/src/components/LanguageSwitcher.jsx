import { useState, useRef, useEffect } from 'react';
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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const languages = {
    vi: {
      name: 'Tiếng Việt',
      flag: '🇻🇳'
    },
    ja: {
      name: '日本語',
      flag: '🇯🇵'
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
    console.log(`Language changed to: ${langCode}`);
  };

  const currentLang = languages[i18n.language] || languages['vi'];

  return (
    <div className="language-switcher" ref={dropdownRef}>
      <button
        className="language-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="flag-icon">{currentLang.flag}</span>
        <span className="language-name">{currentLang.name}</span>
        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="language-dropdown">
          {Object.entries(languages).map(([code, { name, flag }]) => (
            <button
              key={code}
              className={`language-option ${i18n.language === code ? 'active' : ''}`}
              onClick={() => handleLanguageChange(code)}
            >
              <span className="flag-icon">{flag}</span>
              <span className="language-name">{name}</span>
              {i18n.language === code && <span className="check-icon">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
