import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getReportDetails, processReport } from '../api/reportsApi';
import { Container, Card, LoadingSpinner, Button } from '../components/ui';
import './PostReportDetailPage.css';

/**
 * PostReportDetailPage - Trang chi tiết báo cáo bài viết
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
    const [actionNotes, setActionNotes] = useState('');

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
        } catch (error) {
            console.error('Failed to fetch report details:', error);
            toast.error(t('report.fetch_error') || 'Failed to fetch report details');
            navigate('/admin');
        } finally {
            setLoading(false);
        }
    };

    const handleProcessReport = async (action) => {
        if (!actionNotes.trim() || actionNotes.trim().length < 10) {
            toast.error(t('report.reason_required') || 'Please provide a reason (minimum 10 characters)');
            return;
        }

        setProcessing(true);
        try {
            const result = await processReport(reportId, {
                action: action,
                reason: actionNotes.trim()
            });

            toast.success(result.message || t('report.processed_successfully') || 'Report processed successfully');

            // Refresh report data
            await fetchReportDetails();
            setActionNotes('');
        } catch (error) {
            console.error('Failed to process report:', error);
            toast.error(error.response?.data?.detail || t('report.process_error') || 'Failed to process report');
        } finally {
            setProcessing(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString(i18n.language, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) {
            return `${minutes} ${t('time.minutes_ago') || 'minutes ago'}`;
        }
        if (hours < 24) {
            return `${hours} ${t('time.hours_ago') || 'hours ago'}`;
        }
        if (days < 7) {
            return `${days} ${t('time.days_ago') || 'days ago'}`;
        }
        return formatDate(dateString);
    };

    const getReasonCategoryLabel = (category) => {
        const labels = {
            spam: t('report.reason.spam') || 'Spam',
            inappropriate: t('report.reason.inappropriate') || 'Inappropriate Content',
            harassment: t('report.reason.harassment') || 'Harassment',
            offensive: t('report.reason.offensive') || 'Offensive Content',
            misleading: t('report.reason.misleading') || 'Misleading Information',
            other: t('report.reason.other') || 'Other'
        };
        return labels[category] || category;
    };

    const getStatusBadgeClass = (status) => {
        const statusClasses = {
            pending: 'status-pending',
            resolved: 'status-resolved',
            dismissed: 'status-dismissed'
        };
        return statusClasses[status] || 'status-pending';
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
                        {t('report.not_found') || 'Report not found'}
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
                    <div className="header-left">
                        <div className="header-icon">🚩</div>
                        <h1 className="page-title">{t('report.detail_title') || 'Post Report Details'}</h1>
                    </div>
                    <div className={`status-badge ${getStatusBadgeClass(report.status)}`}>
                        {report.status.toUpperCase()}
                    </div>
                </div>

                <div className="content-grid">
                    {/* Left Column */}
                    <div className="left-column">
                        {/* Reporter Information */}
                        <Card className="info-card">
                            <h2 className="section-title">{t('report.reporter_info') || 'Reporter Information'}</h2>
                            <div className="info-grid">
                                <div className="info-item">
                                    <div className="info-label">{t('user.username') || 'Username'}</div>
                                    <div className="info-value">{reporter?.name || reporter?.email || 'Unknown'}</div>
                                </div>
                                <div className="info-item">
                                    <div className="info-label">{t('user.user_id') || 'User ID'}</div>
                                    <div className="info-value user-id">{report.reporter_id}</div>
                                </div>
                                <div className="info-item">
                                    <div className="info-label">{t('report.report_date') || 'Report Date'}</div>
                                    <div className="info-value">{formatDate(report.created_at)}</div>
                                </div>
                            </div>
                        </Card>

                        {/* Post Information */}
                        <Card className="info-card">
                            <h2 className="section-title">{t('report.post_info') || 'Post Information'}</h2>

                            {report.report_type === 'post' && target ? (
                                <div className="post-info">
                                    <div className="post-header">
                                        <h3 className="post-title">{target.title || t('post.untitled')}</h3>
                                        <div className="post-meta">
                                            <span className="post-time">{formatTimeAgo(target.created_at)}</span>
                                        </div>
                                    </div>

                                    <div className="post-summary">
                                        {target.content?.substring(0, 200)}
                                        {target.content?.length > 200 && '...'}
                                    </div>

                                    <div className="post-stats">
                                        <div className="stat-item">
                                            <span className="stat-icon">💬</span>
                                            <span className="stat-text">{target.comment_count || 0} {t('post.comments') || 'comments'}</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-icon">👁️</span>
                                            <span className="stat-text">{target.view_count || 0} {t('post.views') || 'views'}</span>
                                        </div>
                                    </div>

                                    {target.tags && target.tags.length > 0 && (
                                        <div className="post-tags">
                                            {target.tags.map((tag, index) => (
                                                <span key={index} className="tag">{tag}</span>
                                            ))}
                                        </div>
                                    )}

                                    {target.related_comments && target.related_comments.length > 0 && (
                                        <div className="related-comments">
                                            <h4 className="comments-title">{t('report.related_comments') || 'Related Comments'}</h4>
                                            {target.related_comments.slice(0, 3).map((comment, index) => (
                                                <div key={index} className="comment-excerpt">
                                                    <div className="comment-author">{comment.author_name}</div>
                                                    <div className="comment-text">{comment.content?.substring(0, 100)}...</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="target-info">
                                    <div className="info-item">
                                        <div className="info-label">{t('report.target_type') || 'Target Type'}</div>
                                        <div className="info-value">{report.report_type}</div>
                                    </div>
                                    <div className="info-item">
                                        <div className="info-label">{t('report.target_id') || 'Target ID'}</div>
                                        <div className="info-value user-id">{report.target_id}</div>
                                    </div>
                                </div>
                            )}
                        </Card>

                        {/* Report Reason */}
                        <Card className="info-card">
                            <h2 className="section-title">{t('report.reason_title') || 'Report Reason'}</h2>

                            <div className="reason-category">
                                <span className="category-label">{t('report.category') || 'Category'}:</span>
                                <span className="category-value">{getReasonCategoryLabel(report.reason_category)}</span>
                            </div>

                            <div className="reason-detail">
                                <div className="detail-label">{t('report.detailed_description') || 'Detailed Description'}</div>
                                <div className="detail-content">{report.reason_detail}</div>
                            </div>
                        </Card>

                        {/* Attachments */}
                        {(report.evidence_urls?.length > 0 || report.evidence_url) && (
                            <Card className="info-card">
                                <h2 className="section-title">{t('report.attachments') || 'Attachments'}</h2>

                                <div className="attachments-grid">
                                    {/* Handle new multi-image format */}
                                    {report.evidence_urls?.map((url, index) => (
                                        <div key={index} className="attachment-item">
                                            <a
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="attachment-link"
                                            >
                                                <img src={url} alt={`Evidence ${index + 1}`} className="attachment-image" />
                                            </a>
                                        </div>
                                    ))}
                                    {/* Backward compatibility: handle old single evidence_url */}
                                    {!report.evidence_urls?.length && report.evidence_url && (
                                        <div className="attachment-item">
                                            <a
                                                href={report.evidence_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="attachment-link"
                                            >
                                                <img src={report.evidence_url} alt="Evidence" className="attachment-image" />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* Right Column - Action Panel */}
                    <div className="right-column">
                        <Card className="action-card">
                            <h2 className="section-title">{t('report.management_actions') || 'Management Actions'}</h2>

                            {isResolved ? (
                                <div className="resolution-info">
                                    <div className="resolution-status">
                                        <span className="resolution-icon">✅</span>
                                        <span className="resolution-text">
                                            {t('report.already_resolved') || 'This report has been resolved'}
                                        </span>
                                    </div>

                                    {report.resolution && (
                                        <>
                                            <div className="resolution-item">
                                                <div className="resolution-label">{t('report.action_taken') || 'Action Taken'}</div>
                                                <div className="resolution-value">{report.resolution.action_taken}</div>
                                            </div>
                                            {report.resolution.notes && (
                                                <div className="resolution-item">
                                                    <div className="resolution-label">{t('report.notes') || 'Notes'}</div>
                                                    <div className="resolution-value">{report.resolution.notes}</div>
                                                </div>
                                            )}
                                            {report.resolution.resolved_at && (
                                                <div className="resolution-item">
                                                    <div className="resolution-label">{t('report.resolved_at') || 'Resolved At'}</div>
                                                    <div className="resolution-value">{formatDate(report.resolution.resolved_at)}</div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div className="action-notes">
                                        <label htmlFor="action-notes" className="notes-label">
                                            {t('report.action_reason') || 'Action Reason'} *
                                        </label>
                                        <textarea
                                            id="action-notes"
                                            className="notes-textarea"
                                            placeholder={t('report.reason_placeholder') || 'Explain the reason for this action (minimum 10 characters)...'}
                                            value={actionNotes}
                                            onChange={(e) => setActionNotes(e.target.value)}
                                            rows={4}
                                            disabled={processing}
                                        />
                                        <div className="notes-hint">
                                            {actionNotes.length}/10 {t('common.characters') || 'characters'}
                                        </div>
                                    </div>

                                    <div className="action-buttons">
                                        <Button
                                            variant="danger"
                                            onClick={() => handleProcessReport('delete_post')}
                                            disabled={processing || actionNotes.trim().length < 10}
                                            className="action-button"
                                        >
                                            <span className="button-icon">🗑️</span>
                                            <span className="button-text">{t('report.delete_post') || 'Delete Post'}</span>
                                        </Button>

                                        <Button
                                            variant="warning"
                                            onClick={() => handleProcessReport('ban_user_3_days')}
                                            disabled={processing || actionNotes.trim().length < 10}
                                            className="action-button"
                                        >
                                            <span className="button-icon">⚠️</span>
                                            <span className="button-text">{t('report.ban_3_days') || 'Ban User (3 Days)'}</span>
                                        </Button>

                                        <Button
                                            variant="warning"
                                            onClick={() => handleProcessReport('ban_user_7_days')}
                                            disabled={processing || actionNotes.trim().length < 10}
                                            className="action-button"
                                        >
                                            <span className="button-icon">⛔</span>
                                            <span className="button-text">{t('report.ban_7_days') || 'Ban User (7 Days)'}</span>
                                        </Button>

                                        <Button
                                            variant="danger"
                                            onClick={() => handleProcessReport('ban_user_permanent')}
                                            disabled={processing || actionNotes.trim().length < 10}
                                            className="action-button"
                                        >
                                            <span className="button-icon">🚫</span>
                                            <span className="button-text">{t('report.ban_permanent') || 'Ban Permanently'}</span>
                                        </Button>

                                        <div className="divider"></div>

                                        <Button
                                            variant="ghost"
                                            onClick={() => handleProcessReport('no_action')}
                                            disabled={processing || actionNotes.trim().length < 10}
                                            className="action-button reject-button"
                                        >
                                            <span className="button-icon">❌</span>
                                            <span className="button-text">{t('report.reject_report') || 'Reject Report'}</span>
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Card>
                    </div>
                </div>
            </Container>
        </div>
    );
};

export default PostReportDetailPage;
