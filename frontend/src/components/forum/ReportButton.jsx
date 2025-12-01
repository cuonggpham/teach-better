import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import ReportModal from './ReportModal';
import './ReportButton.css';

/**
 * ReportButton Component - Nút báo cáo vi phạm
 * @param {string} targetType - Loại đối tượng ('post', 'answer', 'comment', 'user')
 * @param {string} targetId - ID của đối tượng
 * @param {string} variant - Kiểu button
 * @param {string} size - Kích thước button
 */
const ReportButton = ({
  targetType,
  targetId,
  variant = 'ghost',
  size = 'small',
  className = '',
}) => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = (e) => {
    e.stopPropagation(); // Prevent click from bubbling to parent elements
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleOpenModal}
        className={`report-button ${className}`}
        title={t('report.button_title')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
          <line x1="4" y1="22" x2="4" y2="15"></line>
        </svg>
      </Button>

      <ReportModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        targetType={targetType}
        targetId={targetId}
      />
    </>
  );
};

export default ReportButton;
