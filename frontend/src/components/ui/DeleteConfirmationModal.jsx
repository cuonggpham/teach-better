import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './DeleteConfirmationModal.css';

/**
 * DeleteConfirmationModal - Popup xác nhận xóa với ô nhập lý do
 * 
 * @param {boolean} isOpen - Hiển thị modal hay không
 * @param {string} title - Tiêu đề modal (e.g., "Xóa bài viết")
 * @param {string} itemName - Tên item đang xóa (để hiển thị)
 * @param {function} onConfirm - Callback khi xác nhận (reason: string) => void
 * @param {function} onCancel - Callback khi hủy
 * @param {boolean} loading - Trạng thái đang xử lý
 */
const DeleteConfirmationModal = ({
    isOpen,
    title,
    itemName,
    onConfirm,
    onCancel,
    loading = false
}) => {
    const { t } = useTranslation();
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    const handleConfirm = () => {
        if (!reason.trim()) {
            setError(t('admin.delete_confirmation.reason_required', 'Vui lòng nhập lý do xóa'));
            return;
        }
        onConfirm(reason.trim());
    };

    const handleCancel = () => {
        setReason('');
        setError('');
        onCancel();
    };

    const handleReasonChange = (e) => {
        setReason(e.target.value);
        if (error) setError('');
    };

    if (!isOpen) return null;

    return (
        <div className="delete-modal-overlay" onClick={handleCancel}>
            <div className="delete-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="delete-modal-header">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                    <h2>{title || t('admin.delete_confirmation.title', 'Xác nhận xóa')}</h2>
                </div>

                {itemName && (
                    <div className="delete-modal-item">
                        <p>{t('admin.delete_confirmation.deleting', 'Bạn đang xóa')}:</p>
                        <strong>{itemName}</strong>
                    </div>
                )}

                <div className="delete-modal-body">
                    <label htmlFor="delete-reason">
                        {t('admin.delete_confirmation.reason_label', 'Lý do xóa')} <span className="required">*</span>
                    </label>
                    <textarea
                        id="delete-reason"
                        value={reason}
                        onChange={handleReasonChange}
                        placeholder={t('admin.delete_confirmation.reason_placeholder', 'Bài đăng này đã bị xóa vì chứa nội dung không phù hợp.')}
                        rows={4}
                        disabled={loading}
                    />
                    {error && <span className="delete-modal-error">{error}</span>}
                </div>

                <div className="delete-modal-warning">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <span>{t('admin.delete_warning', 'Hành động này không thể hoàn tác.')}</span>
                </div>

                <div className="delete-modal-actions">
                    <button
                        type="button"
                        className="cancel-btn"
                        onClick={handleCancel}
                        disabled={loading}
                    >
                        {t('admin.delete_confirmation.cancel', 'Hủy')}
                    </button>
                    <button
                        type="button"
                        className="confirm-btn"
                        onClick={handleConfirm}
                        disabled={loading || !reason.trim()}
                    >
                        {loading ? (
                            <>
                                <span className="loading-spinner"></span>
                                {t('admin.deleting', 'Đang xóa...')}
                            </>
                        ) : (
                            t('admin.delete_confirmation.confirm', 'Xác nhận')
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;
