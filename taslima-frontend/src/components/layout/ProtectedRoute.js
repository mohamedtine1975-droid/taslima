import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Route protégée — redirige vers /connexion si non connecté
export const ProtectedRoute = ({ children }) => {
  const { estConnecte, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="loading-scissors">✂</div></div>;
  if (!estConnecte) return <Navigate to="/connexion" replace />;
  return children;
};

// Route admin — redirige vers /dashboard si pas admin
export const AdminRoute = ({ children }) => {
  const { estConnecte, estAdmin, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="loading-scissors">✂</div></div>;
  if (!estConnecte) return <Navigate to="/connexion" replace />;
  if (!estAdmin) return <Navigate to="/dashboard" replace />;
  return children;
};
