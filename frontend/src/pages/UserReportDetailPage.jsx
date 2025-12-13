import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getReportDetails, processReport } from '../api/reportsApi';
import { adminApi } from '../api/adminApi';
import { Container, Card, LoadingSpinner, Button } from '../components/ui';
import './UserReportDetailPage.css';

/**
 * UserReportDetailPage - Trang chi tiết báo cáo vi phạm người dùng
 */
const UserReportDetailPage = () => {
    const { reportId } = useParams();
    const { t, i18n } = useTranslation();
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [reportedUserPosts, setReportedUserPosts] = useState([]);
    const [userReportHistory, setUserReportHistory] = useState([]);

    useEffect(() => {
        // Check if user is admin
        if (!isAuthenticated || user?.role !== 'admin') {
            toast.error(t('admin.access_denied'));
            navigate('/home');
            return;
        }

        fetchReportDetails();
    }, [reportId]);

    const fetchReportDetails = async () => {
        setLoading(true);
        try {
            const data = await getReportDetails(reportId);
            setReportData(data);

            // If report type is 'user', fetch additional data
            if (data?.report?.report_type === 'user' && data?.target?._id) {
                try {
                    // Fetch reported user's recent posts
                    const postsResponse = await adminApi.getUserPosts(data.target._id, { limit: 5 });
                    const posts = postsResponse?.posts || postsResponse || [];
                    setReportedUserPosts(Array.isArray(posts) ? posts : []);
                } catch (err) {
                    console.error('Failed to fetch user posts:', err);
                }
            }
        } catch (error) {
            console.error('Failed to fetch report details:', error);
            toast.error(t('report.fetch_error') || 'Không thể tải chi tiết báo cáo');
            navigate('/admin/reports');
        } finally {
            setLoading(false);
        }
    };

    const handleProcessReport = async (action) => {
        setProcessing(true);
        try {
            const result = await processReport(reportId, {
                action: action,
                reason: t('admin.action_processed') || 'Đã xử lý bởi admin'
            });

            toast.success(result.message || t('report.processed_successfully') || 'Đã xử lý báo cáo thành công');
            await fetchReportDetails();
        } catch (error) {
            console.error('Failed to process report:', error);
            toast.error(error.response?.data?.detail || t('report.process_error') || 'Không thể xử lý báo cáo');
        } finally {
            setProcessing(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatShortDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="user-report-detail loading-container">
                <LoadingSpinner size="large" />
            </div>
        );
    }

    if (!reportData) {
        return (
            <div className="user-report-detail">
                <Container>
                    <div className="error-message">
                        {t('report.not_found') || 'Không tìm thấy báo cáo'}
                    </div>
                </Container>
            </div>
        );
    }

    const { report, reporter, target } = reportData;
    const isResolved = report.status === 'resolved' || report.status === 'dismissed';

    return (
        <div className="user-report-detail">
            <Container size="large">
                {/* Header */}
                <div className="page-header">
                    <h1 className="page-title">
                        {i18n.language === 'vi' ? 'Chi tiết báo cáo người dùng' : 'ユーザー報告詳細'}
                    </h1>
                    <button className="back-btn" onClick={() => navigate('/admin/reports')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                        {i18n.language === 'vi' ? 'Quay lại danh sách' : '一覧に戻る'}
                    </button>
                </div>

                {/* Section 1: Report Information */}
                <Card className="report-section">
                    <h2 className="section-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                            <line x1="4" y1="22" x2="4" y2="15" />
                        </svg>
                        {i18n.language === 'vi' ? 'Thông tin báo cáo' : '報告情報'}
                    </h2>
                    <div className="info-grid two-columns">
                        {/* Reporter Info */}
                        <div className="info-column">
                            <div className="column-header">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                                {i18n.language === 'vi' ? 'Người báo cáo' : '報告者'}
                            </div>
                            <div className="user-info-row">
                                <div className="user-avatar-small">
                                    {reporter?.avatar_url ? (
                                        <img src={reporter.avatar_url} alt={reporter?.name} />
                                    ) : (
                                        <div className="avatar-placeholder-small">
                                            {(reporter?.name || reporter?.email || 'U')[0].toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="user-details">
                                    <span className="user-name">{reporter?.name || 'Unknown'}</span>
                                    <span className="user-email">{reporter?.email || ''}</span>
                                </div>
                            </div>
                            <div className="info-item">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                <span className="info-label">{i18n.language === 'vi' ? 'Ngày báo cáo:' : '報告日時:'}</span>
                                <span className="info-value">{formatDate(report.created_at)}</span>
                            </div>
                        </div>

                        {/* Reported User Info */}
                        <div className="info-column">
                            <div className="column-header">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                                {i18n.language === 'vi' ? 'Người bị báo cáo' : '報告対象ユーザー'}
                            </div>
                            <div className="user-info-row">
                                <div className="user-avatar-small">
                                    {target?.avatar_url ? (
                                        <img src={target.avatar_url} alt={target?.name} />
                                    ) : (
                                        <div className="avatar-placeholder-small">
                                            {(target?.name || target?.email || 'U')[0].toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="user-details">
                                    <span className="user-name">{target?.name || 'Unknown'}</span>
                                    <span className="user-email">{target?.email || ''}</span>
                                </div>
                            </div>
                            <div className="stats-row">
                                <div className="stat-item">
                                    <span className="stat-label">{i18n.language === 'vi' ? 'Ngày đăng ký' : '登録日'}</span>
                                    <span className="stat-value">{target?.created_at ? formatShortDate(target.created_at) : '-'}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">{i18n.language === 'vi' ? 'Số bài đăng' : '投稿数'}</span>
                                    <span className="stat-value">{target?.post_count || 0}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">{i18n.language === 'vi' ? 'Số lần vi phạm' : '違反回数'}</span>
                                    <span className="stat-value violation-count">{target?.violation_count || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Section 2: Detailed Reason */}
                <Card className="report-section">
                    <h2 className="section-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        {i18n.language === 'vi' ? 'Lý do chi tiết' : '詳細な理由'}
                    </h2>
                    <div className="reason-content">
                        {report.reason_detail || t('common.not_set')}
                    </div>
                </Card>

                {/* Section 3: Evidence Attachments */}
                {report.evidence_url && (
                    <Card className="report-section">
                        <h2 className="section-title">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                            </svg>
                            {i18n.language === 'vi' ? 'Bằng chứng đính kèm' : '添付された証拠'}
                        </h2>
                        <div className="evidence-content">
                            <a
                                href={report.evidence_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="evidence-link"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                </svg>
                                {report.evidence_url.length > 50
                                    ? report.evidence_url.substring(0, 50) + '...'
                                    : report.evidence_url}
                            </a>
                        </div>
                    </Card>
                )}

                {/* Section 4: Violation History */}
                <Card className="report-section">
                    <h2 className="section-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                        {i18n.language === 'vi' ? 'Lịch sử vi phạm' : '違反履歴'}
                    </h2>
                    <div className="violation-history">
                        {reportedUserPosts.length > 0 ? (
                            reportedUserPosts.slice(0, 5).map((post) => (
                                <div key={post._id || post.id} className="history-item">
                                    <span className="history-title">{post.title}</span>
                                    <span className="history-date">{formatShortDate(post.created_at)}</span>
                                </div>
                            ))
                        ) : (
                            <div className="no-history">
                                {i18n.language === 'vi' ? 'Không có lịch sử vi phạm' : '違反履歴はありません'}
                            </div>
                        )}
                    </div>
                </Card>

                {/* Section 5: Action Buttons */}
                <Card className="report-section action-section">
                    <h2 className="section-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        {i18n.language === 'vi' ? 'Xử lý hành động' : '処理アクション'}
                    </h2>

                    {isResolved ? (
                        <div className="resolved-notice">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                            {i18n.language === 'vi' ? 'Báo cáo này đã được xử lý' : 'この報告は処理済みです'}
                        </div>
                    ) : (
                        <div className="action-buttons">
                            <button
                                className="action-btn warning-btn"
                                onClick={() => handleProcessReport('no_action')}
                                disabled={processing}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                {i18n.language === 'vi' ? 'Cảnh báo' : '警告'}
                            </button>
                            <button
                                className="action-btn temp-lock-btn"
                                onClick={() => handleProcessReport('ban_user_3_days')}
                                disabled={processing}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                                {i18n.language === 'vi' ? 'Khóa tạm thời' : '一時ロック'}
                            </button>
                            <button
                                className="action-btn perm-lock-btn"
                                onClick={() => handleProcessReport('ban_user_permanent')}
                                disabled={processing}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                                </svg>
                                {i18n.language === 'vi' ? 'Khóa vĩnh viễn' : '永久ロック'}
                            </button>
                            <button
                                className="action-btn reject-btn"
                                onClick={() => handleProcessReport('no_action')}
                                disabled={processing}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                                {i18n.language === 'vi' ? 'Từ chối' : '却下'}
                            </button>
                        </div>
                    )}
                </Card>
            </Container>
        </div>
    );
};

export default UserReportDetailPage;
