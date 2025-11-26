import { useTranslation } from 'react-i18next';
import { Container, Card } from '../components/ui';
import './ItemsPage.css';

/**
 * Component ItemsPage - Trang khóa học/Todo List
 */
const ItemsPage = () => {
  const { t } = useTranslation();

  return (
    <div className="items-page">
      <Container size="large">
        <div className="items-header">
          <h1>{t('navigation.courses')}</h1>
          <p className="items-subtitle">
            {t('courses.subtitle')}
          </p>
        </div>

        <Card variant="elevated" padding="large" className="coming-soon-card">
          <div className="coming-soon-content">
            <div className="coming-soon-icon">🚀</div>
              <h2>{t('common.coming_soon')}</h2>
              <p>{t('courses.coming_soon_desc')}</p>
          </div>
        </Card>
      </Container>
    </div>
  );
};

export default ItemsPage;
