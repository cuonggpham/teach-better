import React, { useState, useEffect } from 'react';
import './CategoryManagement.css';
import CategoryCard from './CategoryCard';
import { adminApi } from '../../api/adminApi';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // all, category, tag

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'category' // category hoặc tag
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load dữ liệu khi component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getCategoriesAndTags(true); // Include inactive items
      setCategories(data.categories || []);
      setTags(data.tags || []);
    } catch (err) {
      setError('Lỗi khi tải dữ liệu: ' + (err.response?.data?.detail || err.message));
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

  const handleTypeChange = (e) => {
    setFormData(prev => ({
      ...prev,
      type: e.target.value
    }));
  };

  const handleAddOrUpdate = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Vui lòng nhập tên');
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        // Chỉnh sửa
        if (formData.type === 'category') {
          await adminApi.updateCategory(editingId, {
            name: formData.name,
            description: formData.description
          });
        } else {
          await adminApi.updateTag(editingId, {
            name: formData.name,
            description: formData.description
          });
        }
        setSuccess('Cập nhật thành công!');
      } else {
        // Thêm mới
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
        setSuccess('Thêm mới thành công!');
      }

      resetForm();
      await loadData();
    } catch (err) {
      setError('Lỗi: ' + (err.response?.data?.detail || err.message));
    }
    setLoading(false);
  };

  const handleEdit = (item) => {
    const itemType = item.created_by ? 'tag' : 'category'; // Tags have created_by field
    setEditingId(item._id || item.id);
    setFormData({
      name: item.name,
      description: item.description || '',
      type: itemType
    });
  };

  const handleDelete = async (id, type) => {
    setLoading(true);
    try {
      // Toggle active status (soft delete/restore)
      if (type === 'category') {
        await adminApi.toggleCategoryStatus(id);
      } else {
        await adminApi.toggleTagStatus(id);
      }
      setSuccess('Trạng thái đã được thay đổi!');
      await loadData();
    } catch (err) {
      setError('Lỗi: ' + (err.response?.data?.detail || err.message));
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'category'
    });
    setEditingId(null);
    setError('');
    setSuccess('');
  };

  const getFilteredData = () => {
    if (activeTab === 'category') {
      return categories.map(cat => ({ ...cat, type: 'category' }));
    } else if (activeTab === 'tag') {
      return tags.map(tag => ({ ...tag, type: 'tag' }));
    } else {
      return [
        ...categories.map(cat => ({ ...cat, type: 'category' })),
        ...tags.map(tag => ({ ...tag, type: 'tag' }))
      ];
    }
  };

  const filteredData = getFilteredData();

  return (
    <div className="category-management-container">
      <h2 className="page-title">Quản lý danh mục và tag</h2>

      {/* Alert Messages */}
      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
          <button onClick={() => setError('')} className="alert-close">&times;</button>
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="alert-close">&times;</button>
        </div>
      )}

      <div className="content-wrapper">
        {/* Form Section */}
        <div className="form-section">
          <h3 className="section-title">
            {editingId ? '✎ Chỉnh sửa' : '+ Thêm mới'}
          </h3>

          <form onSubmit={handleAddOrUpdate} className="category-form">
            <div className="form-group">
              <label htmlFor="name">Tên danh mục / Tag *</label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Nhập tên danh mục"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Mô tả</label>
              <textarea
                id="description"
                name="description"
                placeholder="Nhập mô tả"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                className="form-textarea"
              />
            </div>

            <div className="form-group">
              <label htmlFor="type">Loại *</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleTypeChange}
                className="form-select"
                disabled={editingId !== null}
              >
                <option value="category">Danh mục môn học</option>
                <option value="tag">Tag loại bài đăng</option>
              </select>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Đang xử lý...' : editingId ? 'Cập nhật' : 'Thêm mới'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-secondary"
                >
                  Hủy
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List Section */}
        <div className="list-section">
          <div className="section-header">
            <h3 className="section-title">Danh sách danh mục và tag</h3>
            <span className="item-count">({filteredData.length})</span>
          </div>

          {/* Tabs */}
          <div className="tabs-container">
            <button
              className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              Tất cả
            </button>
            <button
              className={`tab-btn ${activeTab === 'category' ? 'active' : ''}`}
              onClick={() => setActiveTab('category')}
            >
              Danh mục môn học ({categories.length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'tag' ? 'active' : ''}`}
              onClick={() => setActiveTab('tag')}
            >
              Tag loại bài ({tags.length})
            </button>
          </div>

          {/* List Items */}
          <div className="items-list">
            {loading && filteredData.length === 0 ? (
              <div className="loading-state">
                <p>Đang tải dữ liệu...</p>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="empty-state">
                <p>🎯 Không có dữ liệu</p>
                <small>Hãy thêm danh mục hoặc tag mới</small>
              </div>
            ) : (
              filteredData.map(item => (
                <CategoryCard
                  key={item._id || item.id}
                  item={item}
                  type={item.type}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryManagement;