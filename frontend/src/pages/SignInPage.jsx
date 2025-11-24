import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from '../api/api';
import './SignInPage.css';

const SignInPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setErrors({});
    
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = t('validation.required');
    }
    
    if (!formData.password) {
      newErrors.password = t('validation.required');
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await authApi.signin({
        email: formData.email,
        password: formData.password
      });
      
      // Save token
      if (response.access_token) {
        localStorage.setItem('access_token', response.access_token);
      }
      
      // Redirect to home
      navigate('/');
      
    } catch (error) {
      if (error.response?.data?.detail) {
        setErrors({ general: error.response.data.detail });
      } else {
        setErrors({ general: t('auth.login_error') });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signin-page">
      <div className="signin-container">
        <div className="signin-card">
          <div className="signin-header">
            <h1>{t('auth.signin_title')}</h1>
            <p>{t('auth.signin_subtitle')}</p>
          </div>

          {errors.general && (
            <div className="alert alert-error">
              <svg className="alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="signin-form">
            <div className="form-group">
              <label htmlFor="email">{t('auth.email')}</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
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
                className={errors.password ? 'input-error' : ''}
                placeholder={t('auth.password_placeholder')}
                disabled={isLoading}
              />
              {errors.password && (
                <span className="error-message">{errors.password}</span>
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
                t('auth.signin_button')
              )}
            </button>
          </form>

          <div className="signin-footer">
            <p>
              {t('auth.no_account')}{' '}
              <Link to="/signup">{t('auth.signup')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
