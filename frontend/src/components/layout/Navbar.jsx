import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import LanguageSwitcher from "../LanguageSwitcher";
import "./Navbar.css";

/**
 * Component Navbar - Thanh điều hướng chính
 */
const Navbar = () => {
  const { t } = useTranslation();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/"); // về IntroPage
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">

        {/* Logo */}
        <div className="navbar-brand">
          <Link to="/">{t("app_title")}</Link>
        </div>

        {/* Menu */}
        <ul className="navbar-menu">
          <li><Link to="/">{t("navigation.home")}</Link></li>

          {/* Courses / Todo Items Page */}
          <li><Link to="/courses">{t("navigation.courses")}</Link></li>

          {/* Bookmark Page */}
          {isAuthenticated() && (
            <li><Link to="/bookmark">⭐ {t("navigation.bookmark")}</Link></li>
          )}

          {/* Profile + Settings */}
          {isAuthenticated() && (
            <>
              <li><Link to="/profile">{t("navigation.profile")}</Link></li>
              <li><Link to="/settings">{t("navigation.settings")}</Link></li>
            </>
          )}
        </ul>

        {/* Right side */}
        <div className="navbar-actions">
          <LanguageSwitcher />

          {/* Login Button */}
          {!isAuthenticated() ? (
            <Link
              to="/login"
              className="navbar-login-btn"
              data-testid="navbar-login-button"
            >
              {t("auth.login")}
            </Link>
          ) : (
            <div className="navbar-user" data-testid="navbar-user-menu">
              <span className="navbar-username">
                {user?.name || user?.email}
              </span>

              {/* LOGOUT button */}
              <button
                className="navbar-logout-btn"
                onClick={handleLogout}
                data-testid="navbar-logout-button"
              >
                {t("auth.logout")}
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
