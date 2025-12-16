import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useToast } from '../../contexts/ToastContext';
import { createReport } from '../../api/reportsApi';
import { uploadImage } from '../../api/imgbbApi';
import './ReportUserModal.css';

/**
 * ReportUserModal Component - Modal báo cáo người dùng vi phạm
 * @param {boolean} isOpen - Trạng thái mở/đóng modal
 * @param {function} onClose - Callback khi đóng modal
 * @param {string} userId - ID của user bị báo cáo
 * @param {string} userName - Tên của user bị báo cáo
 */
const ReportUserModal = ({ isOpen, onClose, userId, userName }) => {
    const { t } = useTranslation();
    const { success, error } = useToast();
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const [formData, setFormData] = useState({
        reasonCategory: '',
        reasonDetail: '',
        evidenceUrl: '',
    });

    const [errors, setErrors] = useState({});

    // Danh sách loại vi phạm cho user
    const violationTypes = [
        { value: 'harassment', label: t('report.types.harassment', 'Quấy rối') },
        { value: 'spam', label: t('report.types.spam', 'Spam') },
        { value: 'inappropriate', label: t('report.types.inappropriate', 'Nội dung không phù hợp') },
        { value: 'offensive', label: t('report.types.offensive', 'Xúc phạm') },
        { value: 'misleading', label: t('report.types.misleading', 'Thông tin sai lệch') },
        { value: 'other', label: t('report.types.other', 'Khác') },
    ];

    // Xử lý thay đổi input
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Xóa lỗi khi người dùng nhập
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    // Validate form
    const validate = () => {
        const newErrors = {};

        if (!formData.reasonCategory) {
            newErrors.reasonCategory = t('report.errors.select_type', 'Vui lòng chọn loại vi phạm');
        }

        if (!formData.reasonDetail.trim()) {
            newErrors.reasonDetail = t('report.errors.reason_required', 'Vui lòng nhập lý do');
        } else if (formData.reasonDetail.trim().length < 20) {
            newErrors.reasonDetail = t('report.errors.reason_min_length', 'Lý do phải có ít nhất 20 ký tự');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Xử lý upload ảnh
    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Kiểm tra kích thước file (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            error(t('report.errors.image_too_large', 'Ảnh phải nhỏ hơn 5MB'));
            return;
        }

        // Kiểm tra loại file
        if (!file.type.startsWith('image/')) {
            error(t('report.errors.invalid_image', 'File không phải là ảnh'));
            return;
        }

        try {
            setUploadingImage(true);
            const imageUrl = await uploadImage(file);
            setFormData((prev) => ({ ...prev, evidenceUrl: imageUrl }));
        } catch (err) {
            error(t('report.errors.upload_failed', 'Tải ảnh thất bại'));
            console.error('Upload error:', err);
        } finally {
            setUploadingImage(false);
        }
    };

    // Xóa ảnh đã upload
    const handleRemoveImage = () => {
        setFormData((prev) => ({ ...prev, evidenceUrl: '' }));
    };

    // Xử lý submit form
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        try {
            setLoading(true);

            const reportData = {
                report_type: 'user',
                target_id: userId,
                reason_category: formData.reasonCategory,
                reason_detail: formData.reasonDetail.trim(),
                evidence_url: formData.evidenceUrl || undefined,
            };

            await createReport(reportData);
            success(t('report.success_message', 'Báo cáo đã được gửi thành công'));
            handleClose();
        } catch (err) {
            console.error('Report error:', err);
            error(err?.detail || t('report.error_message', 'Gửi báo cáo thất bại'));
        } finally {
            setLoading(false);
        }
    };

    // Reset form và đóng modal
    const handleClose = () => {
        setFormData({
            reasonCategory: '',
            reasonDetail: '',
            evidenceUrl: '',
        });
        setErrors({});
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={t('report.report_user_title', 'Báo cáo người dùng')}
        >
            <div className="report-user-modal">
                {/* User being reported */}
                <div className="reported-user-info">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>{t('report.reporting_user', 'Báo cáo')}: <strong>{userName || 'User'}</strong></span>
                </div>

                <form onSubmit={handleSubmit} className="report-user-form">
                    {/* Loại vi phạm */}
                    <div className="form-group">
                        <label htmlFor="reasonCategory" className="form-label required">
                            {t('report.violation_type', 'Loại vi phạm')}
                        </label>
                        <select
                            id="reasonCategory"
                            name="reasonCategory"
                            value={formData.reasonCategory}
                            onChange={handleChange}
                            className={`form-select ${errors.reasonCategory ? 'error' : ''}`}
                            disabled={loading}
                        >
                            <option value="">{t('report.select_type', 'Chọn loại vi phạm')}</option>
                            {violationTypes.map((type) => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                        {errors.reasonCategory && (
                            <span className="error-message">{errors.reasonCategory}</span>
                        )}
                    </div>

                    {/* Lý do chi tiết */}
                    <div className="form-group">
                        <label htmlFor="reasonDetail" className="form-label required">
                            {t('report.reason_detail', 'Lý do chi tiết')}
                        </label>
                        <Input
                            id="reasonDetail"
                            name="reasonDetail"
                            as="textarea"
                            value={formData.reasonDetail}
                            onChange={handleChange}
                            placeholder={t('report.user_reason_placeholder', 'Mô tả chi tiết hành vi vi phạm của người dùng này...')}
                            error={errors.reasonDetail}
                            disabled={loading}
                            rows={5}
                            className="reason-textarea"
                        />
                        <span className="form-hint">
                            {t('report.reason_hint', 'Tối thiểu 20 ký tự')}
                        </span>
                    </div>

                    {/* Upload ảnh bằng chứng */}
                    <div className="form-group">
                        <label className="form-label">
                            {t('report.evidence', 'Ảnh bằng chứng')}
                            <span className="optional-label"> ({t('common.optional', 'Tùy chọn')})</span>
                        </label>

                        {!formData.evidenceUrl ? (
                            <div className="upload-area">
                                <input
                                    type="file"
                                    id="evidence-upload"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={loading || uploadingImage}
                                    className="file-input"
                                />
                                <label
                                    htmlFor="evidence-upload"
                                    className={`upload-label ${uploadingImage || loading ? 'disabled' : ''
                                        }`}
                                >
                                    {uploadingImage ? (
                                        <>
                                            <span className="upload-spinner"></span>
                                            {t('report.uploading', 'Đang tải...')}
                                        </>
                                    ) : (
                                        <>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                                <polyline points="17 8 12 3 7 8"></polyline>
                                                <line x1="12" y1="3" x2="12" y2="15"></line>
                                            </svg>
                                            {t('report.upload_image', 'Tải ảnh lên')}
                                        </>
                                    )}
                                </label>
                            </div>
                        ) : (
                            <div className="evidence-preview">
                                <img
                                    src={formData.evidenceUrl}
                                    alt="Evidence"
                                    className="evidence-image"
                                />
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="remove-image-btn"
                                    disabled={loading}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Buttons */}
                    <div className="form-actions">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={loading}
                        >
                            {t('common.cancel', 'Hủy')}
                        </Button>
                        <Button type="submit" variant="primary" loading={loading}>
                            {t('report.submit', 'Gửi báo cáo')}
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default ReportUserModal;
