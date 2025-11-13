import { useTranslation } from 'react-i18next';
import './ItemsPage.css';

/**
 * Component ItemsPage - Trang Todo List
 */
const ItemsPage = () => {
  const { t } = useTranslation();

  return (
    <div className="items-page">
      <h1>{t('navigation.courses')}</h1>
      <p>Trang Todo List sẽ được phát triển ở đây</p>
    </div>
  );
};

export default ItemsPage;
