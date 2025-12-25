import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getReportDetails, processReport } from '../api/reportsApi';
import { Container, Card, LoadingSpinner } from '../components/ui';
import './PostReportDetailPage.css';

/**
 * PostReportDetailPage - Trang chi tiết báo cáo bài viết (Post Report Detail Page)
 */
const PostReportDetailPage = () => {
    const { reportId } = useParams();
    const { t, i18n } = useTranslation();
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [reportData, setReportData] = useState(null);

    useEffect(() => {
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
        } catch (error) {
            console.error('Failed to fetch report details:', error);
            toast.error(t('report.fetch_error'));
            navigate('/admin/report-hub');
        } finally {
            setLoading(false);
        }
    };

    const handleProcessReport = async (action) => {
        setProcessing(true);
        try {
            const result = await processReport(reportId, {
                action: action,
                reason: t('admin.action_processed')
            });
            toast.success(result.message || t('report.processed_successfully'));
            await fetchReportDetails();
        } catch (error) {
            console.error('Failed to process report:', error);
            toast.error(error.response?.data?.detail || t('report.process_error'));
        } finally {
            setProcessing(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return t('common.not_set');
        const date = new Date(dateString);
        return date.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatTimeAgo = (dateString) => {
        if (!dateString) return t('common.not_set');
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) {
            return `${minutes}${t('time.minutes_ago')}`;
        }
        if (hours < 24) {
            return `${hours}${t('time.hours_ago')}`;
        }
        if (days < 7) {
            return `${days}${t('time.days_ago')}`;
        }
        return formatDate(dateString);
    };

    const getReasonCategoryLabel = (category) => {
        const categoryKey = `report.reason.${category}`;
        return t(categoryKey, { defaultValue: category });
    };

    if (loading) {
        return (
            <div className="post-report-detail loading-container">
                <LoadingSpinner size="large" />
            </div>
        );
    }

    if (!reportData) {
        return (
            <div className="post-report-detail">
                <Container>
                    <div className="error-message">
                        {t('report.not_found')}
                    </div>
                </Container>
            </div>
        );
    }

    const { report, reporter, target } = reportData;
    const isResolved = report.status === 'resolved' || report.status === 'dismissed';

    return (
        <div className="post-report-detail">
            <Container size="large">
                {/* Header */}
                <div className="page-header">
                    <h1 className="page-title">
                        {t('report.post_report_detail')}
                    </h1>
                    <button className="back-btn" onClick={() => navigate('/admin/report-hub')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                        {t('report.back_to_list')}
                    </button>
                </div>

                {/* Reporter Information Section */}
                <Card className="report-card">
                    <h2 className="section-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                        {t('report.reporter_info')}
                    </h2>
                    <div className="info-grid">
                        <div className="info-item">
                            <span className="info-label">{t('user.username')}</span>
                            <span className="info-value">{reporter?.name || reporter?.email || t('common.not_set')}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">{t('report.report_date')}</span>
                            <span className="info-value">{formatDate(report.created_at)}</span>
                        </div>
                    </div>
                </Card>

                {/* Post Information Section */}
                <Card className="report-card">
                    <h2 className="section-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        {t('report.post_info')}
                    </h2>
                    <div className="post-content">
                        <div className="post-header">
                            <h3 className="post-title">{target?.title || t('post.untitled')}</h3>
                            <span className="post-time">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                                {formatTimeAgo(target?.created_at)}
                            </span>
                        </div>
                        <p className="post-summary">
                            {target?.content?.substring(0, 200) || t('report.no_content')}
                            {target?.content?.length > 200 && '...'}
                        </p>
                    </div>
                </Card>

                {/* Report Reason Section */}
                <Card className="report-card">
                    <h2 className="section-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        {t('report.reason_title')}
                    </h2>
                    <div className="reason-content">
                        <div className="reason-category-badge">
                            {getReasonCategoryLabel(report.reason_category)}
                        </div>
                        <div className="reason-detail">
                            <span className="detail-label">{t('report.detailed_description')}</span>
                            <p className="detail-content">
                                {report.reason_detail || t('report.no_detail')}
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Attachments Section */}
                <Card className="report-card">
                    <h2 className="section-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                        </svg>
                        {t('report.attachments')}
                    </h2>
                    <div className="attachments-content">
                        {report.evidence_urls && report.evidence_urls.length > 0 ? (
                            <div className="evidence-gallery">
                                {report.evidence_urls.map((url, index) => (
                                    <div key={index} className="evidence-item">
                                        <a href={url} target="_blank" rel="noopener noreferrer">
                                            <img
                                                src={url}
                                                alt={`${t('report.evidence')} ${index + 1}`}
                                                className="evidence-image"
                                            />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-attachments">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                    <polyline points="21 15 16 10 5 21" />
                                </svg>
                                <span>{t('report.no_attachments', 'Không có ảnh đính kèm')}</span>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Action Buttons */}
                {!isResolved && (
                    <Card className="report-card action-card">
                        <h2 className="section-title">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                                <path d="M12 8v4l3 3" />
                            </svg>
                            {t('report.actions', 'Hành động')}
                        </h2>
                        <div className="action-buttons">
                            <button
                                className="action-btn-compact delete-btn"
                                onClick={() => handleProcessReport('delete_post')}
                                disabled={processing}
                                title={t('report.delete_post')}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                                <span>{t('report.delete_post')}</span>
                            </button>
                            <button
                                className="action-btn-compact warn-btn"
                                onClick={() => handleProcessReport('warn_user')}
                                disabled={processing}
                                title={t('report.warn_user')}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                    <line x1="12" y1="9" x2="12" y2="13" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                                <span>{t('report.warn_user')}</span>
                            </button>
                            <button
                                className="action-btn-compact reject-btn"
                                onClick={() => handleProcessReport('no_action')}
                                disabled={processing}
                                title={t('report.reject_report')}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="15" y1="9" x2="9" y2="15" />
                                    <line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                                <span>{t('report.reject_report')}</span>
                            </button>
                        </div>
                    </Card>
                )}

                {isResolved && (
                    <div className="resolved-notice">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        {t('report.already_resolved')}
                    </div>
                )}
            </Container>
        </div>
    );
};

export default PostReportDetailPage;
