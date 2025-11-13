import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import HomePage from '../pages/HomePage';
import ItemsPage from '../pages/ItemsPage';

/**
 * Cấu hình React Router
 */
const router = createBrowserRouter([
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
      // Thêm các routes khác ở đây
    ],
  },
]);

export default router;
