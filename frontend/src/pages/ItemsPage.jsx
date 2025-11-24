import { useTranslation } from 'react-i18next';
import { Container, Card } from '../components/ui';
import './ItemsPage.css';

/**
 * Component ItemsPage - Trang khóa học/Todo List
 */
const ItemsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Fake data (vì chưa có backend)
  const courses = [
    { id: 1, title: "React Cơ bản", description: "Học React từ số 0" },
    { id: 2, title: "FastAPI Pro", description: "Xây dựng backend với FastAPI" },
    { id: 3, title: "MongoDB Master", description: "Thiết kế DB NoSQL chuyên nghiệp" },
    { id: 4, title: "Docker từ A → Z", description: "Triển khai ứng dụng với Docker" },
  ];

  const [bookmarks, setBookmarks] = useState([]);

  // Load bookmark theo user
  useEffect(() => {
    if (user) {
      setBookmarks(getBookmarks(user._id));
    }
  }, [user]);

  // Toggle bookmark
  const handleBookmark = (course) => {
    if (!user) {
      alert("Bạn cần đăng nhập để bookmark!");
      return;
    }

    const updated = toggleBookmark(user._id, course);
    setBookmarks(updated);
  };

  const isBookmarked = (id) => {
    return bookmarks.some((b) => b.id === id);
  };

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
