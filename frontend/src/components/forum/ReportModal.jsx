import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useToast } from '../../contexts/ToastContext';
import { createReport } from '../../api/reportsApi';
import { uploadImage } from '../../api/imgbbApi';
import './ReportModal.css';

const MAX_IMAGES = 5;

/**
 * ReportModal Component - Modal báo cáo vi phạm
 * @param {boolean} isOpen - Trạng thái mở/đóng modal
 * @param {function} onClose - Callback khi đóng modal
 * @param {string} targetType - Loại đối tượng ('post', 'answer', 'comment', 'user')
 * @param {string} targetId - ID của đối tượng
 */
const ReportModal = ({ isOpen, onClose, targetType, targetId }) => {
  const { t } = useTranslation();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    reasonCategory: '',
    reasonDetail: '',
    evidenceUrls: [],
  });

  const [errors, setErrors] = useState({});

  // Danh sách loại vi phạm
  const violationTypes = [
    { value: 'spam', label: t('report.types.spam') },
    { value: 'inappropriate', label: t('report.types.inappropriate') },
    { value: 'harassment', label: t('report.types.harassment') },
    { value: 'offensive', label: t('report.types.offensive') },
    { value: 'misleading', label: t('report.types.misleading') },
    { value: 'other', label: t('report.types.other') },
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
      newErrors.reasonCategory = t('report.errors.select_type');
    }

    if (!formData.reasonDetail.trim()) {
      newErrors.reasonDetail = t('report.errors.reason_required');
    } else if (formData.reasonDetail.trim().length < 20) {
      newErrors.reasonDetail = t('report.errors.reason_min_length');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Xử lý upload ảnh
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra số lượng ảnh tối đa
    if (formData.evidenceUrls.length >= MAX_IMAGES) {
      error(t('report.errors.max_images', `Tối đa ${MAX_IMAGES} ảnh`));
      return;
    }

    // Kiểm tra kích thước file (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      error(t('report.errors.image_too_large'));
      return;
    }

    // Kiểm tra loại file
    if (!file.type.startsWith('image/')) {
      error(t('report.errors.invalid_image'));
      return;
    }

    try {
      setUploadingImage(true);
      const imageUrl = await uploadImage(file);
      setFormData((prev) => ({
        ...prev,
        evidenceUrls: [...prev.evidenceUrls, imageUrl],
      }));
    } catch (err) {
      error(t('report.errors.upload_failed'));
      console.error('Upload error:', err);
    } finally {
      setUploadingImage(false);
      // Reset input để có thể upload lại cùng file
      e.target.value = '';
    }
  };

  // Xóa ảnh đã upload
  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      evidenceUrls: prev.evidenceUrls.filter((_, i) => i !== index),
    }));
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
        report_type: targetType,
        target_id: targetId,
        reason_category: formData.reasonCategory,
        reason_detail: formData.reasonDetail.trim(),
        evidence_urls: formData.evidenceUrls,
      };

      await createReport(reportData);
      success(t('report.success_message'));
      handleClose();
    } catch (err) {
      console.error('Report error:', err);
      const errorMessage = err?.response?.data?.detail || err?.detail || t('report.error_message');
      error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Reset form và đóng modal
  const handleClose = () => {
    setFormData({
      reasonCategory: '',
      reasonDetail: '',
      evidenceUrls: [],
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('report.title')}>
      <form onSubmit={handleSubmit} className="report-form">
        {/* Loại vi phạm */}
        <div className="form-group">
          <label htmlFor="reasonCategory" className="form-label required">
            {t('report.violation_type')}
          </label>
          <select
            id="reasonCategory"
            name="reasonCategory"
            value={formData.reasonCategory}
            onChange={handleChange}
            className={`form-select ${errors.reasonCategory ? 'error' : ''}`}
            disabled={loading}
          >
            <option value="">{t('report.select_type')}</option>
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
        <Input
          label={t('report.reason_detail')}
          name="reasonDetail"
          as="textarea"
          value={formData.reasonDetail}
          onChange={handleChange}
          placeholder={t('report.reason_placeholder')}
          error={errors.reasonDetail}
          helperText={t('report.reason_hint')}
          disabled={loading}
          rows={5}
          className="reason-textarea"
        />

        {/* Upload ảnh bằng chứng */}
        <div className="form-group">
          <label className="form-label">
            {t('report.evidence')}
            <span className="optional-label"> ({t('common.optional')}) - {formData.evidenceUrls.length}/{MAX_IMAGES}</span>
          </label>

          {/* Preview grid for multiple images */}
          {formData.evidenceUrls.length > 0 && (
            <div className="evidence-grid">
              {formData.evidenceUrls.map((url, index) => (
                <div key={index} className="evidence-preview-item">
                  <img
                    src={url}
                    alt={`Evidence ${index + 1}`}
                    className="evidence-image-thumb"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="remove-image-btn"
                    disabled={loading}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload button - show only if under max */}
          {formData.evidenceUrls.length < MAX_IMAGES && (
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
                    {t('report.uploading')}
                  </>
                ) : (
                  <>
                    <span className="upload-icon">📎</span>
                    {t('report.upload_image')}
                  </>
                )}
              </label>
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
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {t('report.submit')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ReportModal;
