import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useToast } from '../../contexts/ToastContext';
import { createReport } from '../../api/reportsApi';
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

    const [formData, setFormData] = useState({
        reasonDetail: '',
    });

    const [errors, setErrors] = useState({});

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

        if (!formData.reasonDetail.trim()) {
            newErrors.reasonDetail = t('report.errors.reason_required', 'Vui lòng nhập lý do');
        } else if (formData.reasonDetail.trim().length < 20) {
            newErrors.reasonDetail = t('report.errors.reason_min_length', 'Lý do phải có ít nhất 20 ký tự');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
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
                reason_detail: formData.reasonDetail.trim(),
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
            reasonDetail: '',
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
