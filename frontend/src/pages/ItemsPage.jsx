import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { getBookmarks, toggleBookmark } from "../api/bookmarkApi";
import "./ItemsPage.css";

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
      <h1>{t("navigation.courses")}</h1>

      <div className="items-grid">
        {courses.map((course) => (
          <div key={course.id} className="item-card">
            <div className="item-header">
              <h3>{course.title}</h3>

              {/* Bookmark button */}
              <button
                className="bookmark-btn"
                onClick={() => handleBookmark(course)}
              >
                {isBookmarked(course.id) ? "⭐" : "☆"}
              </button>
            </div>

            <p className="item-desc">{course.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ItemsPage;
