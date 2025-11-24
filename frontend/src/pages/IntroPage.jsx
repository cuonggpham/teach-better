import React from "react";
import { Link } from "react-router-dom";
import "./IntroPage.css";

const IntroPage = () => {
  return (
    <div className="intro-container">
      <h1>Welcome to Teach Better</h1>
      <p>Nền tảng học tập hiện đại, thông minh và dễ sử dụng.</p>

      <Link to="/login" className="intro-button">
        Bắt đầu ngay
      </Link>
    </div>
  );
};

export default IntroPage;
