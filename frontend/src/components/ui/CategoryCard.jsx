import React, { useState } from 'react';
import './CategoryCard.css';

const CategoryCard = ({ item, type, onEdit, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDelete(item._id || item.id, type || item.type);
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
              <span className={`type-badge ${(type || item.type) === 'category' ? 'badge-category' : 'badge-tag'}`}>
                {(type || item.type) === 'category' ? 'Danh mục' : 'Tag'}
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
            className={`btn btn-small ${isActive ? 'btn-delete' : 'btn-restore'}`}
            title={isActive ? 'Vô hiệu hóa' : 'Kích hoạt lại'}
          >
            {isActive ? '🚫 Vô hiệu hóa' : '✅ Kích hoạt'}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>{isActive ? 'Xác nhận vô hiệu hóa' : 'Xác nhận kích hoạt'}</h3>
              <button
                className="modal-close"
                onClick={() => setShowDeleteConfirm(false)}
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              {isActive ? (
                <>
                  <p className="warning-text">
                    ⚠️ <strong>Xác nhận vô hiệu hóa:</strong> {item.name}
                  </p>
                  {status.isActive && (
                    <p className="info-text">
                      {(type || item.type) === 'category' ? 'Danh mục' : 'Tag'} này đang được sử dụng bởi <strong>{item.post_count} bài đăng</strong>.
                      Vô hiệu hóa sẽ ẩn nó khỏi danh sách, nhưng các bài đăng hiện tại sẽ được giữ nguyên.
                    </p>
                  )}
                </>
              ) : (
                <p className="confirm-text">
                  Bạn có chắc muốn kích hoạt lại "{item.name}"?
                </p>
              )}
            </div>

            <div className="modal-footer">
              <button
                onClick={handleConfirmDelete}
                className={`btn ${isActive ? 'btn-warning' : 'btn-success'}`}
              >
                {isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
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