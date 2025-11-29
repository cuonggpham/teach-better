import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { getBookmarks, removeBookmark } from "../api/bookmarksApi";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import "./BookmarkPage.css";

const BookmarkPage = () => {
  const { user, token } = useAuth();
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load bookmark theo user
  useEffect(() => {
    if (user && token) {
      loadBookmarks();
    } else {
      setLoading(false);
    }
  }, [user, token]);

  const loadBookmarks = async () => {
    try {
      setLoading(true);
      const bookmarks = await getBookmarks(token);
      setData(bookmarks);
    } catch (error) {
      console.error("Error loading bookmarks:", error);
      toast.error(t("bookmark.load_error") || "Failed to load bookmarks");
    } finally {
      setLoading(false);
    }
  };

  // Xóa bookmark
  const handleRemoveBookmark = async (post) => {
    try {
      await removeBookmark(token, post._id);
      setData(data.filter(item => item._id !== post._id));
      toast.success(t("bookmark.removed"));
    } catch (error) {
      console.error("Error removing bookmark:", error);
      toast.error(t("bookmark.remove_error") || "Failed to remove bookmark");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const navigateToPost = (postId) => {
    navigate(`/posts/${postId}`);
  };

  // Nếu chưa login
  if (!user)
    return <p className="bookmark-login-required">{t("bookmark.need_login")}</p>;

  if (loading) {
    return <div className="bookmark-container"><p>{t("common.loading") || "Loading..."}</p></div>;
  }

  return (
    <div className="bookmark-container">
      <h1>{t("bookmark.title")}</h1>

      {data.length === 0 ? (
        <p className="bookmark-empty">{t("bookmark.empty")}</p>
      ) : (
        <ul className="bookmark-list">
          {data.map((post) => (
            <li key={post._id} className="bookmark-item">
              <div className="bookmark-info" onClick={() => navigateToPost(post._id)}>
                <h3>{post.title}</h3>
                <p className="bookmark-content-preview">{post.content?.substring(0, 150)}...</p>
                <div className="bookmark-meta">
                  <span className="bookmark-author">{t("post.by")} {post.author_id}</span>
                  {post.bookmarked_at && (
                    <span className="bookmark-date">
                      {t("bookmark.saved_at")}: {formatDate(post.bookmarked_at)}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveBookmark(post);
                }}
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
