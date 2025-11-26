import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getPost, votePost } from '../api/postsApi';
import { getAnswers, createAnswer, voteAnswer } from '../api/answersApi';
import { Container, Card, Button, Input, LoadingSpinner } from '../components/ui';
import { VoteButton, BookmarkButton, CommentSection } from '../components/forum';
import { formatDateTime } from '../utils/formatters';
import './PostDetailPage.css';

/**
 * PostDetailPage - Trang chi tiết bài viết với answers và comments
 */
const PostDetailPage = () => {
  const { t } = useTranslation();
  const { postId } = useParams();
  const navigate = useNavigate();
  const { token, isAuthenticated, user } = useAuth();
  const toast = useToast();
  const [post, setPost] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [newAnswer, setNewAnswer] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (postId) {
      fetchPost();
      fetchAnswers();
    }
  }, [postId]);

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

  const handlePostVote = async (isUpvote) => {
    if (!isAuthenticated || !token) {
      toast.warning(t('auth.login_required'));
      navigate('/signin');
      return;
    }

    try {
      const updatedPost = await votePost(token, postId, isUpvote);
      setPost(updatedPost);
      toast.success(t('post.vote_success'));
    } catch (error) {
      console.error('Failed to vote:', error);
      toast.error(t('post.vote_error'));
    }
  };

  const handleAnswerVote = async (answerId, isUpvote) => {
    if (!isAuthenticated || !token) {
      toast.warning(t('auth.login_required'));
      navigate('/signin');
      return;
    }

    try {
      const updatedAnswer = await voteAnswer(token, answerId, isUpvote);
      setAnswers((prev) =>
        prev.map((answer) => (answer._id === answerId ? updatedAnswer : answer))
      );
      toast.success(t('answer.vote_success'));
    } catch (error) {
      console.error('Failed to vote answer:', error);
      toast.error(t('answer.vote_error'));
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!isAuthenticated || !token || !newAnswer.trim() || submittingAnswer) return;

    setSubmittingAnswer(true);
    try {
      await createAnswer(token, {
        post_id: postId,
        content: newAnswer.trim(),
      });
      setNewAnswer('');
      toast.success(t('answer.create_success'));
      await fetchAnswers();
      // Refresh post to update answer count
      await fetchPost();
      // Trigger notification refresh
      window.dispatchEvent(new CustomEvent('refreshNotifications'));
      // Scroll to answers section
      document.querySelector('.answers-section')?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error('Failed to create answer:', error);
      // Extract error message from various error formats
      let errorMessage = t('answer.create_error');
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.detail) {
        errorMessage = typeof error.detail === 'string' ? error.detail : JSON.stringify(error.detail);
      }
      toast.error(errorMessage);
    } finally {
      setSubmittingAnswer(false);
    }
  };


  const isUpvoted = (item) => {
    if (!user || !item.votes?.upvoted_by) return false;
    return item.votes.upvoted_by.includes(user._id || user.id);
  };

  const isDownvoted = (item) => {
    if (!user || !item.votes?.downvoted_by) return false;
    return item.votes.downvoted_by.includes(user._id || user.id);
  };

  const isBookmarked = () => {
    if (!user || !user.bookmarked_post_ids || !post) return false;
    return user.bookmarked_post_ids.includes(post._id);
  };

  if (loading) {
    return (
      <div className="post-detail-page">
        <Container size="large">
          <div className="post-loading">
            <LoadingSpinner size="large" />
          </div>
        </Container>
      </div>
    );
  }

  if (error || !post) {
    if (error) {
      toast.error(error || t('errors.not_found'));
    }
    return (
      <div className="post-detail-page">
        <Container size="large">
          <Card variant="elevated" padding="large">
            <p>{error || t('errors.not_found')}</p>
            <Button onClick={() => navigate('/forum')} variant="primary" className="mt-3">
              {t('common.back')}
            </Button>
          </Card>
        </Container>
      </div>
    );
  }

  return (
    <div className="post-detail-page">
      <Container size="large">
        {/* Post Content */}
        <Card variant="elevated" padding="large" className="post-detail-card">
          <div className="post-detail-layout">
            <div className="post-detail-votes">
              <VoteButton
                score={post.votes?.score || 0}
                isUpvoted={isUpvoted(post)}
                isDownvoted={isDownvoted(post)}
                onVote={handlePostVote}
                disabled={!isAuthenticated}
                size="large"
              />
            </div>

            <div className="post-detail-content">
              <div className="post-detail-header">
                <h1 className="post-detail-title">{post.title}</h1>
                <BookmarkButton postId={post._id} isBookmarked={isBookmarked()} />
              </div>

              <div className="post-detail-meta">
                <span className={`post-status ${post.status === 'open' ? 'status-open' : 'status-closed'}`}>
                  {post.status === 'open'
                    ? t('post.status.open', 'Chưa giải quyết')
                    : t('post.status.closed', 'Đã giải quyết')}
                </span>
                <span className="post-stats">
                  {post.answer_count || 0} {t('post.answers', 'câu trả lời')} •{' '}
                  {post.view_count || 0} {t('post.views', 'lượt xem')}
                </span>
                <span className="post-date">{formatDateTime(post.created_at, 'vi-VN')}</span>
              </div>

              <div className="post-detail-body">
                <p>{post.content}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Answer Form */}
        {isAuthenticated && (
          <Card variant="elevated" padding="large" className="answer-form-card">
            <h2>{t('answer.create', 'Viết câu trả lời')}</h2>

            <form onSubmit={handleSubmitAnswer} className="answer-form">
              <Input
                as="textarea"
                rows={6}
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                placeholder={t('answer.placeholder', 'Viết câu trả lời của bạn...')}
                className="mb-2"
              />
              <Button
                type="submit"
                variant="primary"
                disabled={submittingAnswer || !newAnswer.trim()}
                loading={submittingAnswer}
              >
                {t('answer.submit', 'Gửi câu trả lời')}
              </Button>
            </form>
          </Card>
        )}

        {/* Answers List */}
        <div className="answers-section">
          <h2 className="answers-title">
            {t('answer.list', 'Câu trả lời')} ({answers.length})
          </h2>

          {answers.length === 0 ? (
            <Card variant="outlined" padding="large" className="no-answers">
              <p>{t('answer.no_answers', 'Chưa có câu trả lời nào. Hãy là người đầu tiên trả lời!')}</p>
            </Card>
          ) : (
            <div className="answers-list">
              {answers.map((answer) => (
                <Card key={answer._id} variant="elevated" padding="large" className="answer-card">
                  <div className="answer-layout">
                    <div className="answer-votes">
                      <VoteButton
                        score={answer.votes?.score || 0}
                        isUpvoted={isUpvoted(answer)}
                        isDownvoted={isDownvoted(answer)}
                        onVote={(isUpvote) => handleAnswerVote(answer._id, isUpvote)}
                        disabled={!isAuthenticated}
                        size="large"
                      />
                    </div>

                    <div className="answer-content">
                      <div className="answer-body">
                        <p>{answer.content}</p>
                      </div>

                      <div className="answer-meta">
                        <span className="answer-author">
                          {t('answer.by', 'Bởi')} {answer.author_name || t('common.anonymous', 'Ẩn danh')}
                        </span>
                        <span className="answer-date">{formatDateTime(answer.created_at, 'vi-VN')}</span>
                      </div>

                      <CommentSection
                        answerId={answer._id}
                        comments={answer.comments || []}
                        onCommentAdded={fetchAnswers}
                        onCommentDeleted={fetchAnswers}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
};

export default PostDetailPage;

