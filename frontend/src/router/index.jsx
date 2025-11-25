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
      {
        path: 'signup',
        element: <SignUpPage />,
      },
      {
        path: 'signin',
        element: <SignInPage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
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
    ],
  },
]);

export default router;
