import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { signout } from '../../api/authApi';
import { Button } from '../ui';
import { NotificationBell } from '../forum';
import LanguageSwitcher from '../LanguageSwitcher';
import logo from '../../assets/logo.png';
import './Navbar.css';

/**
 * Component Navbar - Thanh điều hướng chính
 */
const Navbar = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout, token } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleLogout = async () => {
    try {
      await signout(token);
      logout();
      toast.success(t('auth.logout_success'));
      navigate('/');
    } catch {
      logout();
      toast.info(t('auth.logout_success'));
      navigate('/');
    }
    setShowDropdown(false);
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleProfileClick = () => {
    navigate('/profile');
    setShowDropdown(false);
  };

  const getAvatarText = () => {
    if (user?.name) {
      return user.name[0].toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">

        {/* Logo */}
        <div className="navbar-brand">
          <Link to="/">
            <img src={logo} alt="Teach Better" className="navbar-logo" />
          </Link>
        </div>

        <ul className="navbar-menu">
          <li>
            <Link to="/">{t('navigation.home')}</Link>
          </li>
          <li>
            <Link to="/forum">{t('navigation.forum')}</Link>
          </li>
        </ul>

        <div className="navbar-actions">
          <LanguageSwitcher />
          {isAuthenticated ? (
            <>
              <NotificationBell />
              <div className="user-menu" ref={dropdownRef}>
                <div className="user-avatar" onClick={toggleDropdown}>
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name || user.email} />
                  ) : (
                    <div className="avatar-placeholder">{getAvatarText()}</div>
                  )}
                </div>
                {showDropdown && (
                  <div className="dropdown-menu">
                    <button className="dropdown-item" onClick={handleProfileClick}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <span>{t('navigation.profile')}</span>
                    </button>
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-item danger" onClick={handleLogout}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      <span>{t('navigation.logout')}</span>
                    </button>
                  </div>
                )}
              </div>
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
