import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import LanguageSwitcher from '../LanguageSwitcher';
import './Navbar.css';

/**
 * Component Navbar - Thanh điều hướng chính
 */
const Navbar = () => {
  const { t } = useTranslation();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/">{t('app_title')}</Link>
        </div>
        
        <ul className="navbar-menu">
          <li><Link to="/">{t('navigation.home')}</Link></li>
          <li><Link to="/courses">{t('navigation.courses')}</Link></li>
          <li><Link to="/profile">{t('navigation.profile')}</Link></li>
          <li><Link to="/settings">{t('navigation.settings')}</Link></li>
        </ul>
        
        <div className="navbar-actions">
          <LanguageSwitcher />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
