import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, LoadingSpinner } from '../ui';
import { uploadAvatar } from '../../api/profileApi';
import { useAuth } from '../../contexts/AuthContext';
import './AvatarUpload.css';

/**
 * AvatarUpload Component - Upload và hiển thị ảnh đại diện
 */
const AvatarUpload = ({ currentAvatar, userName, onUpload, disabled = false, size = 'large' }) => {
    const { t } = useTranslation();
    const { token, updateUser } = useAuth();
    const fileInputRef = useRef(null);

    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(currentAvatar);
    const [error, setError] = useState('');

    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Vui lòng chọn file hình ảnh');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Kích thước file phải nhỏ hơn 5MB');
            return;
        }

        setError('');
        setIsUploading(true);

        try {
            // Show preview immediately
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreviewUrl(e.target.result);
            };
            reader.readAsDataURL(file);

            // Upload to server
            const result = await uploadAvatar(token, file);

            // Update preview with actual uploaded URL
            setPreviewUrl(result.avatar_url);

            // Notify parent component
            if (onUpload) {
                onUpload(result.avatar_url);
            }

        } catch (error) {
            console.error('Failed to upload avatar:', error);
            setError(error.message || 'Có lỗi khi tải ảnh lên');
            // Reset preview on error
            setPreviewUrl(currentAvatar);
        } finally {
            setIsUploading(false);
        }
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className={`avatar-upload ${size}`}>
            <div className="avatar-container">
                <div className="avatar-preview">
                    {previewUrl ? (
                        <img
                            src={previewUrl}
                            alt="Avatar"
                            className="avatar-image"
                            onError={() => setPreviewUrl(null)}
                        />
                    ) : (
                        <div className="avatar-placeholder">
                            {getInitials(userName)}
                        </div>
                    )}

                    {isUploading && (
                        <div className="upload-overlay">
                            <LoadingSpinner size="small" />
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    className="change-avatar-btn"
                    onClick={handleFileSelect}
                    disabled={isUploading || disabled}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 16L12 7L21 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />

            {error && (
                <p className="upload-error">{error}</p>
            )}

            {/* <p className="upload-hint">
                {t('profile.avatar_hint') || 'Click để thay đổi ảnh đại diện (tối đa 5MB)'}
            </p> */}
        </div>
    );
};

export default AvatarUpload;