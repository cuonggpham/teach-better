import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { getPublicUserInfo } from '../../api/usersApi';
import ReportUserModal from './ReportUserModal';
import './UserInfoPopup.css';

/**
 * UserInfoPopup Component - Hiển thị popup thông tin user khi hover
 * @param {string} userId - ID của user
 * @param {string} userName - Tên hiển thị (fallback)
 * @param {ReactNode} children - Element được wrap
 */
const UserInfoPopup = ({ userId, userName, children }) => {
    const { t, i18n } = useTranslation();
    const { isAuthenticated, user: currentUser } = useAuth();
    const [showPopup, setShowPopup] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });

    const triggerRef = useRef(null);
    const popupRef = useRef(null);
    const hoverTimeoutRef = useRef(null);
    const leaveTimeoutRef = useRef(null);

    // Don't show popup for current user
    const isCurrentUser = currentUser && (currentUser.id === userId || currentUser._id === userId);

    const fetchUserInfo = async () => {
        if (!userId || userInfo) return;

        setLoading(true);
        try {
            const data = await getPublicUserInfo(userId);
            setUserInfo(data);
        } catch (error) {
            console.error('Failed to fetch user info:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculatePosition = () => {
        if (!triggerRef.current) return;

        const rect = triggerRef.current.getBoundingClientRect();
        const popupHeight = 220; // estimated height
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;

        // Prefer below, but go above if not enough space
        const showAbove = spaceBelow < popupHeight && spaceAbove > spaceBelow;
        setPopupPosition({ showAbove });
    };

    const handleMouseEnter = () => {
        if (isCurrentUser) return;

        clearTimeout(leaveTimeoutRef.current);
        hoverTimeoutRef.current = setTimeout(() => {
            calculatePosition();
            setShowPopup(true);
            fetchUserInfo();
        }, 300);
    };

    const handleMouseLeave = () => {
        clearTimeout(hoverTimeoutRef.current);
        leaveTimeoutRef.current = setTimeout(() => {
            setShowPopup(false);
        }, 150);
    };

    const handlePopupMouseEnter = () => {
        clearTimeout(leaveTimeoutRef.current);
    };

    const handlePopupMouseLeave = () => {
        leaveTimeoutRef.current = setTimeout(() => {
            setShowPopup(false);
        }, 150);
    };

    const handleReportClick = (e) => {
        e.stopPropagation();
        setShowPopup(false);
        setShowReportModal(true);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    useEffect(() => {
        return () => {
            clearTimeout(hoverTimeoutRef.current);
            clearTimeout(leaveTimeoutRef.current);
        };
    }, []);

    // Reset user info when userId changes
    useEffect(() => {
        setUserInfo(null);
    }, [userId]);

    return (
        <>
            <span
                ref={triggerRef}
                className="user-info-trigger"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {children}
                {showPopup && !isCurrentUser && (
                    <div
                        ref={popupRef}
                        className={`user-info-popup ${popupPosition.showAbove ? 'popup-above' : 'popup-below'}`}
                        onMouseEnter={handlePopupMouseEnter}
                        onMouseLeave={handlePopupMouseLeave}
                    >
                        {loading ? (
                            <div className="popup-loading">
                                <div className="popup-spinner"></div>
                            </div>
                        ) : userInfo ? (
                            <>
                                <div className="popup-header">
                                    <div className="popup-avatar">
                                        {userInfo.avatar_url ? (
                                            <img src={userInfo.avatar_url} alt={userInfo.name} />
                                        ) : (
                                            <div className="popup-avatar-placeholder">
                                                {(userInfo.name || userName || '?').charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="popup-user-info">
                                        <h4 className="popup-name">{userInfo.name || userName}</h4>
                                    </div>
                                </div>

                                <div className="popup-stats">
                                    <div className="popup-stat-item">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                            <line x1="16" y1="2" x2="16" y2="6"></line>
                                            <line x1="8" y1="2" x2="8" y2="6"></line>
                                            <line x1="3" y1="10" x2="21" y2="10"></line>
                                        </svg>
                                        <span>{t('user.joined', 'Tham gia')}: {formatDate(userInfo.created_at)}</span>
                                    </div>
                                    <div className="popup-stat-item">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                            <line x1="16" y1="13" x2="8" y2="13"></line>
                                            <line x1="16" y1="17" x2="8" y2="17"></line>
                                            <polyline points="10 9 9 9 8 9"></polyline>
                                        </svg>
                                        <span>{userInfo.post_count} {t('user.posts', 'bài viết')}</span>
                                    </div>
                                </div>

                                {isAuthenticated && (
                                    <div className="popup-actions">
                                        <button className="popup-report-btn" onClick={handleReportClick}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                                                <line x1="4" y1="22" x2="4" y2="15"></line>
                                            </svg>
                                            {t('report.report_user', 'Báo cáo người dùng')}
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="popup-error">
                                {t('errors.failed_to_load', 'Không thể tải thông tin')}
                            </div>
                        )}
                    </div>
                )}
            </span>

            <ReportUserModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                userId={userId}
                userName={userInfo?.name || userName}
            />
        </>
    );
};

export default UserInfoPopup;
