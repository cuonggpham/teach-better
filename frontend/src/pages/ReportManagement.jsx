import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getAllReports } from '../api/reportsApi';
import { Container, Card, LoadingSpinner, Button } from '../components/ui';
import './ReportManagement.css';

/**
 * ReportManagement - Trang quản lý báo cáo vi phạm
 */
const ReportManagement = () => {
    const { t, i18n } = useTranslation();
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [reports, setReports] = useState([]);
    const [filter, setFilter] = useState({
        status: 'all',
        type: 'all'
    });
    const [currentPage, setCurrentPage] = useState(0);
    const reportsPerPage = 20;

    useEffect(() => {
        // Check if user is admin
        if (!isAuthenticated || user?.role !== 'admin') {
            toast.error(t('admin.access_denied'));
            navigate('/home');
            return;
        }

        fetchReports();
    }, [filter]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const params = {
                skip: 0,
                limit: 100
            };

            if (filter.status !== 'all') {
                params.status = filter.status;
            }

            if (filter.type !== 'all') {
                params.type = filter.type;
            }

            const data = await getAllReports(params);
            setReports(data || []);
            setCurrentPage(0);
        } catch (error) {
            console.error('Failed to fetch reports:', error);
            toast.error(t('report.fetch_error', 'Không thể tải danh sách báo cáo'));
            setReports([]);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'ja-JP', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getReasonCategoryLabel = (category) => {
        const labels = {
            spam: 'Spam',
            inappropriate: i18n.language === 'vi' ? 'Nội dung không phù hợp' : '不適切なコンテンツ',
            harassment: i18n.language === 'vi' ? 'Quấy rối' : '嫌がらせ',
            offensive: i18n.language === 'vi' ? 'Xúc phạm' : '攻撃的',
            misleading: i18n.language === 'vi' ? 'Thông tin sai lệch' : '誤った情報',
            other: i18n.language === 'vi' ? 'Khác' : 'その他'
        };
        return labels[category] || category;
    };

    const getTypeLabel = (type) => {
        const labels = {
            post: i18n.language === 'vi' ? 'Bài viết' : '投稿',
            answer: i18n.language === 'vi' ? 'Câu trả lời' : '回答',
            comment: i18n.language === 'vi' ? 'Bình luận' : 'コメント',
            user: i18n.language === 'vi' ? 'Người dùng' : 'ユーザー'
        };
        return labels[type] || type;
    };

    const getStatusLabel = (status) => {
        const labels = {
            pending: i18n.language === 'vi' ? 'Đang chờ' : '保留中',
            resolved: i18n.language === 'vi' ? 'Đã xử lý' : '解決済み',
            dismissed: i18n.language === 'vi' ? 'Đã từ chối' : '却下'
        };
        return labels[status] || status;
    };

    const getStatusBadgeClass = (status) => {
        const statusClasses = {
            pending: 'status-pending',
            resolved: 'status-resolved',
            dismissed: 'status-dismissed'
        };
        return statusClasses[status] || 'status-pending';
    };

    const handleViewReport = (report) => {
        if (report.report_type === 'user') {
            navigate(`/admin/user-reports/${report._id}`);
        } else {
            navigate(`/admin/reports/${report._id}`);
        }
    };

    // Pagination
    const paginatedReports = reports.slice(
        currentPage * reportsPerPage,
        (currentPage + 1) * reportsPerPage
    );
    const totalPages = Math.ceil(reports.length / reportsPerPage);

    if (loading) {
        return (
            <div className="report-management loading-container">
                <LoadingSpinner size="large" />
            </div>
        );
    }

    return (
        <div className="report-management">
            <Container size="large">
                {/* Header */}
                <div className="page-header">
                    <div className="header-left">
                        <div className="header-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                                <line x1="4" y1="22" x2="4" y2="15" />
                            </svg>
                        </div>
                        <h1 className="page-title">
                            {i18n.language === 'vi' ? 'Quản lý báo cáo' : '報告管理'}
                        </h1>
                    </div>
                </div>

                {/* Filters */}
                <Card className="filters-card">
                    <div className="filters-grid">
                        <div className="filter-group">
                            <label className="filter-label">
                                {i18n.language === 'vi' ? 'Lọc theo trạng thái' : 'ステータス'}
                            </label>
                            <select
                                className="filter-select"
                                value={filter.status}
                                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                            >
                                <option value="all">{i18n.language === 'vi' ? 'Tất cả' : 'すべて'}</option>
                                <option value="pending">{i18n.language === 'vi' ? 'Đang chờ' : '保留中'}</option>
                                <option value="resolved">{i18n.language === 'vi' ? 'Đã xử lý' : '解決済み'}</option>
                                <option value="dismissed">{i18n.language === 'vi' ? 'Đã từ chối' : '却下'}</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label className="filter-label">
                                {i18n.language === 'vi' ? 'Lọc theo loại' : 'タイプ'}
                            </label>
                            <select
                                className="filter-select"
                                value={filter.type}
                                onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                            >
                                <option value="all">{i18n.language === 'vi' ? 'Tất cả' : 'すべて'}</option>
                                <option value="post">{i18n.language === 'vi' ? 'Bài viết' : '投稿'}</option>
                                <option value="answer">{i18n.language === 'vi' ? 'Câu trả lời' : '回答'}</option>
                                <option value="comment">{i18n.language === 'vi' ? 'Bình luận' : 'コメント'}</option>
                                <option value="user">{i18n.language === 'vi' ? 'Người dùng' : 'ユーザー'}</option>
                            </select>
                        </div>

                        <div className="filter-stats">
                            <div className="stat-item">
                                <span className="stat-value">{reports.length}</span>
                                <span className="stat-label">
                                    {i18n.language === 'vi' ? 'Tổng số báo cáo' : '総報告数'}
                                </span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">
                                    {reports.filter(r => r.status === 'pending').length}
                                </span>
                                <span className="stat-label">
                                    {i18n.language === 'vi' ? 'Đang chờ xử lý' : '保留中'}
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Reports List */}
                <Card className="reports-list-card">
                    {paginatedReports.length === 0 ? (
                        <div className="no-reports">
                            <svg className="no-reports-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                                <rect x="9" y="3" width="6" height="4" rx="1" />
                                <line x1="9" y1="12" x2="15" y2="12" />
                                <line x1="9" y1="16" x2="15" y2="16" />
                            </svg>
                            <p className="no-reports-text">
                                {i18n.language === 'vi' ? 'Không có báo cáo nào' : '報告がありません'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="reports-table">
                                <div className="table-header">
                                    <div className="col-type">{i18n.language === 'vi' ? 'Loại' : 'タイプ'}</div>
                                    <div className="col-category">{i18n.language === 'vi' ? 'Danh mục' : 'カテゴリー'}</div>
                                    <div className="col-reason">{i18n.language === 'vi' ? 'Lý do' : '理由'}</div>
                                    <div className="col-date">{i18n.language === 'vi' ? 'Ngày báo cáo' : '報告日'}</div>
                                    <div className="col-status">{i18n.language === 'vi' ? 'Trạng thái' : 'ステータス'}</div>
                                    <div className="col-actions">{i18n.language === 'vi' ? 'Thao tác' : '操作'}</div>
                                </div>

                                <div className="table-body">
                                    {paginatedReports.map((report) => (
                                        <div key={report._id} className="table-row">
                                            <div className="col-type">
                                                <span className={`type-badge type-${report.report_type}`}>
                                                    {getTypeLabel(report.report_type)}
                                                </span>
                                            </div>
                                            <div className="col-category">
                                                {getReasonCategoryLabel(report.reason_category)}
                                            </div>
                                            <div className="col-reason">
                                                <span className="reason-text">
                                                    {report.reason_detail.length > 50
                                                        ? `${report.reason_detail.substring(0, 50)}...`
                                                        : report.reason_detail}
                                                </span>
                                            </div>
                                            <div className="col-date">
                                                {formatDate(report.created_at)}
                                            </div>
                                            <div className="col-status">
                                                <span className={`status-badge ${getStatusBadgeClass(report.status)}`}>
                                                    {getStatusLabel(report.status)}
                                                </span>
                                            </div>
                                            <div className="col-actions">
                                                <button
                                                    className="view-btn"
                                                    onClick={() => handleViewReport(report)}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                        <circle cx="12" cy="12" r="3" />
                                                    </svg>
                                                    {i18n.language === 'vi' ? 'Xem chi tiết' : '詳細'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="pagination">
                                    <button
                                        className="pagination-btn"
                                        onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                                        disabled={currentPage === 0}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="15 18 9 12 15 6" />
                                        </svg>
                                        {i18n.language === 'vi' ? 'Trước' : '前へ'}
                                    </button>
                                    <span className="pagination-info">
                                        {i18n.language === 'vi' ? 'Trang' : 'ページ'} {currentPage + 1} / {totalPages}
                                    </span>
                                    <button
                                        className="pagination-btn"
                                        onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                                        disabled={currentPage === totalPages - 1}
                                    >
                                        {i18n.language === 'vi' ? 'Sau' : '次へ'}
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="9 18 15 12 9 6" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </Card>
            </Container>
        </div>
    );
};

export default ReportManagement;
