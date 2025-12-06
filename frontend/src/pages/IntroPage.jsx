import React from "react";
import { Link, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import "./IntroPage.css";

const IntroPage = () => {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();

  // Redirect based on user role if already logged in
  if (isAuthenticated) {
    if (user?.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="intro-container">
      <h1>{t('welcome')}</h1>
      <p>{t('home.subtitle')}</p>

      <Link to="/signin" className="intro-button">
        {t('home.cta.title')}
      </Link>
    </div>
  );
};

export default IntroPage;
