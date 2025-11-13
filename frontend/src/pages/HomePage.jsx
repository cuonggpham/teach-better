import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import reactLogo from '../assets/react.svg';
import viteLogo from '/vite.svg';
import ExampleComponent from '../components/ExampleComponent';
import './HomePage.css';

/**
 * Component HomePage - Trang chủ
 */
const HomePage = () => {
  const [count, setCount] = useState(0);
  const { t } = useTranslation();

  return (
    <div className="home-page">
      {/* Original Demo Content */}
      <div className="logos">
        <a href="https://vite.dev" target="_blank" rel="noreferrer">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noreferrer">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      
      <h1>Vite + React</h1>
      
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          {t('common.submit')} count is {count}
        </button>
        <p>
          Edit <code>src/pages/HomePage.jsx</code> and save to test HMR
        </p>
      </div>
      
      <p className="read-the-docs">
        {t('welcome')} - Click on the Vite and React logos to learn more
      </p>

      {/* Example Component với các ví dụ i18n */}
      <ExampleComponent />
    </div>
  );
};

export default HomePage;
