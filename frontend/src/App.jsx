import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { useToast } from './contexts/ToastContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import { ToastContainer } from './components/ui/Toast';

/**
 * Component App chính - Chỉ chứa layout và router-view
 */
function AppContent() {
  const { toasts, removeToast } = useToast();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Outlet />
        </main>
        <Footer />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </Suspense>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;