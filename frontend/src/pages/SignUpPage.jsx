import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { signup } from '../api/authApi';
import { useToast } from '../contexts/ToastContext';
import { Container, Card } from '../components/ui';
import AuthForm from '../components/auth/AuthForm';
import { validateEmail, validatePassword } from '../utils/validators';
import './AuthPages.css';

/**
 * Sign Up Page - User Registration
 */
const SignUpPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
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

    // Validate email
    if (!formData.email) {
      setErrors((prev) => ({ ...prev, email: t('validation.required') }));
      return;
    }

    if (!validateEmail(formData.email)) {
      setErrors((prev) => ({ ...prev, email: t('validation.email_invalid') }));
      return;
    }

    // Validate password
    if (!formData.password) {
      setErrors((prev) => ({ ...prev, password: t('validation.required') }));
      return;
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      setErrors((prev) => ({ ...prev, password: t(passwordValidation.errorKey) }));
      return;
    }

    // Validate password confirmation
    if (!formData.passwordConfirm) {
      setErrors((prev) => ({
        ...prev,
        passwordConfirm: t('validation.required'),
      }));
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      setErrors((prev) => ({
        ...prev,
        passwordConfirm: t('validation.password_mismatch'),
      }));
      return;
    }

    // Submit to backend
    setIsSubmitting(true);
    try {
      const response = await signup(
        formData.email,
        formData.password,
        formData.passwordConfirm
      );
      toast.success(response.message || t('auth.register_success'));
      // Redirect to login page after 1.5 seconds
      setTimeout(() => {
        navigate('/signin');
      }, 1500);
    } catch (error) {
      toast.error(error.message || t('auth.register_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <Container size="small">
        <Card variant="elevated" padding="large" className="auth-card">
          <AuthForm
            mode="signup"
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

export default SignUpPage;
