import { useTranslation } from 'react-i18next';
import { Container } from '../ui';
import './Footer.css';

/**
 * Component Footer - Chân trang
 */
const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="footer">
      <Container size="large">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-title">{t('app_title', 'Teach Better')}</h3>
            <p className="footer-description">
              {t('footer.description')}
            </p>
          </div>
          <div className="footer-section">
            <h4 className="footer-heading">{t('footer.links')}</h4>
            <ul className="footer-links">
              <li>
                <a href="/">{t('navigation.home')}</a>
              </li>
              <li>
                <a href="/forum">{t('navigation.forum')}</a>
              </li>
            </ul>
          </div>
          <div className="footer-section">
            <h4 className="footer-heading">{t('footer.legal')}</h4>
            <ul className="footer-links">
              <li>
                <a href="/privacy">{t('footer.privacy')}</a>
              </li>
              <li>
                <a href="/terms">{t('footer.terms')}</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} {t('app_title', 'Teach Better')}. {t('footer.rights')}.</p>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
