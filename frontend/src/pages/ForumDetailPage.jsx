import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { postsApi } from '../api/api';
import './ForumDetailPage.css';

const ForumDetailPage = () => {
  const { t } = useTranslation();
  const { postId } = useParams();
  const navigate = useNavigate();
  
  const [post, setPost] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [newComment, setNewComment] = useState({});
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    fetchPostDetails();
    fetchAnswers();
  }, [postId]);

  const fetchPostDetails = async () => {
    try {
      const data = await postsApi.getPost(postId);
      setPost(data);
    } catch (error) {
      setError(t('common.error_loading'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnswers = async () => {
    try {
      const data = await postsApi.getAnswers(postId);
      setAnswers(data);
    } catch (error) {
      console.error('Error loading answers:', error);
    }
  };

  const handleVote = async (type) => {
    try {
      await postsApi.votePost(postId, type);
      fetchPostDetails();
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleBookmark = async () => {
    try {
      await postsApi.bookmarkPost(postId);
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error('Error bookmarking:', error);
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    
    if (!newAnswer.trim()) return;
    
    setIsSubmittingAnswer(true);
    
    try {
      await postsApi.createAnswer(postId, { content: newAnswer });
      setNewAnswer('');
      fetchAnswers();
      fetchPostDetails();
    } catch (error) {
      setError(t('common.error_creating'));
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const handleSubmitComment = async (answerId) => {
    const commentContent = newComment[answerId];
    
    if (!commentContent?.trim()) return;
    
    try {
      await postsApi.addComment(postId, answerId, { content: commentContent });
      setNewComment({ ...newComment, [answerId]: '' });
      fetchAnswers();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner-large"></div>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="error-container">
        <p>{error || t('post.not_found')}</p>
        <button onClick={() => navigate('/forum')} className="btn-secondary">
          {t('common.back')}
        </button>
      </div>
    );
  }

  return (
    <div className="forum-detail-page">
      <div className="forum-detail-container">
        {/* Back button */}
        <button className="btn-back" onClick={() => navigate('/forum')}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t('common.back')}
        </button>

        {/* Post Detail */}
        <div className="post-detail-card">
          <div className="post-actions">
            <div className="vote-section">
              <button 
                className="vote-btn"
                onClick={() => handleVote('upvote')}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <span className="vote-count">{post.votes?.score || 0}</span>
              <button 
                className="vote-btn"
                onClick={() => handleVote('downvote')}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <button 
              className={`bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`}
              onClick={handleBookmark}
            >
              <svg fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          </div>

          <div className="post-main-content">
            <h1 className="post-title">{post.title}</h1>
            
            <div className="post-meta">
              <div className="post-author">
                <div className="avatar">
                  {post.author?.avatar_url ? (
                    <img src={post.author.avatar_url} alt={post.author.name} />
                  ) : (
                    <span>{post.author?.name?.charAt(0) || '?'}</span>
                  )}
                </div>
                <div className="author-info">
                  <span className="author-name">{post.author?.name || t('common.anonymous')}</span>
                  <span className="post-time">{formatDate(post.created_at)}</span>
                </div>
              </div>

              <div className="post-stats">
                <span className="stat">
                  <svg className="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {post.view_count || 0} {t('post.views')}
                </span>
              </div>
            </div>

            <div className="post-content">
              <p>{post.content}</p>
            </div>
          </div>
        </div>

        {/* Answers Section */}
        <div className="answers-section">
          <h2 className="section-title">
            {answers.length} {t('forum.answers')}
          </h2>

          {answers.map((answer) => (
            <div key={answer._id} className="answer-card">
              <div className="answer-votes">
                <button className="vote-btn">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <span className="vote-count">{answer.votes?.score || 0}</span>
                <button className="vote-btn">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              <div className="answer-content">
                <div className="answer-header">
                  <div className="post-author">
                    <div className="avatar">
                      {answer.author?.avatar_url ? (
                        <img src={answer.author.avatar_url} alt={answer.author.name} />
                      ) : (
                        <span>{answer.author?.name?.charAt(0) || '?'}</span>
                      )}
                    </div>
                    <div className="author-info">
                      <span className="author-name">{answer.author?.name || t('common.anonymous')}</span>
                      <span className="post-time">{formatDate(answer.created_at)}</span>
                    </div>
                  </div>
                </div>

                <p className="answer-text">{answer.content}</p>

                {/* Comments */}
                {answer.comments && answer.comments.length > 0 && (
                  <div className="comments-list">
                    {answer.comments.map((comment) => (
                      <div key={comment.id} className="comment">
                        <p className="comment-text">{comment.content}</p>
                        <span className="comment-time">{formatDate(comment.created_at)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment */}
                <div className="comment-form">
                  <input
                    type="text"
                    value={newComment[answer._id] || ''}
                    onChange={(e) => setNewComment({ ...newComment, [answer._id]: e.target.value })}
                    placeholder={t('forum.add_comment')}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSubmitComment(answer._id);
                      }
                    }}
                  />
                  <button 
                    className="btn-comment"
                    onClick={() => handleSubmitComment(answer._id)}
                  >
                    {t('common.submit')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Answer Form */}
        <div className="answer-form-section">
          <h2 className="section-title">{t('forum.your_answer')}</h2>
          <form onSubmit={handleSubmitAnswer} className="answer-form">
            <textarea
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              placeholder={t('forum.answer_placeholder')}
              rows="6"
              required
              disabled={isSubmittingAnswer}
            />
            <button 
              type="submit" 
              className="btn-primary"
              disabled={isSubmittingAnswer || !newAnswer.trim()}
            >
              {isSubmittingAnswer ? (
                <>
                  <span className="spinner"></span>
                  {t('common.submitting')}
                </>
              ) : (
                t('forum.submit_answer')
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForumDetailPage;
