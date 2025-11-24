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
      icon: '📚',
      title: t('home.features.learn.title'),
      description: t('home.features.learn.desc'),
    },
    {
      icon: '💬',
      title: t('home.features.community.title'),
      description: t('home.features.community.desc'),
    },
    {
      icon: '🎯',
      title: t('home.features.practice.title'),
      description: t('home.features.practice.desc'),
    },
    {
      icon: '⭐',
      title: t('home.features.quality.title'),
      description: t('home.features.quality.desc'),
    },
  ];

  const stats = [
    { number: '10K+', label: t('home.stats.users') },
    { number: '500+', label: t('home.stats.courses') },
    { number: '50K+', label: t('home.stats.posts') },
    { number: '99%', label: t('home.stats.satisfaction') },
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <Container size="large">
          <div className="hero-content">
            <div className="hero-badge">
              {t('home.badge')}
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
                  <Button as={Link} to="/signup" variant="primary" size="large">
                    {t('auth.register')}
                  </Button>
                  <Button as={Link} to="/signin" variant="outline" size="large" className="btn-white-outline">
                    {t('auth.login')}
                  </Button>
                </>
              ) : (
                <Button as={Link} to="/forum" variant="primary" size="large">
                  {t('navigation.forum')}
                </Button>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <Container size="large">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item">
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
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
              <Card key={index} variant="elevated" padding="large" className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="cta-section">
          <Container size="medium">
            <Card variant="elevated" padding="large" className="cta-card">
              <h2 className="cta-title">
                {t('home.cta.title')}
              </h2>
              <p className="cta-description">
                {t('home.cta.desc')}
              </p>
              <Button as={Link} to="/signup" variant="primary" size="large">
                {t('auth.register')}
              </Button>
            </Card>
          </Container>
        </section>
      )}
    </div>
  );
};

export default HomePage;
