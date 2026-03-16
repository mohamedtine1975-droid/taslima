import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const AuthPage = () => {
  const [mode, setMode] = useState('connexion'); // connexion | inscription
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nom: '', telephone: '', password: '', confirmer: '' });
  const { connexion } = useAuth();
  const navigate = useNavigate();

  const changer = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const soumettre = async (e) => {
    e.preventDefault();
    if (mode === 'inscription' && form.password !== form.confirmer) {
      toast.error('Les mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    try {
      const fn = mode === 'connexion' ? authAPI.connexion : authAPI.inscription;
      const payload = mode === 'connexion'
        ? { telephone: form.telephone, password: form.password }
        : { nom: form.nom, telephone: form.telephone, password: form.password };
      const res = await fn(payload);
      connexion(res.data.token, res.data.user);
      toast.success(res.data.message);
      navigate(res.data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-logo">TASLIMA</div>
          <div className="auth-tagline">L'élégance en toute simplicité</div>
          <div className="auth-scissor">✂</div>
          <div className="auth-features">
            <div className="auth-feat"><span>→</span> Tickets en temps réel</div>
            <div className="auth-feat"><span>→</span> Historique de vos coupes</div>
            <div className="auth-feat"><span>→</span> Offres exclusives membres</div>
            <div className="auth-feat"><span>→</span> Programme fidélité Gold</div>
          </div>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-tabs">
            <button className={mode === 'connexion' ? 'active' : ''} onClick={() => setMode('connexion')}>Connexion</button>
            <button className={mode === 'inscription' ? 'active' : ''} onClick={() => setMode('inscription')}>S'inscrire</button>
          </div>
          <h2>{mode === 'connexion' ? 'Bon retour !' : 'Créer un compte'}</h2>
          <form onSubmit={soumettre}>
            {mode === 'inscription' && (
              <div className="form-group">
                <label>Nom complet</label>
                <input name="nom" type="text" placeholder="Moussa Diallo" value={form.nom} onChange={changer} required />
              </div>
            )}
            <div className="form-group">
              <label>Téléphone</label>
              <input name="telephone" type="tel" placeholder="+221 77 000 00 00" value={form.telephone} onChange={changer} required />
            </div>
            <div className="form-group">
              <label>Mot de passe</label>
              <input name="password" type="password" placeholder="••••••••" value={form.password} onChange={changer} required />
            </div>
            {mode === 'inscription' && (
              <div className="form-group">
                <label>Confirmer</label>
                <input name="confirmer" type="password" placeholder="••••••••" value={form.confirmer} onChange={changer} required />
              </div>
            )}
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Chargement...' : mode === 'connexion' ? 'Se connecter →' : 'Créer mon compte →'}
            </button>
          </form>
          <p className="auth-back"><a href="/">← Retour à l'accueil</a></p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
