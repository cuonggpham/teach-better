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
import QuizPage from '../pages/QuizPage';
import AdminDashboard from '../pages/AdminDashboard';
import UserManagement from '../pages/UserManagement';
import UserDetail from '../pages/UserDetail';
import PostReportDetailPage from '../pages/PostReportDetailPage';
import ReportManagement from '../pages/ReportManagement';
import ReportManagementHub from '../pages/ReportManagementHub';
import UserReportManagement from '../pages/UserReportManagement';
import UserReportDetailPage from '../pages/UserReportDetailPage';
import AdminPostDetailPage from '../pages/AdminPostDetailPage';


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
        path: 'admin/posts/:postId',
        element: <AdminPostDetailPage />,
      },
      {
        path: 'admin/report-hub',
        element: <ReportManagementHub />,
      },
      {
        path: 'admin/user-reports',
        element: <UserReportManagement />,
      },
      {
        path: 'admin/reports',
        element: <ReportManagement />,
      },
      {
        path: 'admin/reports/:reportId',
        element: <PostReportDetailPage />,
      },
      {
        path: 'admin/user-reports/:reportId',
        element: <UserReportDetailPage />,
      },
      {
        path: 'diagnosis',
        element: <DiagnosisPage />,
      },
      {
        path: 'diagnosis/history',
        element: <DiagnosisHistoryPage />,
      },
      {
        path: 'quiz/:diagnosisId',
        element: <QuizPage />,
      },
    ],
  },
]);

export default router;