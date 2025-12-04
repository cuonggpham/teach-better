import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { createDiagnosis, saveDiagnosisResult } from '../api/diagnosisApi';
import { Container, Card, Button, LoadingSpinner, Modal } from '../components/ui';
import './DiagnosisPage.css';

/**
 * DiagnosisPage - Trang chẩn đoán AI (AI診断)
 * Màn hình nhập liệu để AI phân tích nội dung bài giảng
 */
const DiagnosisPage = () => {
  const { t } = useTranslation();
  const { isAuthenticated, token } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef(null);
  const documentInputRef = useRef(null);

  // Form state
  const [lessonContent, setLessonContent] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [documentFiles, setDocumentFiles] = useState([]);
  const [subject, setSubject] = useState('');
  const [nationality, setNationality] = useState('');
  const [level, setLevel] = useState('');
  const [age, setAge] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);

  // Subject options
  const subjectOptions = [
    { value: 'IT', label: 'IT' },
    { value: 'math', label: t('diagnosis.subjects.math', '数学') },
    { value: 'physics', label: t('diagnosis.subjects.physics', '物理') },
    { value: 'chemistry', label: t('diagnosis.subjects.chemistry', '化学') },
    { value: 'japanese', label: t('diagnosis.subjects.japanese', '国語') },
    { value: 'english', label: t('diagnosis.subjects.english', '英語') },
    { value: 'other', label: t('diagnosis.subjects.other', 'その他') },
  ];

  // Nationality options
  const nationalityOptions = [
    { value: 'vietnam', label: 'Vietnam' },
    { value: 'china', label: t('diagnosis.nationalities.china', '中国') },
    { value: 'korea', label: t('diagnosis.nationalities.korea', '韓国') },
    { value: 'thailand', label: t('diagnosis.nationalities.thailand', 'タイ') },
    { value: 'indonesia', label: t('diagnosis.nationalities.indonesia', 'インドネシア') },
    { value: 'philippines', label: t('diagnosis.nationalities.philippines', 'フィリピン') },
    { value: 'other', label: t('diagnosis.nationalities.other', 'その他') },
  ];

  // Level options
  const levelOptions = [
    { value: 'N5', label: 'N5' },
    { value: 'N4', label: 'N4' },
    { value: 'N3', label: 'N3' },
    { value: 'N2', label: 'N2' },
    { value: 'N1', label: 'N1' },
  ];

  // Age options
  const ageOptions = [
    { value: '18', label: '18' },
    { value: '19', label: '19' },
    { value: '20', label: '20' },
    { value: '21', label: '21' },
    { value: '22', label: '22' },
    { value: '23', label: '23' },
    { value: '24', label: '24' },
    { value: '25', label: '25' },
    { value: '26-30', label: '26-30' },
    { value: '31-40', label: '31-40' },
    { value: '41+', label: '41+' },
  ];

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['audio/mp3', 'audio/wav', 'audio/mpeg', 'audio/ogg', 'audio/webm'];
      if (!validTypes.includes(file.type)) {
        toast.error(t('diagnosis.errors.invalid_audio', '有効な音声ファイルを選択してください'));
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error(t('diagnosis.errors.file_too_large', 'ファイルが大きすぎます（最大50MB）'));
        return;
      }
      setAudioFile(file);
    }
  };

  const handleDocumentUpload = (e) => {
    const files = Array.from(e.target.files);
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    const validFiles = files.filter(file => {
      if (!validTypes.includes(file.type)) {
        toast.error(t('diagnosis.errors.invalid_document', '有効なドキュメントファイルを選択してください（PDF, DOC, DOCX）'));
        return false;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error(t('diagnosis.errors.file_too_large', 'ファイルが大きすぎます（最大20MB）'));
        return false;
      }
      return true;
    });

    setDocumentFiles(prev => [...prev, ...validFiles]);
  };

  const handleRemoveFile = () => {
    setAudioFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveDocument = (index) => {
    setDocumentFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!lessonContent.trim() && !audioFile && documentFiles.length === 0) {
      toast.error(t('diagnosis.errors.content_required', '授業内容を入力するか、ファイルをアップロードしてください'));
      return;
    }

    if (!nationality) {
      toast.error(t('diagnosis.errors.nationality_required', '国籍を選択してください'));
      return;
    }

    if (!level) {
      toast.error(t('diagnosis.errors.level_required', 'レベルを選択してください'));
      return;
    }

    setIsLoading(true);

    try {
      const data = {
        lesson_content: lessonContent,
        audio_file: audioFile,
        document_files: documentFiles,
        subject,
        nationality,
        level,
        age,
      };

      const result = await createDiagnosis(data, token);
      setAnalysisResult(result);
      setShowResultModal(true);
      toast.success(t('diagnosis.success', '分析が完了しました！'));
    } catch (error) {
      console.error('Diagnosis error:', error);
      toast.error(t('diagnosis.errors.analysis_failed', '分析に失敗しました。もう一度お試しください。'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveResult = async () => {
    if (!analysisResult) return;

    setIsSaving(true);
    try {
      await saveDiagnosisResult(analysisResult._id, token);
      toast.success(t('diagnosis.result_saved', '結果を保存しました'));
    } catch (error) {
      console.error('Save error:', error);
      toast.error(t('diagnosis.errors.save_failed', '保存に失敗しました'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateTest = () => {
    // Navigate to test creation page with diagnosis result
    navigate('/test/create', { state: { diagnosisId: analysisResult?._id } });
  };

  const handleCloseResult = () => {
    setShowResultModal(false);
    setAnalysisResult(null);
    setLessonContent('');
    setAudioFile(null);
    setDocumentFiles([]);
    setSubject('');
    setNationality('');
    setLevel('');
    setAge('');
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (ext === 'pdf') {
      return (
        <div className="file-icon pdf">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <span>PDF</span>
        </div>
      );
    }
    return (
      <div className="file-icon doc">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
        <span>DOC</span>
      </div>
    );
  };

  const getNationalityLabel = (value) => {
    const opt = nationalityOptions.find(o => o.value === value);
    return opt ? opt.label : value;
  };

  const getSubjectLabel = (value) => {
    const opt = subjectOptions.find(o => o.value === value);
    return opt ? opt.label : value;
  };

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="diagnosis-page">
        <Container size="medium">
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
    <div className="diagnosis-page">
      <Container size="medium">
        <div className="diagnosis-header">
          <h1>{t('diagnosis.title', '診断')}</h1>
          <Button variant="ghost" onClick={() => navigate('/diagnosis/history')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v5h5" />
              <path d="M3 8a9 9 0 1 1 1.83 5.54" />
            </svg>
            {t('diagnosis.history', '診断履歴')}
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="diagnosis-form">
          {/* Lesson Content Input */}
          <Card variant="elevated" padding="large" className="diagnosis-input-card">
            <h2 className="input-section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              {t('diagnosis.lesson_content', '授業内容を入力')}
            </h2>
            
            <textarea
              className="diagnosis-textarea"
              placeholder={t('diagnosis.content_placeholder', '授業内容をご記入ください...')}
              value={lessonContent}
              onChange={(e) => setLessonContent(e.target.value)}
              rows={8}
            />

            {/* Audio Upload */}
            <div className="audio-upload-section">
              <input
                type="file"
                ref={fileInputRef}
                accept="audio/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="audio-upload"
              />
              {audioFile ? (
                <div className="audio-file-preview">
                  <div className="audio-file-info">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18V5l12-2v13" />
                      <circle cx="6" cy="18" r="3" />
                      <circle cx="18" cy="16" r="3" />
                    </svg>
                    <span className="audio-file-name">{audioFile.name}</span>
                    <span className="audio-file-size">
                      ({(audioFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  </div>
                  <button type="button" className="remove-audio-btn" onClick={handleRemoveFile}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ) : (
                <label htmlFor="audio-upload" className="audio-upload-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {t('diagnosis.upload_audio', '録音ファイルをアップロード')}
                </label>
              )}
            </div>

            {/* Document Upload */}
            <div className="document-upload-section">
              <input
                type="file"
                ref={documentInputRef}
                accept=".pdf,.doc,.docx"
                onChange={handleDocumentUpload}
                multiple
                style={{ display: 'none' }}
                id="document-upload"
              />
              <label htmlFor="document-upload" className="document-upload-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
                {t('diagnosis.upload_document', 'ドキュメントをアップロード')}
              </label>
              
              {documentFiles.length > 0 && (
                <div className="document-files-list">
                  {documentFiles.map((file, index) => (
                    <div key={index} className="document-file-item">
                      {getFileIcon(file.name)}
                      <span className="document-file-name">{file.name}</span>
                      <button type="button" className="remove-document-btn" onClick={() => handleRemoveDocument(index)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Student Background */}
          <Card variant="elevated" padding="large" className="diagnosis-background-card">
            <h2 className="input-section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {t('diagnosis.student_background', '学習者情報')}
            </h2>

            <div className="background-selects">
              <div className="select-group">
                <label>{t('diagnosis.subject', '教科')}</label>
                <select 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value)}
                  className="diagnosis-select"
                >
                  <option value="">{t('diagnosis.select_subject', '教科')}</option>
                  {subjectOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="select-group">
                <label>{t('diagnosis.level', '学習者レベル')}</label>
                <select 
                  value={level} 
                  onChange={(e) => setLevel(e.target.value)}
                  className="diagnosis-select"
                >
                  <option value="">{t('diagnosis.select_level', 'レベル')}</option>
                  {levelOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="select-group">
                <label>{t('diagnosis.age', '年齢')}</label>
                <select 
                  value={age} 
                  onChange={(e) => setAge(e.target.value)}
                  className="diagnosis-select"
                >
                  <option value="">{t('diagnosis.select_age', '年齢')}</option>
                  {ageOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="select-group">
                <label>{t('diagnosis.nationality', '国籍')}</label>
                <select 
                  value={nationality} 
                  onChange={(e) => setNationality(e.target.value)}
                  className="diagnosis-select"
                >
                  <option value="">{t('diagnosis.select_nationality', '国籍')}</option>
                  {nationalityOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Submit Button */}
          <Button 
            type="submit" 
            variant="primary" 
            className="diagnosis-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="small" />
                {t('diagnosis.analyzing', '分析中...')}
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                {t('diagnosis.submit', '診断する')}
              </>
            )}
          </Button>
        </form>
      </Container>

      {/* Result Modal */}
      <Modal
        isOpen={showResultModal}
        onClose={handleCloseResult}
        title={t('diagnosis.result_title', '診断結果')}
        size="large"
        className="diagnosis-result-modal"
      >
        {analysisResult && (
          <div className="result-modal-content">
            {/* Student Info Bar */}
            <div className="result-student-info">
              <div className="info-item">
                <span className="info-icon">📚</span>
                <span className="info-label">{t('diagnosis.subject', '教科')}</span>
                <span className="info-value">{getSubjectLabel(analysisResult.subject) || subject || 'IT'}</span>
              </div>
              <div className="info-item">
                <span className="info-icon">📊</span>
                <span className="info-label">{t('diagnosis.learner_level', '学習者レベル')}</span>
                <span className="info-value">{analysisResult.level || level || 'N3'}</span>
              </div>
              <div className="info-item">
                <span className="info-icon">👤</span>
                <span className="info-label">{t('diagnosis.age', '年齢')}</span>
                <span className="info-value">{analysisResult.age || age || '22'}</span>
              </div>
              <div className="info-item">
                <span className="info-icon">🌏</span>
                <span className="info-label">{t('diagnosis.nationality', '国籍')}</span>
                <span className="info-value">{getNationalityLabel(analysisResult.nationality || nationality)}</span>
              </div>
            </div>

            {/* Uploaded Files */}
            {analysisResult.uploaded_files && analysisResult.uploaded_files.length > 0 && (
              <div className="result-section files-section">
                <h3 className="result-section-title">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {t('diagnosis.uploaded_files', 'ファイルをアップ')}
                </h3>
                <div className="uploaded-files-grid">
                  {analysisResult.uploaded_files.map((file, index) => (
                    <div key={index} className="uploaded-file-card">
                      {getFileIcon(file.name)}
                      <div className="file-details">
                        <span className="file-name">{file.name}</span>
                        <span className="file-meta">{file.uploaded_by} · {file.uploaded_at}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Difficulty Points & Chart - Side by Side */}
            <div className="result-analysis-row">
              {/* Difficulty Points */}
              {analysisResult.difficulty_points && analysisResult.difficulty_points.length > 0 && (
                <div className="result-section difficulty-section">
                  <h3 className="result-section-title warning">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    {t('diagnosis.difficulty_points', '理解しにくい点')}
                  </h3>
                  <ul className="difficulty-list">
                    {analysisResult.difficulty_points.map((point, index) => (
                      <li key={index}>
                        <span className="difficulty-icon">⚠️</span>
                        <span className="difficulty-text">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Comprehension Chart */}
              {analysisResult.comprehension_scores && (
                <div className="result-section chart-section">
                  <h3 className="result-section-title">
                    {t('diagnosis.overall_difficulty', '全体の理解しにくさ')}：
                    <span className={`difficulty-level ${analysisResult.difficulty_level || 'high'}`}>
                      {analysisResult.difficulty_level === 'low' ? t('diagnosis.level_low', '低い') :
                       analysisResult.difficulty_level === 'medium' ? t('diagnosis.level_medium', '普通') :
                       t('diagnosis.level_high', '高い')}
                    </span>
                  </h3>
                  <div className="comprehension-chart">
                    {Object.entries(analysisResult.comprehension_scores).map(([key, value]) => (
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
              )}
            </div>

            {/* Improvement Suggestions */}
            {analysisResult.suggestions && analysisResult.suggestions.length > 0 && (
              <div className="result-section suggestions-section">
                <h3 className="result-section-title">
                  <span className="bulb-icon">💡</span>
                  {t('diagnosis.suggestions', '最適な説明案')}
                </h3>
                <ul className="suggestions-list">
                  {analysisResult.suggestions.map((suggestion, index) => (
                    <li key={index}>
                      <span className="suggestion-icon">💡</span>
                      <span className="suggestion-text">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="result-actions">
              <Button 
                variant="outline" 
                onClick={handleCreateTest}
                className="create-test-btn"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
                {t('diagnosis.create_test', 'テストを作成')}
              </Button>
              <Button 
                variant="primary" 
                onClick={handleSaveResult}
                disabled={isSaving}
                className="save-result-btn"
              >
                {isSaving ? (
                  <LoadingSpinner size="small" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                )}
                {t('diagnosis.save_result', '結果を保存')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DiagnosisPage;
