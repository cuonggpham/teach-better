import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Container, Card, Button } from '../components/ui';
import './HomePage.css';

/**
 * Component HomePage - Trang chủ với hero section và features
 */
const HomePage = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
      title: t('home.features.community.title'),
      description: t('home.features.community.desc'),
      link: '/forum'
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
          <path d="M12 2a7 7 0 0 1 7 7h-7V2z" />
          <circle cx="12" cy="14" r="2" />
          <path d="M12 16v4" />
          <path d="M8 20h8" />
        </svg>
      ),
      title: t('navigation.diagnosis'),
      description: t('home.features.practice.desc'),
      link: '/diagnosis'
    },
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <Container size="large">
          <div className="hero-content">
            <div className="hero-card">
              <div className="hero-decoration">
                <span className="decoration-dot"></span>
                <span className="decoration-dot"></span>
                <span className="decoration-dot"></span>
              </div>
              <h1 className="hero-title">
                {t('welcome')}
              </h1>
              <p className="hero-subtitle">
                {t('home.subtitle')}
              </p>
              <div className="hero-actions">
                {!isAuthenticated ? (
                  <>
                    <Button as={Link} to="/signin" variant="outline" size="medium" className="btn-outline">
                      {t('auth.login')}
                    </Button>
                    <Button as={Link} to="/signup" variant="outline" size="medium" className="btn-outline">
                      {t('auth.register')}
                    </Button>
                  </>
                ) : (
                  <Button as={Link} to="/forum" variant="primary" size="medium" className="btn-primary-action">
                    {t('navigation.forum')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <Container size="large">
          <div className="section-header">
            <h2 className="section-title">{t('home.features.title')}</h2>
            <p className="section-subtitle">
              {t('home.features.subtitle')}
            </p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <Card
                key={index}
                variant="elevated"
                padding="large"
                className="feature-card"
                as={Link}
                to={feature.link}
              >
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>
    </div>
  );
};

export default HomePage;
