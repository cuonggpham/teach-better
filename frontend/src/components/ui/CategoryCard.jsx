import React, { useState } from 'react';
import './CategoryCard.css';

const CategoryCard = ({ item, onEdit, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDelete(item._id, item.type);
    setShowDeleteConfirm(false);
  };

  const handleEditClick = () => {
    onEdit(item);
    setIsEditing(true);
  };

  const getUsageStatus = () => {
    const postCount = item.post_count || 0;
    if (postCount > 0) {
      return {
        text: `✓ Đang dùng (${postCount} bài đăng)`,
        isActive: true
      };
    }
    return {
      text: '✗ Không dùng',
      isActive: false
    };
  };

  const status = getUsageStatus();
  const isActive = item.is_active !== false;

  return (
    <>
      <div className={`category-card ${!isActive ? 'inactive' : ''}`}>
        <div className="card-content">
          <div className="card-header">
            <div className="card-title-section">
              <h4 className="card-title">{item.name}</h4>
              <span className={`type-badge ${item.type === 'category' ? 'badge-category' : 'badge-tag'}`}>
                {item.type === 'category' ? 'Danh mục' : 'Tag'}
              </span>
            </div>
            {!isActive && (
              <span className="disabled-badge">Đã vô hiệu hóa</span>
            )}
          </div>

          {item.description && (
            <p className="card-description">{item.description}</p>
          )}

          <div className="card-stats">
            <div className="stat-item">
              <span className="stat-label">Trạng thái:</span>
              <span className={`stat-badge ${status.isActive ? 'status-active' : 'status-inactive'}`}>
                {status.text}
              </span>
            </div>
            {item.created_at && (
              <div className="stat-item">
                <span className="stat-label">Ngày tạo:</span>
                <span className="stat-value">
                  {new Date(item.created_at).toLocaleDateString('vi-VN')}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="card-actions">
          <button 
            onClick={handleEditClick}
            className="btn btn-small btn-edit"
            title="Chỉnh sửa"
          >
            ✎ Sửa
          </button>
          <button 
            onClick={handleDeleteClick}
            className="btn btn-small btn-delete"
            title="Xóa"
          >
            🗑 Xóa
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>Xác nhận xóa</h3>
              <button 
                className="modal-close"
                onClick={() => setShowDeleteConfirm(false)}
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              {status.isActive ? (
                <>
                  <p className="warning-text">
                    ⚠️ <strong>Cảnh báo:</strong> {item.name} đang được sử dụng bởi <strong>{item.post_count} bài đăng</strong>.
                  </p>
                  <p className="info-text">
                    Xóa sẽ vô hiệu hóa {item.type === 'category' ? 'danh mục' : 'tag'} này, nhưng các bài đăng sẽ được giữ lại.
                  </p>
                </>
              ) : (
                <p className="confirm-text">
                  Bạn có chắc muốn xóa "{item.name}"?
                </p>
              )}
            </div>

            <div className="modal-footer">
              <button 
                onClick={handleConfirmDelete}
                className="btn btn-danger"
              >
                Xóa
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-secondary"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CategoryCard;