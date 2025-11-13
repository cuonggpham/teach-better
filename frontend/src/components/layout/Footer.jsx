import { useTranslation } from 'react-i18next';
import './Footer.css';

/**
 * Component Footer - Chân trang
 */
const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="footer">
      <div className="footer-container">
        <p>&copy; 2025 {t('app_title')}. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
