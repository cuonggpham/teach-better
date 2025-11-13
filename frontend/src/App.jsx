import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

/**
 * Component App chính - Chỉ chứa layout và router-view
 */
function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Outlet />
        </main>
        <Footer />
      </div>
    </Suspense>
  );
}

export default App;
