import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { generateQuestions, evaluateAnswers, getDiagnosisDetail } from '../api/diagnosisApi';
import { Container, Button, LoadingSpinner } from '../components/ui';
import './QuizPage.css';

/**
 * QuizPage - クイズページ
 * Display quiz questions generated from diagnosis and collect answers
 */
const QuizPage = () => {
    const { diagnosisId } = useParams();
    const { t } = useTranslation();
    const { isAuthenticated, token } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();

    // State
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [diagnosis, setDiagnosis] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [results, setResults] = useState(null);
    const [showResults, setShowResults] = useState(false);

    // Fetch diagnosis and generate questions
    useEffect(() => {
        const fetchAndGenerate = async () => {
            if (!token || !diagnosisId) return;

            setLoading(true);
            setError(null);

            try {
                // First get diagnosis detail
                const diagnosisData = await getDiagnosisDetail(diagnosisId, token);
                setDiagnosis(diagnosisData);

                // Check if questions already exist
                if (diagnosisData.generated_questions && diagnosisData.generated_questions.length > 0) {
                    setQuestions(diagnosisData.generated_questions);
                } else {
                    // Generate new questions
                    const result = await generateQuestions(diagnosisId, 5, token);
                    setQuestions(result.generated_questions || []);
                }
            } catch (err) {
                console.error('Failed to load quiz:', err);
                setError(err.message || 'Failed to load quiz');
                toast.error(t('quiz.errors.load_failed', 'クイズの読み込みに失敗しました'));
            } finally {
                setLoading(false);
            }
        };

        if (isAuthenticated) {
            fetchAndGenerate();
        }
    }, [diagnosisId, token, isAuthenticated, t, toast]);

    // Handle answer selection for multiple choice
    const handleSelectOption = (questionId, option) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: option
        }));
    };

    // Handle answer input for short answer
    const handleShortAnswer = (questionId, value) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    // Navigate to next question
    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    // Navigate to previous question
    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    // Submit all answers
    const handleSubmit = async () => {
        // Validate all questions are answered
        const unanswered = questions.filter(q => !answers[q.id]);
        if (unanswered.length > 0) {
            toast.error(t('quiz.errors.incomplete', 'すべての質問に回答してください'));
            return;
        }

        setSubmitting(true);
        try {
            const answersList = questions.map(q => ({
                question_id: q.id,
                user_answer: answers[q.id]
            }));

            const result = await evaluateAnswers(diagnosisId, answersList, token);
            setResults(result);
            setShowResults(true);
            toast.success(t('quiz.submit_success', '回答を提出しました'));
        } catch (err) {
            console.error('Failed to submit answers:', err);
            toast.error(t('quiz.errors.submit_failed', '回答の提出に失敗しました'));
        } finally {
            setSubmitting(false);
        }
    };

    // Retry quiz
    const handleRetry = () => {
        setAnswers({});
        setCurrentQuestionIndex(0);
        setShowResults(false);
        setResults(null);
    };

    // Go back to diagnosis
    const handleBackToDiagnosis = () => {
        navigate('/diagnosis/history');
    };

    // Redirect if not authenticated
    if (!isAuthenticated) {
        return (
            <div className="quiz-page">
                <Container size="medium">
                    <div className="quiz-error">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <h2>{t('diagnosis.login_required_title', 'ログインが必要です')}</h2>
                        <p>{t('diagnosis.login_required_desc', 'AI診断機能を利用するにはログインしてください。')}</p>
                        <Button variant="primary" onClick={() => navigate('/signin')}>
                            {t('auth.login')}
                        </Button>
                    </div>
                </Container>
            </div>
        );
    }

    // Loading state
    if (loading) {
        return (
            <div className="quiz-page">
                <Container size="medium">
                    <div className="quiz-loading">
                        <LoadingSpinner size="large" />
                        <p>{t('quiz.generating', 'クイズを生成しています...')}</p>
                    </div>
                </Container>
            </div>
        );
    }

    // Error state
    if (error || questions.length === 0) {
        return (
            <div className="quiz-page">
                <Container size="medium">
                    <div className="quiz-error">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <h2>{t('quiz.error_title', 'エラーが発生しました')}</h2>
                        <p>{error || t('quiz.no_questions', 'クイズを生成できませんでした')}</p>
                        <Button variant="primary" onClick={handleBackToDiagnosis}>
                            {t('quiz.back_to_diagnosis', '診断履歴に戻る')}
                        </Button>
                    </div>
                </Container>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    // Results view
    if (showResults && results) {
        return (
            <div className="quiz-page">
                <Container size="medium">
                    <div className="quiz-header">
                        <h1>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                            {t('quiz.results_title', 'クイズ結果')}
                        </h1>
                    </div>

                    <div className="quiz-results">
                        <div className="results-icon">🎉</div>
                        <h2 className="results-title">{t('quiz.completed', 'クイズ完了！')}</h2>

                        <div className="score-display">
                            <div className="score-item">
                                <div className="score-value">{results.correct_answers}/{results.total_questions}</div>
                                <div className="score-label">{t('quiz.correct_answers', '正解数')}</div>
                            </div>
                            <div className="score-item">
                                <div className="score-value percentage">{Math.round(results.score_percentage)}%</div>
                                <div className="score-label">{t('quiz.score', 'スコア')}</div>
                            </div>
                        </div>

                        {results.feedback && results.feedback.length > 0 && (
                            <div className="feedback-section">
                                <h3 className="feedback-title">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <line x1="16" y1="13" x2="8" y2="13" />
                                        <line x1="16" y1="17" x2="8" y2="17" />
                                    </svg>
                                    {t('quiz.feedback', 'フィードバック')}
                                </h3>
                                <div className="feedback-list">
                                    {results.feedback.map((fb, index) => (
                                        <div key={index} className={`feedback-item ${fb.is_correct ? 'correct' : 'incorrect'}`}>
                                            <div className="feedback-question">
                                                {fb.is_correct ? '✓' : '✗'} {t('quiz.question', '問題')} {index + 1}
                                            </div>
                                            <div className="feedback-answer">
                                                {t('quiz.your_answer', 'あなたの回答')}: {answers[fb.question_id]}
                                                {!fb.is_correct && (
                                                    <> | {t('quiz.correct_answer', '正解')}: {fb.correct_answer}</>
                                                )}
                                            </div>
                                            {fb.explanation && (
                                                <div className="feedback-explanation">💡 {fb.explanation}</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="results-actions">
                            <Button variant="outline" onClick={handleRetry}>
                                {t('quiz.retry', 'もう一度')}
                            </Button>
                            <Button variant="primary" onClick={handleBackToDiagnosis}>
                                {t('quiz.back_to_diagnosis', '診断履歴に戻る')}
                            </Button>
                        </div>
                    </div>
                </Container>
            </div>
        );
    }

    // Quiz view
    return (
        <div className="quiz-page">
            <Container size="medium">
                <div className="quiz-header">
                    <h1>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        {t('quiz.title', 'クイズ')}
                    </h1>
                    <div className="quiz-progress">
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="progress-text">
                            {currentQuestionIndex + 1} / {questions.length}
                        </span>
                    </div>
                </div>

                <div className="question-card">
                    <div className="question-number">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        {t('quiz.question', '問題')} {currentQuestionIndex + 1}
                    </div>

                    <p className="question-text">{currentQuestion.question_text}</p>

                    {/* Always show clickable options for multiple choice questions */}
                    {currentQuestion.options && currentQuestion.options.length > 0 ? (
                        <div className="options-list">
                            {currentQuestion.options.map((option, idx) => {
                                const letter = String.fromCharCode(65 + idx);
                                const isSelected = answers[currentQuestion.id] === option;
                                return (
                                    <div
                                        key={idx}
                                        className={`option-item ${isSelected ? 'selected' : ''}`}
                                        onClick={() => handleSelectOption(currentQuestion.id, option)}
                                    >
                                        <span className="option-letter">{letter}</span>
                                        <span className="option-text">{option}</span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <textarea
                            className="short-answer-input"
                            placeholder={t('quiz.enter_answer', '回答を入力してください...')}
                            value={answers[currentQuestion.id] || ''}
                            onChange={(e) => handleShortAnswer(currentQuestion.id, e.target.value)}
                        />
                    )}
                </div>

                <div className="quiz-navigation">
                    <button
                        className="nav-btn"
                        onClick={handlePrevious}
                        disabled={currentQuestionIndex === 0}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                        {t('quiz.previous', '前へ')}
                    </button>

                    {currentQuestionIndex < questions.length - 1 ? (
                        <button
                            className="nav-btn"
                            onClick={handleNext}
                        >
                            {t('quiz.next', '次へ')}
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                    ) : (
                        <button
                            className="nav-btn submit-btn"
                            onClick={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <LoadingSpinner size="small" />
                                    {t('quiz.submitting', '提出中...')}
                                </>
                            ) : (
                                <>
                                    {t('quiz.submit', '提出する')}
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </Container>
        </div>
    );
};

export default QuizPage;
