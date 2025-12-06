import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import IntroPage from '../pages/IntroPage';
import HomePage from '../pages/HomePage';
import ItemsPage from '../pages/ItemsPage';
import SignUpPage from '../pages/SignUpPage';
import SignInPage from '../pages/SignInPage';
import ProfilePage from '../pages/ProfilePage';
import ForumPage from '../pages/ForumPage';
import PostDetailPage from '../pages/PostDetailPage';
import CreatePostPage from '../pages/CreatePostPage';
import CategoryManagement from '../components/ui/CategoryManagement';
import PostManagement from '../components/ui/PostManagement';
import CategoryPage from '../pages/CategoryPage';
import DiagnosisPage from '../pages/DiagnosisPage';
import DiagnosisHistoryPage from '../pages/DiagnosisHistoryPage';
import AdminDashboard from '../pages/AdminDashboard';
import UserManagement from '../pages/UserManagement';
import UserDetail from '../pages/UserDetail';

/**
 * Cấu hình React Router
 */
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      // Trang Intro (khi chưa login)
      {
        index: true,
        element: <IntroPage />,
      },

      // Trang Home sau khi login
      {
        path: "home",
        element: <HomePage />,
      },

      // Todo Items page
      {
        path: "courses",
        element: <ItemsPage />,
      },

      // Auth pages
      {
        path: 'signup',
        element: <SignUpPage />,
      },
      {
        path: 'signin',
        element: <SignInPage />,
      },

      // User pages
      {
        path: 'profile',
        element: <ProfilePage />,
      },

      // Forum pages
      {
        path: 'forum',
        element: <ForumPage />,
      },
      {
        path: 'forum/create',
        element: <CreatePostPage />,
      },
      {
        path: 'forum/:postId',
        element: <PostDetailPage />,
      },

      // Category pages
      {
        path: 'category/:categoryId',
        element: <CategoryPage />,
      },

      // Admin pages
      {
        path: 'admin',
        element: <AdminDashboard />,
      },
      {
        path: 'admin/users',
        element: <UserManagement />,
      },
      {
        path: 'admin/users/:userId',
        element: <UserDetail />,
      },
      {
        path: 'admin/categories',
        element: <CategoryManagement />,
      },
      {
        path: 'admin/posts',
        element: <PostManagement />,
      },
      {
        path: 'diagnosis',
        element: <DiagnosisPage />,
      },
      {
        path: 'diagnosis/history',
        element: <DiagnosisHistoryPage />,
      },
    ],
  },
]);

export default router;