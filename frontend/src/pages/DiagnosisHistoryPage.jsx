import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getDiagnosisHistory, getDiagnosisDetail, deleteDiagnosis } from '../api/diagnosisApi';
import { Container, Card, Button, LoadingSpinner, Modal } from '../components/ui';
import './DiagnosisHistoryPage.css';

/**
 * DiagnosisHistoryPage - Trang lịch sử chẩn đoán (診断履歴)
 */
const DiagnosisHistoryPage = () => {
  const { t } = useTranslation();
  const { isAuthenticated, token } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // State
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Subject options
  const subjectOptions = [
    { value: '', label: t('diagnosis.all_subjects', 'すべて') },
    { value: 'math', label: t('diagnosis.subjects.math', '数学') },
    { value: 'physics', label: t('diagnosis.subjects.physics', '物理') },
    { value: 'chemistry', label: t('diagnosis.subjects.chemistry', '化学') },
    { value: 'japanese', label: t('diagnosis.subjects.japanese', '国語') },
    { value: 'english', label: t('diagnosis.subjects.english', '英語') },
    { value: 'other', label: t('diagnosis.subjects.other', 'その他') },
  ];

  // Fetch diagnoses
  const fetchDiagnoses = async () => {
    setLoading(true);
    try {
      const params = {};
      
      if (searchQuery) {
        params.search = searchQuery;
      }
      if (selectedSubject) {
        params.subject = selectedSubject;
      }
      if (startDate) {
        params.start_date = startDate;
      }
      if (endDate) {
        params.end_date = endDate;
      }

      const response = await getDiagnosisHistory(token, params);
      setDiagnoses(response.diagnoses || []);
    } catch (error) {
      console.error('Failed to fetch diagnoses:', error);
      toast.error(t('diagnosis.errors.fetch_failed', 'データの取得に失敗しました'));
      setDiagnoses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchDiagnoses();
    }
  }, [isAuthenticated, token]);

  // Search with filters
  const handleSearch = () => {
    fetchDiagnoses();
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedSubject('');
    setStartDate('');
    setEndDate('');
    // Fetch without filters
    setTimeout(() => {
      fetchDiagnoses();
    }, 0);
  };

  const handleViewDetail = async (diagnosis) => {
    setDetailLoading(true);
    setDetailModalOpen(true);
    
    try {
      const detail = await getDiagnosisDetail(diagnosis._id, token);
      setSelectedDiagnosis(detail);
    } catch (error) {
      console.error('Failed to fetch diagnosis detail:', error);
      toast.error(t('diagnosis.errors.fetch_failed', 'データの取得に失敗しました'));
      setSelectedDiagnosis(diagnosis); // Use basic data as fallback
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDeleteClick = (diagnosis) => {
    setSelectedDiagnosis(diagnosis);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteDiagnosis(selectedDiagnosis._id, token);
      setDiagnoses(prev => prev.filter(d => d._id !== selectedDiagnosis._id));
      toast.success(t('diagnosis.delete_success', '診断結果を削除しました'));
    } catch (error) {
      console.error('Failed to delete diagnosis:', error);
      toast.error(t('diagnosis.errors.delete_failed', '削除に失敗しました'));
    } finally {
      setDeleteModalOpen(false);
      setSelectedDiagnosis(null);
    }
  };

  // Get subject label from value
  const getSubjectLabel = (subjectValue) => {
    const subject = subjectOptions.find(opt => opt.value === subjectValue);
    return subject ? subject.label : subjectValue;
  };

  // Format date for display
  const formatDisplayDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="diagnosis-history-page">
        <Container size="large">
          <Card variant="elevated" padding="large" className="diagnosis-login-required">
            <div className="login-required-content">
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
          </Card>
        </Container>
      </div>
    );
  }

  return (
    <div className="diagnosis-history-page">
      <Container size="large">
        <div className="history-header">
          <h1>{t('diagnosis.history_title', '診断履歴')}</h1>
          <Button variant="primary" onClick={() => navigate('/diagnosis')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {t('diagnosis.new_diagnosis', '新しい診断')}
          </Button>
        </div>

        {/* Filters */}
        <Card variant="elevated" padding="medium" className="history-filters">
          <div className="filters-row">
            <div className="search-bar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder={t('diagnosis.search_placeholder', '検索...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="search-input"
              />
            </div>

            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="filter-select subject-select"
            >
              {subjectOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="filters-row">
            <div className="date-filters">
              <div className="date-input-group">
                <label>{t('diagnosis.start_date', '開始日')}</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="date-input"
                />
              </div>
              <div className="date-input-group">
                <label>{t('diagnosis.end_date', '終了日')}</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="date-input"
                />
              </div>
            </div>

            <div className="filter-actions">
              <Button variant="secondary" onClick={handleSearch} className="search-btn">
                {t('common.search', '検索')}
              </Button>
              <Button variant="ghost" onClick={handleReset} className="reset-btn">
                {t('diagnosis.reset', 'リセット')}
              </Button>
            </div>
          </div>
        </Card>

        {/* Results Table */}
        {loading ? (
          <div className="history-loading">
            <LoadingSpinner size="large" />
          </div>
        ) : diagnoses.length === 0 ? (
          <Card variant="elevated" padding="large" className="history-empty">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <path d="M9 14l2 2 4-4" />
            </svg>
            <h3>{t('diagnosis.no_history', '診断履歴がありません')}</h3>
            <p>{t('diagnosis.no_history_desc', '最初の診断を行いましょう！')}</p>
            <Button variant="primary" onClick={() => navigate('/diagnosis')}>
              {t('diagnosis.start_diagnosis', '診断を開始')}
            </Button>
          </Card>
        ) : (
          <Card variant="elevated" padding="none" className="history-table-card">
            <table className="history-table">
              <thead>
                <tr>
                  <th>{t('diagnosis.table.subject', '教科')}</th>
                  <th>{t('diagnosis.table.title', 'タイトル')}</th>
                  <th>{t('diagnosis.table.date', '診断日')}</th>
                  <th>{t('diagnosis.table.actions', '操作')}</th>
                </tr>
              </thead>
              <tbody>
                {diagnoses.map((diagnosis) => (
                  <tr key={diagnosis._id}>
                    <td>
                      <span className="subject-badge">{getSubjectLabel(diagnosis.subject)}</span>
                    </td>
                    <td className="title-cell">{diagnosis.title}</td>
                    <td className="date-cell">{formatDisplayDate(diagnosis.created_at)}</td>
                    <td className="actions-cell">
                      <button 
                        className="action-btn view-btn" 
                        onClick={() => handleViewDetail(diagnosis)}
                        title={t('diagnosis.view_detail', '詳細を見る')}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button 
                        className="action-btn delete-btn" 
                        onClick={() => handleDeleteClick(diagnosis)}
                        title={t('diagnosis.delete', '削除')}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {/* Detail Modal */}
        <Modal
          isOpen={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedDiagnosis(null);
          }}
          title={t('diagnosis.detail_title', '診断詳細')}
          size="large"
        >
          {detailLoading ? (
            <div className="modal-loading">
              <LoadingSpinner size="medium" />
            </div>
          ) : selectedDiagnosis && (
            <div className="diagnosis-detail-content">
              <div className="detail-header">
                <div className="detail-meta">
                  <span className="subject-badge large">{getSubjectLabel(selectedDiagnosis.subject)}</span>
                  <span className="detail-date">{formatDisplayDate(selectedDiagnosis.created_at)}</span>
                </div>
                {selectedDiagnosis.score !== undefined && (
                  <div className="detail-score">
                    <span className="score-number">{selectedDiagnosis.score}</span>
                    <span className="score-label">{t('diagnosis.score', '点')}</span>
                  </div>
                )}
              </div>

              <h3 className="detail-title">{selectedDiagnosis.title}</h3>
              {selectedDiagnosis.summary && (
                <p className="detail-summary">{selectedDiagnosis.summary}</p>
              )}

              {selectedDiagnosis.strengths && selectedDiagnosis.strengths.length > 0 && (
                <div className="detail-section">
                  <h4>{t('diagnosis.strengths', '良い点')}</h4>
                  <ul>
                    {selectedDiagnosis.strengths.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedDiagnosis.improvements && selectedDiagnosis.improvements.length > 0 && (
                <div className="detail-section">
                  <h4>{t('diagnosis.improvements', '改善点')}</h4>
                  <ul>
                    {selectedDiagnosis.improvements.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedDiagnosis.recommendations && (
                <div className="detail-section">
                  <h4>{t('diagnosis.recommendations', 'アドバイス')}</h4>
                  <p>{selectedDiagnosis.recommendations}</p>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setSelectedDiagnosis(null);
          }}
          title={t('diagnosis.delete_confirm_title', '削除の確認')}
          size="small"
        >
          <div className="delete-confirm-content">
            <p>{t('diagnosis.delete_confirm_message', 'この診断結果を削除してもよろしいですか？')}</p>
            <div className="delete-confirm-actions">
              <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button variant="danger" onClick={handleConfirmDelete}>
                {t('common.delete')}
              </Button>
            </div>
          </div>
        </Modal>
      </Container>
    </div>
  );
};

export default DiagnosisHistoryPage;
