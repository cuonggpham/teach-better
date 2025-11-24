import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import HomePage from '../pages/HomePage';
import ItemsPage from '../pages/ItemsPage';
import SignUpPage from '../pages/SignUpPage';
import SignInPage from '../pages/SignInPage';
import ForumPage from '../pages/ForumPage';
import ForumDetailPage from '../pages/ForumDetailPage';

/**
 * Cấu hình React Router
 */
const router = createBrowserRouter([
  {
    path: '/signup',
    element: <SignUpPage />,
  },
  {
    path: '/signin',
    element: <SignInPage />,
  },
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'courses',
        element: <ItemsPage />,
      },
      {
        path: 'forum',
        element: <ForumPage />,
      },
      {
        path: 'forum/:postId',
        element: <ForumDetailPage />,
      },
      // Thêm các routes khác ở đây
    ],
  },
]);

export default router;
