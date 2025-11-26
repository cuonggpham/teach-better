import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { createPost } from '../api/postsApi';
import { Container, Card, Input, Button } from '../components/ui';
import './CreatePostPage.css';

/**
 * CreatePostPage - Form tạo bài viết mới
 */
const CreatePostPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  const toast = useToast();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin');
    }
  }, [isAuthenticated, navigate]);

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

    // Validation
    if (!formData.title.trim()) {
      setErrors((prev) => ({ ...prev, title: t('validation.required') }));
      return;
    }

    if (formData.title.trim().length < 10) {
      setErrors((prev) => ({ ...prev, title: t('post.title_min') }));
      return;
    }

    if (!formData.content.trim()) {
      setErrors((prev) => ({ ...prev, content: t('validation.required') }));
      return;
    }

    if (formData.content.trim().length < 20) {
      setErrors((prev) => ({ ...prev, content: t('post.content_min') }));
      return;
    }

    setIsSubmitting(true);
    try {
      const newPost = await createPost(token, {
        title: formData.title.trim(),
        content: formData.content.trim(),
        status: 'open',
      });
      toast.success(t('post.create_success'));
      // Navigate to forum page (will show at top of page 1)
      navigate('/forum', { state: { newPostId: newPost._id, scrollToTop: true } });
    } catch (error) {
      toast.error(error.message || t('post.create_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="create-post-page">
      <Container size="medium">
        <Card variant="elevated" padding="large" className="create-post-card">
          <h1 className="create-post-title">{t('post.create')}</h1>

          <form onSubmit={handleSubmit} className="create-post-form">
            <Input
              label={t('post.title')}
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              error={errors.title}
              placeholder={t('post.title_placeholder')}
              className="mb-2"
            />

            <Input
              label={t('post.content')}
              as="textarea"
              name="content"
              value={formData.content}
              onChange={handleChange}
              error={errors.content}
              rows={12}
              placeholder={t('post.content_placeholder')}
              className="mb-3"
            />

            <div className="create-post-actions">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/forum')}
                disabled={isSubmitting}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                loading={isSubmitting}
              >
                {t('post.publish')}
              </Button>
            </div>
          </form>
        </Card>
      </Container>
    </div>
  );
};

export default CreatePostPage;

