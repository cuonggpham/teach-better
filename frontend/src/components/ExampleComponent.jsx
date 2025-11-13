import { useTranslation } from 'react-i18next';
import './ExampleComponent.css';

/**
 * Component ví dụ về cách sử dụng i18n
 * 
 * Minh họa các cách sử dụng translation khác nhau:
 * - Translation cơ bản
 * - Translation với interpolation (thay thế biến)
 * - Translation nested (lồng nhau)
 * - Translation với số nhiều (plural)
 * - Translation với format
 */
const ExampleComponent = () => {
  const { t } = useTranslation();

  // Ví dụ dữ liệu động
  const userName = 'Nguyễn Văn A';
  const courseCount = 5;

  return (
    <div className="example-container">
      <h2>{t('app_title')}</h2>
      
      {/* Ví dụ 1: Translation cơ bản */}
      <section className="example-section">
        <h3>1. Translation cơ bản</h3>
        <p>{t('welcome')}</p>
        <p>{t('common.loading')}</p>
      </section>

      {/* Ví dụ 2: Translation nested */}
      <section className="example-section">
        <h3>2. Navigation menu (nested)</h3>
        <nav className="example-nav">
          <a href="#home">{t('navigation.home')}</a>
          <a href="#courses">{t('navigation.courses')}</a>
          <a href="#profile">{t('navigation.profile')}</a>
          <a href="#settings">{t('navigation.settings')}</a>
        </nav>
      </section>

      {/* Ví dụ 3: Form với validation */}
      <section className="example-section">
        <h3>3. Form đăng nhập</h3>
        <div className="example-form">
          <div className="form-group">
            <label>{t('auth.email')}</label>
            <input type="email" placeholder={t('auth.email')} />
            <span className="error">{t('validation.email_invalid')}</span>
          </div>
          <div className="form-group">
            <label>{t('auth.password')}</label>
            <input type="password" placeholder={t('auth.password')} />
            <span className="error">{t('validation.password_min')}</span>
          </div>
          <button className="btn-primary">{t('auth.login')}</button>
          <a href="#forgot">{t('auth.forgot_password')}</a>
        </div>
      </section>

      {/* Ví dụ 4: Interpolation với biến */}
      <section className="example-section">
        <h3>4. Interpolation (sử dụng biến)</h3>
        <p>
          {/* Để sử dụng interpolation, bạn cần thêm vào file JSON như: */}
          {/* "greeting": "Xin chào, {{name}}!" */}
          User: {userName}
        </p>
        <p>
          Courses: {courseCount}
        </p>
      </section>

      {/* Ví dụ 5: Các buttons với actions */}
      <section className="example-section">
        <h3>5. Các action buttons</h3>
        <div className="button-group">
          <button className="btn-success">{t('common.save')}</button>
          <button className="btn-danger">{t('common.delete')}</button>
          <button className="btn-default">{t('common.cancel')}</button>
          <button className="btn-primary">{t('common.submit')}</button>
        </div>
      </section>

      {/* Ví dụ 6: User profile */}
      <section className="example-section">
        <h3>6. Thông tin người dùng</h3>
        <div className="user-info">
          <div className="info-row">
            <span className="label">{t('user.name')}:</span>
            <span className="value">{userName}</span>
          </div>
          <div className="info-row">
            <span className="label">{t('user.phone')}:</span>
            <span className="value">0123456789</span>
          </div>
          <div className="info-row">
            <span className="label">{t('user.address')}:</span>
            <span className="value">Hà Nội, Việt Nam</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ExampleComponent;
