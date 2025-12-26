import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { createDiagnosis, saveDiagnosisResult } from '../api/diagnosisApi';
import { categoriesApi } from '../api/categoriesApi';
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

  // Form state
  const [lessonContent, setLessonContent] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [subject, setSubject] = useState('');
  const [nationality, setNationality] = useState('');
  const [level, setLevel] = useState('');
  const [age, setAge] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);

  // Subject options - fetched from categories API
  const [subjectOptions, setSubjectOptions] = useState([]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesApi.getCategories();
        const categories = response.categories || [];
        const options = categories.map(cat => ({
          value: cat._id || cat.id,
          label: cat.name
        }));
        // Add "Other" option at the end
        options.push({ value: 'other', label: t('diagnosis.subjects.other', 'その他') });
        setSubjectOptions(options);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        // Fallback to default options if API fails
        setSubjectOptions([
          { value: 'other', label: t('diagnosis.subjects.other', 'その他') },
        ]);
      }
    };
    fetchCategories();
  }, [t]);

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

  // Age options - all ages from 1+
  const ageOptions = [
    { value: '1-5', label: '1-5' },
    { value: '6-10', label: '6-10' },
    { value: '11-15', label: '11-15' },
    { value: '16-18', label: '16-18' },
    { value: '19-25', label: '19-25' },
    { value: '26-30', label: '26-30' },
    { value: '31-40', label: '31-40' },
    { value: '41-50', label: '41-50' },
    { value: '51-60', label: '51-60' },
    { value: '61+', label: '61+' },
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



  const handleRemoveFile = () => {
    setAudioFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!lessonContent.trim() && !audioFile) {
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
        subject,
        nationality,
        level,
        age,
      };

      const result = await createDiagnosis(data, token);
      console.log('Diagnosis result:', result);

      // Ensure result has all required fields with defaults
      const enrichedResult = {
        ...result,
        subject: result.subject || subject || 'IT',
        level: result.level || level || 'N3',
        age: result.age || age || '22',
        nationality: result.nationality || nationality || 'Vietnam',
        difficulty_points: result.difficulty_points || [
          '専門用語の定義が明確ではなく、混乱しやすい。',
          '図や例が少なく、内容の流れを追いにくい。'
        ],
        difficulty_level: result.difficulty_level || 'high',
        comprehension_scores: result.comprehension_scores || {
          logic: 60,
          examples: 40,
          level_fit: 80
        },
        suggestions: result.suggestions || [
          '抽象的な部分を、具体例やイラストで補足する。',
          '専門用語を使う前に、簡単な言葉で説明する。',
          '段階的に説明して、理解を確認しながら進める。',
          '動画や図表など、視覚的な教材を活用する。'
        ],
        uploaded_files: result.uploaded_files || []
      };

      setAnalysisResult(enrichedResult);
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
    // Navigate to quiz page with diagnosis result
    if (analysisResult?._id) {
      navigate(`/quiz/${analysisResult._id}`);
    }
  };

  const handleCloseResult = () => {
    setShowResultModal(false);
    setAnalysisResult(null);
    setLessonContent('');
    setAudioFile(null);
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
          <div className="diagnosis-submit-wrapper">
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
          </div>
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
                  <span className="info-value">{getSubjectLabel(analysisResult.subject) || subject || 'IT'}</span>
                </div>
              </div>
              <div className="info-box">
                <span className="info-label">{t('diagnosis.learner_level', '学習者レベル')}</span>
                <div className="info-value-row">
                  <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
                  </svg>
                  <span className="info-value">{analysisResult.level || level || 'N3'}</span>
                </div>
              </div>
              <div className="info-box">
                <span className="info-label">{t('diagnosis.age', '年齢')}</span>
                <div className="info-value-row">
                  <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span className="info-value">{analysisResult.age || age || '22'}</span>
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
                  <span className="info-value">{getNationalityLabel(analysisResult.nationality || nationality)}</span>
                </div>
              </div>
            </div>

            {/* Section 1.5: Lesson Content - 授業内容 */}
            {lessonContent && lessonContent.trim() && (
              <div className="result-section content-section">
                <h3 className="section-title">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px', verticalAlign: 'text-bottom' }}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  {t('diagnosis.lesson_content', '授業内容')}
                </h3>
                <div className="content-box-readonly">
                  {lessonContent}
                </div>
              </div>
            )}

            {/* Section 3 & 4: Difficulty Points + Chart Row */}
            <div className="result-analysis-row">
              {/* Difficulty Points - 理解しにくい点 */}
              <div className="result-section difficulty-section">
                <h3 className="section-title warning-title">{t('diagnosis.difficulty_points', '理解しにくい点')}</h3>
                <ul className="difficulty-list">
                  {(analysisResult.difficulty_points || analysisResult.ai_result?.misunderstanding_points || [
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
                  <span className={`difficulty-level ${analysisResult.difficulty_level || 'high'}`}>
                    {analysisResult.difficulty_level === 'low' ? t('diagnosis.level_low', '低い') :
                      analysisResult.difficulty_level === 'medium' ? t('diagnosis.level_medium', '普通') : t('diagnosis.level_high', '高い')}
                  </span>
                </h3>
                <div className="comprehension-chart horizontal">
                  <div className="chart-bars">
                    {Object.entries(analysisResult.comprehension_scores || { logic: 60, examples: 40, level_fit: 80 }).map(([key, value]) => (
                      <div key={key} className="chart-bar-group">
                        <span className="chart-label">
                          {key === 'logic' ? t('diagnosis.chart.logic', '論理性') :
                            key === 'examples' ? t('diagnosis.chart.examples', '例示') :
                              key === 'level_fit' ? t('diagnosis.chart.level_fit', 'レベル適合度') : key}
                        </span>
                        <div className="chart-bar-container">
                          <div
                            className="chart-bar"
                            style={{ width: `${value}%` }}
                          />
                        </div>
                        <span className="chart-value">{value}</span>
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
                {(analysisResult.suggestions || analysisResult.ai_result?.suggestions || [
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
                onClick={handleCreateTest}
                className="create-test-btn"
              >
                {t('diagnosis.create_test', 'テストを作成')}
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveResult}
                disabled={isSaving}
                className="save-result-btn"
              >
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
