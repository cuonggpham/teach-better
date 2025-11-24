import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { login as loginApi } from "../api/authApi";
import "./LoginPage.css";

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  // Validate email
  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // Validate password (min 8 chars)
  const validatePassword = (password) => password.length >= 8;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear individual field error
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    if (apiError) setApiError("");
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = t("validation.required");
    } else if (!validateEmail(formData.email)) {
      newErrors.email = t("validation.email_invalid");
    }

    if (!formData.password) {
      newErrors.password = t("validation.required");
    } else if (!validatePassword(formData.password)) {
      newErrors.password = t("validation.password_min");
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setApiError("");

    try {
      // Backend expects:
      // { email, password }
      const response = await loginApi({
        email: formData.email,
        password: formData.password,
      });

      // Backend returns:
      // { user, access_token, token_type }
      login(response.user, response.access_token);

      navigate("/"); // about: chuyển về HomePage
    } catch (error) {
      // Fix: backend trả lỗi trong error.response.data.detail
      const errMessage =
        error?.response?.data?.detail ||
        t("auth.login_error");

      setApiError(errMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>{t("auth.login")}</h1>
            <p className="login-subtitle">{t("app_title")}</p>
          </div>

          {apiError && <div className="error-message">{apiError}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            {/* Email */}
            <div className="form-group">
              <label htmlFor="email">{t("auth.email")}</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@email.com"
                className={errors.email ? "error" : ""}
              />
              {errors.email && (
                <span className="field-error">{errors.email}</span>
              )}
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password">{t("auth.password")}</label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={errors.password ? "error" : ""}
              />
              {errors.password && (
                <span className="field-error">{errors.password}</span>
              )}
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? t("common.loading") : t("auth.login")}
            </button>
          </form>

          <div className="login-footer">
            <Link to="/forgot-password" className="forgot-password-link">
              {t("auth.forgot_password")}
            </Link>

            <div className="register-link">
              {t("auth.no_account")}{" "}
              <Link to="/signup">{t("auth.register")}</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
