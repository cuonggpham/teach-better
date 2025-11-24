import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getBookmarks, toggleBookmark } from "../api/bookmarkApi";
import { useTranslation } from "react-i18next";
import "./BookmarkPage.css";

const BookmarkPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [data, setData] = useState([]);

  // Load bookmark theo user
  useEffect(() => {
    if (user?._id) {
      setData(getBookmarks(user._id));
    }
  }, [user]);

  // Xóa bookmark
  const removeBookmark = (item) => {
    if (!window.confirm(t("bookmark.confirm_remove"))) return;

    const updated = toggleBookmark(user._id, item);
    setData(updated);
  };

  // Nếu chưa login
  if (!user)
    return <p className="bookmark-login-required">{t("bookmark.need_login")}</p>;

  return (
    <div className="bookmark-container">
      <h1>{t("bookmark.title")}</h1>

      {data.length === 0 ? (
        <p className="bookmark-empty">{t("bookmark.empty")}</p>
      ) : (
        <ul className="bookmark-list">
          {data.map((item) => (
            <li key={item.id} className="bookmark-item">
              <div className="bookmark-info">
                <h3>{item.title}</h3>
                <p>
                  {t("bookmark.saved_at")}:{" "}
                  {new Date(item.bookmarkedAt).toLocaleString()}
                </p>
              </div>

              <button
                onClick={() => removeBookmark(item)}
                className="remove-btn"
              >
                {t("common.remove")}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BookmarkPage;
