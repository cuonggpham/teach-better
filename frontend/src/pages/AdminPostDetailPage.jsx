import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getPost } from '../api/postsApi';
import { getAnswers } from '../api/answersApi';
import { adminApi } from '../api/adminApi';
import { Container, Card, LoadingSpinner } from '../components/ui';
import DeleteConfirmationModal from '../components/ui/DeleteConfirmationModal';
import { formatDateTime } from '../utils/formatters';
import './AdminPostDetailPage.css';

/**
 * AdminPostDetailPage - Trang chi tiết bài viết cho admin
 * Không có nút Bookmark và Report, thay vào đó là nút xóa cho post/answer/comment
 */
const AdminPostDetailPage = () => {
    const { t, i18n } = useTranslation();
    const { postId } = useParams();
    const navigate = useNavigate();
    const { token, user } = useAuth();
    const toast = useToast();

    const [post, setPost] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Delete modal states
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        type: null, // 'post', 'answer', 'comment'
        targetId: null,
        answerId: null, // for comment deletion
        title: '',
        itemName: ''
    });
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        // Check if user is admin
        if (user && user.role !== 'admin') {
            navigate('/admin/posts');
            return;
        }

        if (postId) {
            fetchPost();
            fetchAnswers();
        }
    }, [postId, user]);

    const fetchPost = async () => {
        try {
            const data = await getPost(postId, token);
            setPost(data);
        } catch (error) {
            console.error('Failed to fetch post:', error);
            setError(error.message || t('errors.not_found'));
        } finally {
            setLoading(false);
        }
    };

    const fetchAnswers = async () => {
        try {
            const data = await getAnswers(postId, token);
            setAnswers(data);
        } catch (error) {
            console.error('Failed to fetch answers:', error);
        }
    };

    // Open delete modal for different types
    const openDeleteModal = (type, targetId, answerId = null, itemName = '') => {
        let title = '';
        switch (type) {
            case 'post':
                title = t('admin.delete_confirmation.post_title', 'Xóa bài viết');
                break;
            case 'answer':
                title = t('admin.delete_confirmation.answer_title', 'Xóa câu trả lời');
                break;
            case 'comment':
                title = t('admin.delete_confirmation.comment_title', 'Xóa bình luận');
                break;
            default:
                title = t('admin.delete_confirmation.title', 'Xác nhận xóa');
        }

        setDeleteModal({
            isOpen: true,
            type,
            targetId,
            answerId,
            title,
            itemName
        });
    };

    const closeDeleteModal = () => {
        setDeleteModal({
            isOpen: false,
            type: null,
            targetId: null,
            answerId: null,
            title: '',
            itemName: ''
        });
    };

    const handleDelete = async (reason) => {
        setDeleting(true);
        try {
            switch (deleteModal.type) {
                case 'post':
                    await adminApi.deletePost(deleteModal.targetId);
                    toast.success(t('admin.messages.delete_success', 'Xóa thành công!'));
                    navigate('/admin/posts');
                    break;

                case 'answer':
                    await adminApi.deleteAnswerByAdmin(deleteModal.targetId, reason);
                    toast.success(t('admin.messages.delete_success', 'Xóa thành công!'));
                    await fetchAnswers();
                    await fetchPost(); // Refresh post to update answer count
                    break;

                case 'comment':
                    await adminApi.deleteCommentByAdmin(deleteModal.answerId, deleteModal.targetId, reason);
                    toast.success(t('admin.messages.delete_success', 'Xóa thành công!'));
                    await fetchAnswers();
                    break;

                default:
                    break;
            }
            closeDeleteModal();
        } catch (error) {
            console.error('Failed to delete:', error);
            toast.error(t('admin.messages.delete_error', 'Không thể xóa'));
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-post-detail-page">
                <Container size="large">
                    <div className="post-loading">
                        <LoadingSpinner size="large" />
                    </div>
                </Container>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="admin-post-detail-page">
                <Container size="large">
                    <Card variant="elevated" padding="large">
                        <p>{error || t('errors.not_found')}</p>
                        <button onClick={() => navigate('/admin/posts')} className="back-btn">
                            {t('common.back', 'Quay lại')}
                        </button>
                    </Card>
                </Container>
            </div>
        );
    }

    return (
        <div className="admin-post-detail-page">
            <Container size="large">
                {/* Header with back button */}
                <div className="admin-post-header">
                    <button onClick={() => navigate('/admin/posts')} className="back-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                        {t('common.back', 'Quay lại')}
                    </button>
                    <h1>{t('admin.post_detail', 'Chi tiết bài viết')}</h1>
                </div>

                {/* Post Content */}
                <Card variant="elevated" padding="large" className="post-detail-card">
                    <div className="post-detail-layout">
                        <div className="post-detail-content">
                            <div className="post-detail-header">
                                <h2 className="post-detail-title">{post.title}</h2>
                                <div className="post-actions">
                                    <button
                                        className="delete-btn"
                                        onClick={() => openDeleteModal('post', post._id, null, post.title)}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                            <line x1="10" y1="11" x2="10" y2="17" />
                                            <line x1="14" y1="11" x2="14" y2="17" />
                                        </svg>
                                        {t('common.delete', 'Xóa')}
                                    </button>
                                </div>
                            </div>

                            <div className="post-detail-meta">
                                {post.author && (
                                    <span className="post-author">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                        {post.author.name || post.author.email}
                                    </span>
                                )}
                                <span className="post-stats">
                                    {post.answer_count || 0} {t('post.answers', 'câu trả lời')} •{' '}
                                    {post.view_count || 0} {t('post.views', 'lượt xem')}
                                </span>
                                <span className="post-date">{formatDateTime(post.created_at, i18n.language)}</span>
                            </div>

                            <div className="post-detail-body">
                                <p>{post.content}</p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Answers List */}
                <div className="answers-section">
                    <h2 className="answers-title">
                        {t('answer.list', 'Câu trả lời')} ({answers.length})
                    </h2>

                    {answers.length === 0 ? (
                        <Card variant="outlined" padding="large" className="no-answers">
                            <p>{t('answer.no_answers', 'Chưa có câu trả lời nào.')}</p>
                        </Card>
                    ) : (
                        <div className="answers-list">
                            {answers.map((answer) => (
                                <Card key={answer._id} variant="elevated" padding="large" className="answer-card">
                                    <div className="answer-layout">
                                        <div className="answer-content">
                                            <div className="answer-header">
                                                <div className="answer-meta">
                                                    <span className="answer-author">
                                                        {t('answer.by', 'Bởi')} {answer.author_name || t('common.anonymous', 'Ẩn danh')}
                                                    </span>
                                                    <span className="answer-date">{formatDateTime(answer.created_at, i18n.language)}</span>
                                                </div>
                                                <button
                                                    className="delete-btn small"
                                                    onClick={() => openDeleteModal('answer', answer._id, null, answer.content?.substring(0, 50) + '...')}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polyline points="3 6 5 6 21 6" />
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                    </svg>
                                                    {t('common.delete', 'Xóa')}
                                                </button>
                                            </div>

                                            <div className="answer-body">
                                                <p>{answer.content}</p>
                                            </div>

                                            {/* Comments */}
                                            {answer.comments && answer.comments.length > 0 && (
                                                <div className="comments-section">
                                                    <h4 className="comments-title">
                                                        {t('comment.title', 'Bình luận')} ({answer.comments.length})
                                                    </h4>
                                                    <div className="comments-list">
                                                        {answer.comments.map((comment) => (
                                                            <div key={comment.id} className="comment-item">
                                                                <div className="comment-content">
                                                                    <div className="comment-meta">
                                                                        <span className="comment-author">
                                                                            {comment.author_name || t('common.anonymous', 'Ẩn danh')}
                                                                        </span>
                                                                        <span className="comment-date">
                                                                            {formatDateTime(comment.created_at, i18n.language)}
                                                                        </span>
                                                                    </div>
                                                                    <p className="comment-text">{comment.content}</p>
                                                                </div>
                                                                <button
                                                                    className="delete-btn tiny"
                                                                    onClick={() => openDeleteModal('comment', comment.id, answer._id, comment.content?.substring(0, 30) + '...')}
                                                                >
                                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                        <polyline points="3 6 5 6 21 6" />
                                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </Container>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                title={deleteModal.title}
                itemName={deleteModal.itemName}
                onConfirm={handleDelete}
                onCancel={closeDeleteModal}
                loading={deleting}
            />
        </div>
    );
};

export default AdminPostDetailPage;
