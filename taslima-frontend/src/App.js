import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute } from './components/layout/ProtectedRoute';
import './index.css';

// Lazy-loaded pages
const HomePage = lazy(() => import('./pages/HomePage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

const LoadingFallback = () => (
  <div className="loading-screen">
    <div className="loading-scissors">✂</div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<HomePage />} />
            <Route path="/connexion" element={<AuthPage />} />

            {/* Client connecté */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            {/* Admin seulement */}
            <Route path="/admin" element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>

        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1A1A1A',
              color: '#F5F0E8',
              border: '1px solid rgba(201,168,76,0.2)',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.88rem',
            },
            success: {
              iconTheme: { primary: '#C9A84C', secondary: '#0A0A0A' }
            },
            error: {
              iconTheme: { primary: '#FF6B6B', secondary: '#0A0A0A' }
            }
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
