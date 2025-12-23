import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getDiagnosisHistory, getDiagnosisDetail, deleteDiagnosis } from '../api/diagnosisApi';
import { Container, Card, Button, LoadingSpinner, Modal } from '../components/ui';
import './DiagnosisHistoryPage.css';

/**
 * DiagnosisHistoryPage - 診断履歴 (Diagnosis History)
 * Layout matches the provided wireframe design
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

  // Subject options - matching the wireframe (教科 dropdown)
  const subjectOptions = [
    { value: '', label: t('diagnosis.subject', '教科') },
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

  // Auto-search when filters change
  useEffect(() => {
    if (isAuthenticated && token) {
      const timer = setTimeout(() => {
        fetchDiagnoses();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, selectedSubject, startDate, endDate]);

  // Reset all filters
  const handleReset = () => {
    setSearchQuery('');
    setSelectedSubject('');
    setStartDate('');
    setEndDate('');
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
    return subject ? subject.label : subjectValue || '-';
  };

  // Nationality options for display
  const nationalityOptions = [
    { value: 'vietnam', label: 'Vietnam' },
    { value: 'china', label: t('diagnosis.nationalities.china', '中国') },
    { value: 'korea', label: t('diagnosis.nationalities.korea', '韓国') },
    { value: 'thailand', label: t('diagnosis.nationalities.thailand', 'タイ') },
    { value: 'indonesia', label: t('diagnosis.nationalities.indonesia', 'インドネシア') },
    { value: 'philippines', label: t('diagnosis.nationalities.philippines', 'フィリピン') },
    { value: 'other', label: t('diagnosis.nationalities.other', 'その他') },
  ];

  // Get nationality label from value
  const getNationalityLabel = (nationalityValue) => {
    const nationality = nationalityOptions.find(opt => opt.value === nationalityValue);
    return nationality ? nationality.label : nationalityValue || 'Vietnam';
  };

  // Format date for display (YYYY/MM/DD format as in wireframe)
  const formatDisplayDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/-/g, '/');
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
        {/* Title - 診断履歴 */}
        <div className="history-title-box">
          <h1>{t('diagnosis.history_title', '診断履歴')}</h1>
        </div>

        {/* Search and Filters Section */}
        <div className="history-filters-container">
          {/* Row 1: Search bar + Subject dropdown */}
          <div className="filters-row-main">
            <div className="search-bar-wrapper">
              <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder={t('diagnosis.search_placeholder', '検索...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="subject-dropdown"
            >
              {subjectOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Row 2: Date filters + Reset button */}
          <div className="filters-row-dates">
            <div className="date-filter-group">
              <label className="date-label">{t('diagnosis.start_date', '開始日')}</label>
              <div className="date-input-wrapper">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="date-input"
                />
              </div>
            </div>

            <div className="date-filter-group">
              <label className="date-label">{t('diagnosis.end_date', '終了日')}</label>
              <div className="date-input-wrapper">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="date-input"
                />
              </div>
            </div>

            <button
              className="reset-button"
              onClick={handleReset}
            >
              {t('diagnosis.reset', 'リセット')}
            </button>
          </div>
        </div>

        {/* Results Table */}
        {loading ? (
          <div className="history-loading">
            <LoadingSpinner size="large" />
          </div>
        ) : diagnoses.length === 0 ? (
          <div className="history-table-container">
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
                <tr>
                  <td colSpan="4" className="empty-cell">
                    {t('diagnosis.no_data', 'データがありません')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="history-table-container">
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
                      <span className="subject-cell">{getSubjectLabel(diagnosis.subject)}</span>
                    </td>
                    <td className="title-cell">{diagnosis.title || t('diagnosis.mock_data.title_1', '教育方法に関する質問')}</td>
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
          </div>
        )}

        {/* Detail Modal - 診断結果 */}
        <Modal
          isOpen={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedDiagnosis(null);
          }}
          title={t('diagnosis.result_title', '診断結果')}
          size="large"
          className="diagnosis-result-modal"
        >
          {detailLoading ? (
            <div className="modal-loading">
              <LoadingSpinner size="medium" />
            </div>
          ) : selectedDiagnosis && (
            <div className="diagnosis-result-content">
              {/* Section 1: Student Info Bar - 教科・学習者レベル・年齢・国籍 */}
              <div className="result-info-bar">
                <div className="info-box">
                  <span className="info-label">{t('diagnosis.subject', '教科')}</span>
                  <div className="info-value-row">
                    <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                    <span className="info-value">{selectedDiagnosis.subject || 'IT'}</span>
                  </div>
                </div>
                <div className="info-box">
                  <span className="info-label">{t('diagnosis.learner_level', '学習者レベル')}</span>
                  <div className="info-value-row">
                    <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
                    </svg>
                    <span className="info-value">{selectedDiagnosis.level || 'N3'}</span>
                  </div>
                </div>
                <div className="info-box">
                  <span className="info-label">{t('diagnosis.age', '年齢')}</span>
                  <div className="info-value-row">
                    <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span className="info-value">{selectedDiagnosis.age || '22'}</span>
                  </div>
                </div>
                <div className="info-box">
                  <span className="info-label">{t('diagnosis.nationality', '国籍')}</span>
                  <div className="info-value-row">
                    <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
                      <line x1="12" y1="21" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="14" />
                      <rect x="2" y="14" width="4" height="3" /><rect x="18" y="14" width="4" height="3" />
                    </svg>
                    <span className="info-value">{getNationalityLabel(selectedDiagnosis.nationality) || 'Vietnam'}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Uploaded Files - ファイルをアップ */}
              <div className="result-section files-section">
                <h3 className="section-title">{t('diagnosis.uploaded_files', 'ファイルをアップ')}</h3>
                <div className="files-grid">
                  {selectedDiagnosis.uploaded_files && selectedDiagnosis.uploaded_files.length > 0 ? (
                    selectedDiagnosis.uploaded_files.map((file, index) => (
                      <div key={index} className="file-card">
                        <div className={`file-icon-box ${file.name?.endsWith('.pdf') ? 'pdf' : 'doc'}`}>
                          {file.name?.endsWith('.pdf') ? (
                            <>
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                              </svg>
                              <span className="file-type">PDF</span>
                            </>
                          ) : (
                            <>
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                              </svg>
                              <span className="file-type">DOC</span>
                            </>
                          )}
                        </div>
                        <div className="file-info">
                          <span className="file-name">{file.name || 'File-name.pdf'}</span>
                          <span className="file-meta">{file.uploaded_by || 'User'}, {file.uploaded_at || 'Uploaded on January 1, 2023 at'}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="file-card">
                        <div className="file-icon-box pdf">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          <span className="file-type">PDF</span>
                        </div>
                        <div className="file-info">
                          <span className="file-name">File-name.pdf</span>
                          <span className="file-meta">User, Uploaded on January 1, 2023 at</span>
                        </div>
                      </div>
                      <div className="file-card">
                        <div className="file-icon-box doc">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                          </svg>
                          <span className="file-type">DOC</span>
                        </div>
                        <div className="file-info">
                          <span className="file-name">File-doc.docx</span>
                          <span className="file-meta">User, Uploaded on January 1, 2023 at</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Section 3 & 4: Difficulty Points + Chart Row */}
              <div className="result-analysis-row">
                {/* Difficulty Points - 理解しにくい点 */}
                <div className="result-section difficulty-section">
                  <h3 className="section-title warning-title">{t('diagnosis.difficulty_points', '理解しにくい点')}</h3>
                  <ul className="difficulty-list">
                    {(selectedDiagnosis.difficulty_points || selectedDiagnosis.ai_result?.misunderstanding_points || [
                      '専門用語の定義が明確ではなく、混乱しやすい。',
                      '図や例が少なく、内容流れを追いにくい'
                    ]).map((point, index) => (
                      <li key={index}>
                        <span className="warning-icon">⚠</span>
                        <span className="point-text">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Comprehension Chart - 全体の理解しにくさ */}
                <div className="result-section chart-section">
                  <h3 className="section-title">
                    {t('diagnosis.overall_difficulty', '全体の理解しにくさ')}：
                    <span className={`difficulty-level ${selectedDiagnosis.difficulty_level || 'high'}`}>
                      {selectedDiagnosis.difficulty_level === 'low' ? t('diagnosis.level_low', '低い') :
                        selectedDiagnosis.difficulty_level === 'medium' ? t('diagnosis.level_medium', '普通') : t('diagnosis.level_high', '高い')}
                    </span>
                  </h3>
                  <div className="comprehension-chart">
                    <div className="chart-y-axis">
                      <span>10</span>
                      <span>5</span>
                      <span>0</span>
                    </div>
                    <div className="chart-bars">
                      {Object.entries(selectedDiagnosis.comprehension_scores || { logic: 60, examples: 40, level_fit: 80 }).map(([key, value]) => (
                        <div key={key} className="chart-bar-group">
                          <div className="chart-bar-container">
                            <div
                              className="chart-bar"
                              style={{ height: `${value}%` }}
                            />
                          </div>
                          <span className="chart-label">
                            {key === 'logic' ? t('diagnosis.chart.logic', '論理性') :
                              key === 'examples' ? t('diagnosis.chart.examples', '例示') :
                                key === 'level_fit' ? t('diagnosis.chart.level_fit', 'レベル適合度') : key}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 5: Suggestions - 最適な説明案 */}
              <div className="result-section suggestions-section">
                <h3 className="section-title">{t('diagnosis.suggestions', '最適な説明案')}</h3>
                <ul className="suggestions-list">
                  {(selectedDiagnosis.suggestions || selectedDiagnosis.ai_result?.suggestions || [
                    '抽象的な部分を、具体例やイラストで補足する。',
                    '専門用語を使う前に、簡単な言葉で説明する。',
                    '段階的に説明して、理解を確認しながら進める。',
                    '動画や図表など、視覚的な教材を活用する。'
                  ]).map((suggestion, index) => (
                    <li key={index}>
                      <span className="bulb-icon">💡</span>
                      <span className="suggestion-text">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Section 6: Action Buttons */}
              <div className="result-actions">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/quiz/${selectedDiagnosis._id}`)}
                  className="create-test-btn"
                >
                  {t('diagnosis.create_test', 'テストを作成')}
                </Button>
                <Button
                  variant="primary"
                  onClick={async () => {
                    try {
                      const { saveDiagnosisResult } = await import('../api/diagnosisApi');
                      await saveDiagnosisResult(selectedDiagnosis._id, token);
                      toast.success(t('diagnosis.result_saved', '結果を保存しました'));
                    } catch (error) {
                      console.error('Save error:', error);
                      toast.error(t('diagnosis.errors.save_failed', '保存に失敗しました'));
                    }
                  }}
                  className="save-result-btn"
                >
                  {t('diagnosis.save_result', '結果を保存')}
                </Button>
              </div>
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
                {t('common.cancel', 'キャンセル')}
              </Button>
              <Button variant="danger" onClick={handleConfirmDelete}>
                {t('diagnosis.delete', '削除')}
              </Button>
            </div>
          </div>
        </Modal>
      </Container>
    </div>
  );
};

export default DiagnosisHistoryPage;
