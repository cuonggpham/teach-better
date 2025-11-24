import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from '../api/api';
import './SignUpPage.css';

const SignUpPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password_confirm: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Validate email format
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate password strength
  const validatePassword = (password) => {
    if (password.length < 8) {
      return t('auth.password_min_length');
    }
    
    // Check for invalid characters
    if (password.includes('"') || password.includes("'")) {
      return t('auth.password_invalid_chars');
    }
    
    // Check password strength (at least 2 of 3: letters, numbers, symbols)
    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};:,.<>?]/.test(password);
    
    const strength = [hasLetters, hasNumbers, hasSymbols].filter(Boolean).length;
    
    if (strength < 2) {
      return t('auth.password_weak');
    }
    
    return null;
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle blur to show validation errors
  const handleBlur = (e) => {
    const { name, value } = e.target;
    let error = '';
    
    if (name === 'email' && value) {
      if (!validateEmail(value)) {
        error = t('auth.email_invalid');
      }
    }
    
    if (name === 'password' && value) {
      error = validatePassword(value);
    }
    
    if (name === 'password_confirm' && value) {
      if (value !== formData.password) {
        error = t('auth.password_mismatch');
      }
    }
    
    if (error) {
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset messages
    setSuccessMessage('');
    setErrors({});
    
    // Validate all fields
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = t('validation.required');
    } else if (!validateEmail(formData.email)) {
      newErrors.email = t('auth.email_invalid');
    }
    
    if (!formData.password) {
      newErrors.password = t('validation.required');
    } else {
      const passwordError = validatePassword(formData.password);
      if (passwordError) {
        newErrors.password = passwordError;
      }
    }
    
    if (!formData.password_confirm) {
      newErrors.password_confirm = t('validation.required');
    } else if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = t('auth.password_mismatch');
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Submit form
    setIsLoading(true);
    
    try {
      await authApi.signup({
        email: formData.email,
        password: formData.password,
        password_confirm: formData.password_confirm
      });
      
      setSuccessMessage(t('auth.register_success'));
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/signin');
      }, 2000);
      
    } catch (error) {
      if (error.response?.data?.detail) {
        setErrors({ general: error.response.data.detail });
      } else {
        setErrors({ general: t('auth.register_failed') });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <div className="signup-card">
          <div className="signup-header">
            <h1>{t('auth.signup_title')}</h1>
            <p>{t('auth.signup_subtitle')}</p>
          </div>

          {successMessage && (
            <div className="alert alert-success">
              <svg className="alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {successMessage}
            </div>
          )}

          {errors.general && (
            <div className="alert alert-error">
              <svg className="alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="signup-form">
            <div className="form-group">
              <label htmlFor="email">{t('auth.email')}</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.email ? 'input-error' : ''}
                placeholder={t('auth.email_placeholder')}
                disabled={isLoading}
              />
              {errors.email && (
                <span className="error-message">{errors.email}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password">{t('auth.password')}</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.password ? 'input-error' : ''}
                placeholder={t('auth.password_placeholder')}
                disabled={isLoading}
              />
              {errors.password && (
                <span className="error-message">{errors.password}</span>
              )}
              <small className="help-text">{t('auth.password_help')}</small>
            </div>

            <div className="form-group">
              <label htmlFor="password_confirm">{t('auth.password_confirm')}</label>
              <input
                type="password"
                id="password_confirm"
                name="password_confirm"
                value={formData.password_confirm}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.password_confirm ? 'input-error' : ''}
                placeholder={t('auth.password_confirm_placeholder')}
                disabled={isLoading}
              />
              {errors.password_confirm && (
                <span className="error-message">{errors.password_confirm}</span>
              )}
            </div>

            <button 
              type="submit" 
              className="btn-primary btn-block"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  {t('common.loading')}
                </>
              ) : (
                t('auth.signup_button')
              )}
            </button>
          </form>

          <div className="signup-footer">
            <p>
              {t('auth.already_have_account')}{' '}
              <Link to="/signin">{t('auth.signin')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
