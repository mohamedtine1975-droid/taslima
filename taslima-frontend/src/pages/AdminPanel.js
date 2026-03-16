import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useQueue } from '../hooks/useQueue';
import { ticketsAPI, queueAPI } from '../services/api';
import { rejoindreAdmin } from '../services/socket';
import './Admin.css';

const STATUTS = ['en_attente', 'en_cours', 'termine', 'annule', 'absent'];
const STATUT_LABELS = { en_attente: 'En attente', en_cours: 'En cours', termine: 'Terminé', annule: 'Annulé', absent: 'Absent' };
const STATUT_COLORS = { en_attente: '#C9A84C', en_cours: '#6EE9A5', termine: '#555', annule: '#FF6B6B', absent: '#FF8C42' };

const AdminPanel = () => {
  const { user, deconnexion, token } = useAuth();
  const { file, stats, dernierAppel, connecte } = useQueue();

  const [onglet, setOnglet] = useState('file');
  const [tousTickets, setTousTickets] = useState([]);
  const [filtreStatut, setFiltreStatut] = useState('');
  const [appelLoading, setAppelLoading] = useState(false);

  useEffect(() => {
    if (token) rejoindreAdmin(token);
  }, [token]);

  useEffect(() => {
    if (onglet === 'tous') chargerTousTickets();
  }, [onglet, filtreStatut]);

  const chargerTousTickets = async () => {
    try {
      const res = await ticketsAPI.tous({ statut: filtreStatut || undefined });
      setTousTickets(res.data.tickets);
    } catch (err) {
      toast.error('Impossible de charger les tickets');
    }
  };

  const appellerSuivant = async () => {
    setAppelLoading(true);
    try {
      const res = await queueAPI.appellerSuivant();
      if (res.data.ticket) {
        toast.success('Ticket ' + res.data.ticket.numero + ' appelé !');
      } else {
        toast('File vide.', { icon: '🎉' });
      }
    } catch {
      toast.error('Erreur lors de l\'appel');
    } finally {
      setAppelLoading(false);
    }
  };

  const changerStatut = async (id, statut) => {
    try {
      await ticketsAPI.changerStatut(id, statut);
      toast.success('Statut mis à jour → ' + STATUT_LABELS[statut]);
      if (onglet === 'tous') chargerTousTickets();
    } catch {
      toast.error('Erreur mise à jour statut');
    }
  };

  const StatBadge = ({ statut }) => (
    <span className="statut-badge" style={{ color: STATUT_COLORS[statut], borderColor: STATUT_COLORS[statut] + '40', background: STATUT_COLORS[statut] + '10' }}>
      {STATUT_LABELS[statut] || statut}
    </span>
  );

  return (
    <div className="admin-panel">
      {/* Notification appel */}
      {dernierAppel && (
        <div className="appel-banner">
          🔔 <strong>{dernierAppel.numero}</strong> — {dernierAppel.message}
        </div>
      )}

      {/* Sidebar admin */}
      <aside className="admin-sidebar">
        <div className="admin-logo">TASLIMA <span>ADMIN</span></div>
        <div className="admin-user">
          <div className="admin-avatar">{user?.nom?.substring(0, 2).toUpperCase()}</div>
          <div>
            <div className="admin-name">{user?.nom}</div>
            <div className="admin-role-badge">{user?.role}</div>
          </div>
        </div>
        <nav className="admin-nav">
          {[
            { id: 'file', label: 'File en direct', icon: '⏱' },
            { id: 'stats', label: 'Statistiques', icon: '📊' },
            { id: 'tous', label: 'Tous les tickets', icon: '🎫' },
          ].map(item => (
            <button key={item.id} className={onglet === item.id ? 'active' : ''} onClick={() => setOnglet(item.id)}>
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <div className="ws-dot">
            <span className={connecte ? 'green' : 'red'}></span>
            {connecte ? 'Temps réel actif' : 'Reconnexion...'}
          </div>
          <button className="back-link" onClick={() => window.location.href = '/'}>← Site public</button>
          <button className="logout-btn" onClick={deconnexion}>Déconnexion</button>
        </div>
      </aside>

      {/* Contenu admin */}
      <main className="admin-main">

        {/* FILE EN DIRECT */}
        {onglet === 'file' && (
          <div className="admin-content">
            <div className="admin-header">
              <h1>File d'attente <span className="live-dot">● LIVE</span></h1>
              <button className="btn-call" onClick={appellerSuivant} disabled={appelLoading}>
                {appelLoading ? '...' : '🔔 Appeler suivant'}
              </button>
            </div>

            {/* Panneau de contrôle */}
            <div className="control-panel">
              <div className="control-stat">
                <div className="cs-num" style={{ color: '#C9A84C' }}>{stats.enAttente}</div>
                <div className="cs-label">En attente</div>
              </div>
              <div className="control-stat">
                <div className="cs-num" style={{ color: '#6EE9A5' }}>{stats.enCours}</div>
                <div className="cs-label">En cours</div>
              </div>
              <div className="control-stat">
                <div className="cs-num">{stats.terminesAujourdhui}</div>
                <div className="cs-label">Terminés</div>
              </div>
              <div className="control-stat">
                <div className="cs-num" style={{ color: '#C9A84C' }}>{(stats.caJourCFA || 0).toLocaleString()}</div>
                <div className="cs-label">CFA aujourd'hui</div>
              </div>
            </div>

            {/* Tickets en file */}
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th><th>Ticket</th><th>Client</th><th>Service</th><th>Statut</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {file.length === 0 && (
                    <tr><td colSpan={6} className="empty-row">🎉 File vide !</td></tr>
                  )}
                  {file.map((t, i) => (
                    <tr key={t._id} className={t.statut === 'en_cours' ? 'row-active' : ''}>
                      <td className="td-pos">{i + 1}</td>
                      <td className="td-num">{t.numero}</td>
                      <td>{t.nomClient}</td>
                      <td className="td-service">{t.service?.replace(/_/g, ' ')}</td>
                      <td><StatBadge statut={t.statut} /></td>
                      <td className="td-actions">
                        {t.statut === 'en_attente' && (
                          <button className="action-btn call" onClick={() => changerStatut(t._id, 'en_cours')}>▶ Appeler</button>
                        )}
                        {t.statut === 'en_cours' && (
                          <button className="action-btn done" onClick={() => changerStatut(t._id, 'termine')}>✓ Terminer</button>
                        )}
                        {(t.statut === 'en_attente' || t.statut === 'en_cours') && (
                          <button className="action-btn absent" onClick={() => changerStatut(t._id, 'absent')}>Absent</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STATISTIQUES */}
        {onglet === 'stats' && (
          <div className="admin-content">
            <div className="admin-header"><h1>Statistiques du jour</h1></div>
            <div className="stats-bento">
              <div className="bento-card big">
                <div className="bento-label">Chiffre d'affaires aujourd'hui</div>
                <div className="bento-val gold">{(stats.caJourCFA || 0).toLocaleString()} CFA</div>
                <div className="bento-sub">sur {stats.terminesAujourdhui || 0} prestations</div>
              </div>
              <div className="bento-card">
                <div className="bento-label">En attente</div>
                <div className="bento-val">{stats.enAttente}</div>
              </div>
              <div className="bento-card">
                <div className="bento-label">En cours</div>
                <div className="bento-val" style={{ color: '#6EE9A5' }}>{stats.enCours}</div>
              </div>
              <div className="bento-card">
                <div className="bento-label">Terminés</div>
                <div className="bento-val">{stats.terminesAujourdhui}</div>
              </div>
              <div className="bento-card">
                <div className="bento-label">Ticket moyen</div>
                <div className="bento-val gold">
                  {stats.terminesAujourdhui ? Math.round((stats.caJourCFA || 0) / stats.terminesAujourdhui).toLocaleString() : 0} CFA
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TOUS LES TICKETS */}
        {onglet === 'tous' && (
          <div className="admin-content">
            <div className="admin-header">
              <h1>Tous les tickets</h1>
              <select className="filtre-select" value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}>
                <option value="">Tous les statuts</option>
                {STATUTS.map(s => <option key={s} value={s}>{STATUT_LABELS[s]}</option>)}
              </select>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Ticket</th><th>Client</th><th>Téléphone</th><th>Service</th><th>Prix</th><th>Statut</th><th>Date</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {tousTickets.length === 0 && <tr><td colSpan={8} className="empty-row">Aucun ticket trouvé.</td></tr>}
                  {tousTickets.map(t => (
                    <tr key={t._id}>
                      <td className="td-num">{t.numero}</td>
                      <td>{t.nomClient}</td>
                      <td className="td-tel">{t.telephoneClient}</td>
                      <td className="td-service">{t.service?.replace(/_/g, ' ')}</td>
                      <td className="td-prix">{t.prixCFA?.toLocaleString()} CFA</td>
                      <td><StatBadge statut={t.statut} /></td>
                      <td className="td-date">{new Date(t.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td className="td-actions">
                        <select className="statut-select" value={t.statut} onChange={e => changerStatut(t._id, e.target.value)}>
                          {STATUTS.map(s => <option key={s} value={s}>{STATUT_LABELS[s]}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
