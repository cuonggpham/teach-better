import { createBrowserRouter } from "react-router-dom";
import App from "../App";

import IntroPage from "../pages/IntroPage";
import HomePage from "../pages/HomePage";
import ItemsPage from "../pages/ItemsPage";
import LoginPage from "../pages/LoginPage";
import BookmarkPage from "../pages/BookmarkPage";

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

      // NEW: Trang Bookmark
      {
        path: "bookmark",
        element: <BookmarkPage />,
      },

      // Login page
      {
        path: "login",
        element: <LoginPage />,
      },
    ],
  },
]);

export default router;
