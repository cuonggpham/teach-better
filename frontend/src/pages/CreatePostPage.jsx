import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { createPost } from '../api/postsApi';
import { categoriesApi } from '../api/categoriesApi';
import { getTags, createTag } from '../api/tagsApi';
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
    category: '',
    tag_ids: [],
  });
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [filteredTags, setFilteredTags] = useState([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin');
    } else {
      fetchCategories();
      fetchTags();
    }
  }, [isAuthenticated, navigate]);

  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.getCategories();
      console.log('Categories response:', response);
      console.log('Categories array:', response.categories);
      setCategories(response.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error('Không thể tải danh mục');
    }
  };

  const fetchTags = async () => {
    try {
      const response = await getTags(0, 100);
      setTags(response.tags || []);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  };

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

  const handleTagInputChange = (e) => {
    const value = e.target.value;
    setTagInput(value);

    if (value.trim()) {
      const filtered = tags.filter(tag =>
        tag.name.toLowerCase().includes(value.toLowerCase()) &&
        !selectedTags.find(st => st._id === tag._id)
      );
      setFilteredTags(filtered);
      setShowTagSuggestions(true);
    } else {
      setFilteredTags([]);
      setShowTagSuggestions(false);
    }
  };

  const handleSelectTag = (tag) => {
    if (selectedTags.length < 5 && !selectedTags.find(st => st._id === tag._id)) {
      setSelectedTags([...selectedTags, tag]);
      setFormData(prev => ({
        ...prev,
        tag_ids: [...prev.tag_ids, tag._id]
      }));
    }
    setTagInput('');
    setShowTagSuggestions(false);
  };

  const handleRemoveTag = (tagId) => {
    setSelectedTags(selectedTags.filter(tag => tag._id !== tagId));
    setFormData(prev => ({
      ...prev,
      tag_ids: prev.tag_ids.filter(id => id !== tagId)
    }));
  };

  const handleCreateNewTag = async () => {
    if (!tagInput.trim()) return;

    // Check if tag already exists
    const existingTag = tags.find(tag =>
      tag.name.toLowerCase() === tagInput.trim().toLowerCase()
    );

    if (existingTag) {
      handleSelectTag(existingTag);
      return;
    }

    // Create new tag
    try {
      const newTag = await createTag(token, {
        name: tagInput.trim(),
        description: ''
      });
      setTags([...tags, newTag]);
      handleSelectTag(newTag);
      toast.success(t('tag.create_success'));
    } catch (error) {
      toast.error(error.message || t('tag.create_error'));
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

    if (!formData.content.trim()) {
      setErrors((prev) => ({ ...prev, content: t('validation.required') }));
      return;
    }

    setIsSubmitting(true);
    try {
      const newPost = await createPost(token, {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category || null,
        tag_ids: formData.tag_ids,
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

            <div className="form-group mb-2">
              <label className="form-label">{t('post.category')}</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="category-select"
              >
                <option value="">{t('post.select_category')}</option>
                {categories.map((category) => (
                  <option key={category._id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group mb-2">
              <label className="form-label">
                {t('post.tags')} <span className="text-muted">({t('post.optional')}, {t('post.max_5_tags')})</span>
              </label>

              {/* Selected Tags Display */}
              {selectedTags.length > 0 && (
                <div className="selected-tags-container mb-2">
                  {selectedTags.map(tag => (
                    <span key={tag._id} className="tag-badge">
                      {tag.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag._id)}
                        className="tag-remove-btn"
                        aria-label="Remove tag"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Tag Input with Autocomplete */}
              {selectedTags.length < 5 && (
                <div className="tag-input-wrapper">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={handleTagInputChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (filteredTags.length > 0) {
                          handleSelectTag(filteredTags[0]);
                        } else if (tagInput.trim()) {
                          handleCreateNewTag();
                        }
                      }
                    }}
                    placeholder={t('post.search_or_create_tag')}
                    className="tag-input"
                  />

                  {/* Tag Suggestions Dropdown */}
                  {showTagSuggestions && filteredTags.length > 0 && (
                    <div className="tag-suggestions">
                      {filteredTags.slice(0, 10).map(tag => (
                        <div
                          key={tag._id}
                          onClick={() => handleSelectTag(tag)}
                          className="tag-suggestion-item"
                        >
                          <strong>{tag.name}</strong>
                          {tag.description && (
                            <span className="tag-description"> - {tag.description}</span>
                          )}
                          <span className="tag-post-count"> ({tag.post_count} {t('post.posts')})</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Create New Tag Button */}
                  {tagInput.trim() && !tags.find(t => t.name.toLowerCase() === tagInput.toLowerCase()) && (
                    <button
                      type="button"
                      onClick={handleCreateNewTag}
                      className="create-tag-btn"
                    >
                      {t('tag.create_new')}: "{tagInput}"
                    </button>
                  )}
                </div>
              )}
            </div>

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

