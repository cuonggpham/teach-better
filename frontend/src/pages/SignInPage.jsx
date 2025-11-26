import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { signin } from '../api/authApi';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Container, Card } from '../components/ui';
import AuthForm from '../components/auth/AuthForm';
import { validateEmail, validatePassword } from '../utils/validators';
import './AuthPages.css';

/**
 * Sign In Page - User Login
 */
const SignInPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!formData.email) {
      setErrors((prev) => ({ ...prev, email: t('validation.required') }));
      return;
    }

    if (!validateEmail(formData.email)) {
      setErrors((prev) => ({ ...prev, email: t('validation.email_invalid') }));
      return;
    }

    if (!formData.password) {
      setErrors((prev) => ({ ...prev, password: t('validation.required') }));
      return;
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      setErrors((prev) => ({ ...prev, password: t(passwordValidation.errorKey) }));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await signin(formData.email, formData.password);
      login(response.access_token, response.user);
      toast.success(t('auth.login_success'));
      navigate(response.redirect || '/');
    } catch (error) {
      toast.error(error.message || t('auth.login_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <Container size="small">
        <Card variant="elevated" padding="large" className="auth-card">
          <AuthForm
            mode="signin"
            formData={formData}
            errors={errors}
            isSubmitting={isSubmitting}
            onChange={handleChange}
            onSubmit={handleSubmit}
          />
        </Card>
      </Container>
    </div>
  );
};

export default SignInPage;
