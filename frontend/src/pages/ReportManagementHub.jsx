import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useEffect } from 'react';
import { Container, Card } from '../components/ui';
import './ReportManagementHub.css';

/**
 * ReportManagementHub - Trang trung tâm quản lý báo cáo
 * Hiển thị 2 nút: Quản lý báo cáo người dùng và Quản lý báo cáo bài viết/bình luận
 */
const ReportManagementHub = () => {
    const { t, i18n } = useTranslation();
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();

    useEffect(() => {
        // Check if user is admin
        if (!isAuthenticated || user?.role !== 'admin') {
            toast.error(t('admin.access_denied'));
            navigate('/home');
            return;
        }
    }, []);

    const reportTypes = [
        {
            id: 'user-reports',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            ),
            title: i18n.language === 'vi' ? 'Quản lý báo cáo người dùng' : 'ユーザー報告管理',
            path: '/admin/user-reports'
        },
        {
            id: 'post-reports',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                </svg>
            ),
            title: i18n.language === 'vi' ? 'Quản lý báo cáo bài đăng / bình luận' : '投稿・コメント報告管理',
            path: '/admin/reports'
        }
    ];

    return (
        <div className="report-hub">
            <Container size="large">
                <h1 className="report-hub-title">
                    {i18n.language === 'vi' ? 'Quản lý báo cáo' : '報告管理'}
                </h1>

                {/* Report Type Buttons */}
                <Card className="report-hub-section">
                    <h2 className="section-title">
                        {i18n.language === 'vi' ? 'Chọn loại báo cáo' : '報告種類を選択'}
                    </h2>
                    <div className="report-hub-grid">
                        {reportTypes.map((type) => (
                            <button
                                key={type.id}
                                className="report-hub-button"
                                onClick={() => navigate(type.path)}
                            >
                                <span className="report-hub-icon">{type.icon}</span>
                                <span className="report-hub-label">{type.title}</span>
                            </button>
                        ))}
                    </div>
                </Card>
            </Container>
        </div>
    );
};

export default ReportManagementHub;
