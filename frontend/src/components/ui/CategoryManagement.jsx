import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './CategoryManagement.css';
import CategoryCard from './CategoryCard';
import { adminApi } from '../../api/adminApi';
import axiosConfig from '../../api/axiosConfig';

const CategoryManagement = () => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('category'); // category, tag
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'category'
  });
  const [editingItem, setEditingItem] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load dữ liệu khi component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {

      let categoriesData, tagsData;

      // Try admin API first, fallback to public API
      try {
        const [categoriesResponse, tagsResponse] = await Promise.all([
          adminApi.getCategories(true), // include inactive
          adminApi.getTags(true) // include inactive
        ]);


        categoriesData = categoriesResponse.data || categoriesResponse || [];
        tagsData = tagsResponse.data || tagsResponse || [];

      } catch (adminError) {

        // Fallback to public API
        try {
          const [categoriesResponse, tagsResponse] = await Promise.all([
            axiosConfig.get('/categories/?skip=0&limit=100'),
            axiosConfig.get('/tags/?skip=0&limit=100')
          ]);


          categoriesData = categoriesResponse.categories || categoriesResponse.data || [];
          tagsData = tagsResponse.tags || tagsResponse.data || [];

        } catch (axiosError) {

          // Fallback to direct fetch
          const baseUrl = 'http://localhost:8000/api/v1';
          const [categoriesResponse, tagsResponse] = await Promise.all([
            fetch(`${baseUrl}/categories/?skip=0&limit=100`),
            fetch(`${baseUrl}/tags/?skip=0&limit=100`)
          ]);


          if (!categoriesResponse.ok || !tagsResponse.ok) {
            throw new Error(`HTTP error! Categories: ${categoriesResponse.status}, Tags: ${tagsResponse.status}`);
          }

          const categoriesJson = await categoriesResponse.json();
          const tagsJson = await tagsResponse.json();


          categoriesData = categoriesJson?.categories || categoriesJson || [];
          tagsData = tagsJson?.tags || tagsJson || [];
        }
      }

      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setTags(Array.isArray(tagsData) ? tagsData : []);

      // Clear any previous errors
      setError('');

    } catch (err) {
      setError(t('admin.messages.load_error') + ': ' + err.message);
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const openCreateModal = () => {
    resetForm();
    setFormData(prev => ({ ...prev, type: activeTab }));
    setShowCreateModal(true);
  };

  const openEditModal = (item) => {
    const itemType = item.created_by ? 'tag' : 'category';
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      type: itemType
    });
    setShowEditModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      return;
    }

    setLoading(true);
    try {
      if (editingItem) {
        // Update
        const id = editingItem._id || editingItem.id;
        const updateData = {
          name: formData.name.trim()
        };

        // Only add description if it has a value
        if (formData.description && formData.description.trim()) {
          updateData.description = formData.description.trim();
        }


        if (formData.type === 'category') {
          await adminApi.updateCategory(id, updateData);
        } else {
          await adminApi.updateTag(id, updateData);
        }

        // Close modal and reload data
        setShowEditModal(false);
        await loadData();
        resetForm();

      } else {
        // Create
        if (formData.type === 'category') {
          await adminApi.createCategory({
            name: formData.name,
            description: formData.description
          });
        } else {
          await adminApi.createTag({
            name: formData.name,
            description: formData.description
          });
        }

        // Close modal and reload data
        setShowCreateModal(false);
        await loadData();
        resetForm();
      }

    } catch (err) {
      // Even if there's an error, close the modal
      if (editingItem) {
        setShowEditModal(false);
      } else {
        setShowCreateModal(false);
      }
      resetForm();
    }
    setLoading(false);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(t('admin.messages.confirm_delete'))) {
      return;
    }

    const id = item._id || item.id;
    const type = item.created_by ? 'tag' : 'category';

    setLoading(true);
    try {
      if (type === 'category') {
        await adminApi.deleteCategory(id);
      } else {
        await adminApi.deleteTag(id);
      }
      await loadData();
    } catch (err) {
      console.error('Delete operation failed:', err);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'category'
    });
    setEditingItem(null);
  };

  const getCurrentData = () => {
    return activeTab === 'category' ? categories : tags;
  };

  const currentData = getCurrentData();

  return (
    <div className="category-management-container">
      {/* Header */}
      <div className="admin-header">
        <h1 className="admin-title">{t('admin.title')}</h1>
        <button
          className="dashboard-btn"
          onClick={() => window.history.back()}
        >
          {t('admin.back_to_dashboard')}
        </button>
      </div>



      {/* Tabs */}
      <div className="admin-tabs">
        <div className="tabs-left">
          <button
            className={`tab-button ${activeTab === 'category' ? 'active' : ''}`}
            onClick={() => setActiveTab('category')}
          >
            {t('admin.category')}
          </button>
          <button
            className={`tab-button ${activeTab === 'tag' ? 'active' : ''}`}
            onClick={() => setActiveTab('tag')}
          >
            {t('admin.tag')}
          </button>
        </div>
        <div className="tabs-right">
          <button className="add-new-btn" onClick={openCreateModal}>
            {activeTab === 'category' ? t('admin.new_category') : t('admin.new_tag')}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="admin-content">

        {/* Table */}
        <div className="data-table-container">
          {loading ? (
            <div className="loading-state">
              <p>{t('admin.loading')}</p>
            </div>
          ) : currentData.length === 0 ? (
            <div className="empty-state">
              <p>{t('admin.no_data')}</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>{activeTab === 'category' ? t('admin.category_name') : t('admin.tag_name')}</th>
                  <th>{t('admin.description')}</th>
                  <th>{t('admin.post_count')}</th>
                  <th>{t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map(item => (
                  <tr key={item._id || item.id} className={!item.is_active ? 'inactive-row' : ''}>
                    <td className="name-cell">
                      <span className="item-name">{item.name}</span>
                    </td>
                    <td className="description-cell">
                      {item.description || '-'}
                    </td>
                    <td className="count-cell">
                      {item.post_count || 0}
                    </td>
                    <td className="actions-cell">
                      <button
                        className="action-btn edit-btn"
                        onClick={() => openEditModal(item)}
                        title={t('admin.edit')}
                      >
                        ✎
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDelete(item)}
                        title={t('admin.delete')}
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{formData.type === 'category' ? t('admin.create_modal.title_category') : t('admin.create_modal.title_tag')}</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>{t('admin.create_modal.name_label')}</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>{t('admin.create_modal.description_label')}</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="form-textarea"
                    rows={3}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? t('admin.create_modal.processing') : t('admin.create_modal.add_button')}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  {t('admin.create_modal.cancel_button')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{formData.type === 'category' ? t('admin.edit_modal.title_category') : t('admin.edit_modal.title_tag')}</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>{t('admin.create_modal.name_label')}</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>{t('admin.create_modal.description_label')}</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="form-textarea"
                    rows={3}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? t('admin.edit_modal.processing') : t('admin.edit_modal.update_button')}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  {t('admin.edit_modal.cancel_button')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;