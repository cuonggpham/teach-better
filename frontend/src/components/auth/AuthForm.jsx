import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Input, Button, Alert } from '../ui';
import './AuthForm.css';

/**
 * AuthForm Component - Shared form component cho SignIn và SignUp
 * Đảm bảo UI giống hệt nhau, chỉ khác nhau các fields
 */
const AuthForm = ({
  mode = 'signin', // 'signin' | 'signup'
  formData,
  errors,
  successMessage,
  isSubmitting,
  onChange,
  onSubmit,
}) => {
  const { t } = useTranslation();

  const isSignUp = mode === 'signup';

  return (
    <div className="auth-form-wrapper">
      <h1 className="auth-title">
        {isSignUp ? t('auth.register') : t('auth.login')}
      </h1>

      {errors.general && (
        <Alert type="error" className="mb-3">
          {errors.general}
        </Alert>
      )}

      {successMessage && (
        <Alert type="success" className="mb-3">
          {successMessage}
        </Alert>
      )}

      <form onSubmit={onSubmit} className="auth-form">
        <Input
          label={t('auth.email')}
          type="email"
          name="email"
          value={formData.email}
          onChange={onChange}
          error={errors.email}
          placeholder={t('auth.email_placeholder')}
          className="auth-input"
        />

        <Input
          label={t('auth.password')}
          type="password"
          name="password"
          value={formData.password}
          onChange={onChange}
          error={errors.password}
          placeholder={t('auth.password_placeholder')}
          helperText={isSignUp ? t('auth.password_hint') : undefined}
          className="auth-input"
        />

        {isSignUp && (
          <Input
            label={t('auth.password_confirm')}
            type="password"
            name="passwordConfirm"
            value={formData.passwordConfirm}
            onChange={onChange}
            error={errors.passwordConfirm}
            placeholder={t('auth.password_confirm_placeholder')}
            className="auth-input"
          />
        )}

        <Button
          type="submit"
          variant="primary"
          size="large"
          disabled={isSubmitting}
          loading={isSubmitting}
          className="auth-submit-btn"
        >
          {isSignUp ? t('auth.register') : t('auth.login')}
        </Button>
      </form>

      <p className="auth-footer">
        {isSignUp ? (
          <>
            {t('auth.already_have_account')}{' '}
            <Link to="/signin">{t('auth.login')}</Link>
          </>
        ) : (
          <>
            {t('auth.no_account')}{' '}
            <Link to="/signup">{t('auth.register')}</Link>
          </>
        )}
      </p>
    </div>
  );
};

export default AuthForm;

