import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restaurer session au démarrage
  useEffect(() => {
    const savedToken = localStorage.getItem('taslima_token');
    const savedUser = localStorage.getItem('taslima_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      // Vérifier que le token est encore valide
      authAPI.moi()
        .then(res => setUser(res.data.user))
        .catch(() => deconnexion())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const connexion = (tokenRecu, userRecu) => {
    localStorage.setItem('taslima_token', tokenRecu);
    localStorage.setItem('taslima_user', JSON.stringify(userRecu));
    setToken(tokenRecu);
    setUser(userRecu);
  };

  const deconnexion = () => {
    localStorage.removeItem('taslima_token');
    localStorage.removeItem('taslima_user');
    setToken(null);
    setUser(null);
  };

  const estConnecte = !!token && !!user;
  const estAdmin = user?.role === 'admin';
  const estCoiffeur = user?.role === 'coiffeur' || user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, token, loading, estConnecte, estAdmin, estCoiffeur, connexion, deconnexion, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être dans AuthProvider');
  return ctx;
};
