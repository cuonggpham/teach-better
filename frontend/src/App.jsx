import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

/**
 * Component App chính - Chỉ chứa layout và router-view
 */
function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<div>Loading...</div>}>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Outlet />
          </main>
          <Footer />
        </div>
      </Suspense>
    </AuthProvider>
  );
}

export default App;