import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { signout } from '../../api/authApi';
import { Button } from '../ui';
import { NotificationBell } from '../forum';
import LanguageSwitcher from '../LanguageSwitcher';
import './Navbar.css';

/**
 * Component Navbar - Thanh điều hướng chính
 */
const Navbar = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout, token } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (window.confirm(t('auth.logout_confirm'))) {
      try {
        await signout(token);
        logout();
        navigate('/');
      } catch (error) {
        logout();
        navigate('/');
      }
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/">{t('app_title', 'Teach Better')}</Link>
        </div>

        <ul className="navbar-menu">
          <li>
            <Link to="/">{t('navigation.home')}</Link>
          </li>
          <li>
            <Link to="/forum">{t('navigation.forum')}</Link>
          </li>
          {isAuthenticated && (
            <li>
              <Link to="/profile">{t('navigation.profile')}</Link>
            </li>
          )}
        </ul>

        <div className="navbar-actions">
          <LanguageSwitcher />
          {isAuthenticated ? (
            <>
              <NotificationBell />
              <span className="navbar-user">{user?.name || user?.email}</span>
              <Button variant="danger" size="small" onClick={handleLogout}>
                {t('navigation.logout')}
              </Button>
            </>
          ) : (
            <>
              <Button as={Link} to="/signin" variant="ghost" size="small">
                {t('auth.login')}
              </Button>
              <Button as={Link} to="/signup" variant="primary" size="small">
                {t('auth.register')}
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
