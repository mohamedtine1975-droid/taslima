import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useQueue } from '../hooks/useQueue';
import { ticketsAPI } from '../services/api';
import { suivreMonTicket } from '../services/socket';
import TicketModal from '../components/tickets/TicketModal';
import PaymentModal from '../components/payment/PaymentModal';
import './Dashboard.css';

const SERVICES = [
  { id: 'coupe_simple', label: 'Coupe Simple', prix: 2500, duree: '15 min', badge: 'Populaire' },
  { id: 'coupe_barbe', label: 'Coupe + Barbe', prix: 3000, duree: '30 min', badge: 'Populaire' },
  { id: 'degrade_simple', label: 'Dégradé Simple', prix: 3000, duree: '25 min' },
  { id: 'degrade_noir', label: 'Dégradé + Noir', prix: 5000, duree: '35 min', badge: '★ Premium' },
  { id: 'degrade_enfant', label: 'Dégradé Enfant', prix: 2500, duree: '20 min' },
  { id: 'degrade_enfant_noir', label: 'Dégradé Enfant + Noir', prix: 3500, duree: '30 min' },
  { id: 'taper', label: 'Taper', prix: 5000, duree: '30 min' },
  { id: 'teinture_partielle', label: 'Teinture Partielle', prix: 6000, duree: '40 min', badge: 'Nouveau' },
  { id: 'teinture_complete', label: 'Teinture Complète', prix: 10000, duree: '60 min', badge: 'Nouveau' },
  { id: 'teinture_coiffure', label: 'Teinture + Coiffure', prix: 13000, duree: '75 min', badge: '★ Premium' },
  { id: 'lavage', label: 'Lavage', prix: 1500, duree: '10 min' },
];

const Dashboard = () => {
  const { user, deconnexion } = useAuth();
  const { file, stats, dernierAppel, connecte } = useQueue();
  const navigate = useNavigate();

  const [onglet, setOnglet] = useState('accueil'); // accueil | menu | file | mes-tickets
  const [mesTickets, setMesTickets] = useState([]);
  const [ticketModal, setTicketModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState(null); // { ticket, service }
  const [ticketEnCours, setTicketEnCours] = useState(null);

  useEffect(() => {
    if (onglet === 'mes-tickets') {
      ticketsAPI.mesTickets()
        .then(res => setMesTickets(res.data.tickets))
        .catch(console.error);
    }
  }, [onglet]);

  const onTicketCree = (ticket) => {
    setTicketModal(false);
    setTicketEnCours(ticket);
    toast.success('Ticket ' + ticket.numero + ' créé !');

    // Écouter les notifications pour ce ticket
    suivreMonTicket(ticket.numero, (data) => {
      toast.success(data.message, { duration: 6000 });
      if (data.statut === 'en_cours') {
        toast('🔔 C\'est votre tour ! Présentez-vous au coiffeur.', { icon: '✂', duration: 10000 });
      }
    });
  };

  const commanderTicket = (service) => {
    // Proposer paiement Wave/Orange Money ou paiement sur place
    setPaymentModal({ service });
  };

  const statusBadge = (statut) => {
    const colors = {
      en_attente: '#C9A84C',
      en_cours: '#6EE9A5',
      termine: '#888',
      annule: '#FF6B6B',
      absent: '#FF8C42'
    };
    const labels = { en_attente: 'En attente', en_cours: 'En cours', termine: 'Terminé', annule: 'Annulé', absent: 'Absent' };
    return (
      <span style={{ color: colors[statut] || '#888', fontSize: '0.78rem', fontWeight: 500 }}>
        {labels[statut] || statut}
      </span>
    );
  };

  return (
    <div className="dashboard">
      {/* Notification appel */}
      {dernierAppel && (
        <div className="appel-banner">
          <span>🔔</span>
          <strong>{dernierAppel.numero}</strong> — {dernierAppel.message}
        </div>
      )}

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">TALISMAN</div>
        <div className="sidebar-user">
          <div className="user-avatar">{user?.nom?.substring(0, 2).toUpperCase()}</div>
          <div>
            <div className="user-name">{user?.nom}</div>
            <div className="user-role">{user?.role === 'client' ? 'Client' : user?.role}</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {[
            { id: 'accueil', icon: '⬛', label: 'Tableau de bord' },
            { id: 'menu', icon: '✂', label: 'Menu & Tarifs' },
            { id: 'file', icon: '⏱', label: 'File d\'attente' },
            { id: 'mes-tickets', icon: '🎫', label: 'Mes Tickets' },
          ].map(item => (
            <button key={item.id} className={onglet === item.id ? 'active' : ''} onClick={() => setOnglet(item.id)}>
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="ws-status">
            <span className={connecte ? 'dot-green' : 'dot-red'}></span>
            {connecte ? 'Connecté en direct' : 'Reconnexion...'}
          </div>
          <button className="btn-logout" onClick={deconnexion}>Déconnexion</button>
        </div>
      </aside>

      {/* Main content */}
      <main className="dash-main">

        {/* ACCUEIL */}
        {onglet === 'accueil' && (
          <div className="dash-content">
            <div className="dash-header">
              <h1>Bonjour, {user?.nom?.split(' ')[0]} 👋</h1>
              <button className="btn-gold" onClick={() => setTicketModal(true)}>+ Prendre un ticket</button>
            </div>

            {/* Ticket en cours */}
            {ticketEnCours && (
              <div className="ticket-actif">
                <div className="ticket-actif-label">Mon ticket actif</div>
                <div className="ticket-num">{ticketEnCours.numero}</div>
                <div className="ticket-service">{ticketEnCours.service}</div>
                <div className="ticket-attente">
                  {ticketEnCours.avantMoi > 0
                    ? ticketEnCours.avantMoi + ' personnes avant vous — ' + ticketEnCours.tempsAttenteEstime
                    : 'Prochaine coupe !'}
                </div>
              </div>
            )}

            {/* Stats rapides */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">En attente</div>
                <div className="stat-val">{stats.enAttente}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">En cours</div>
                <div className="stat-val" style={{ color: '#6EE9A5' }}>{stats.enCours}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Terminés aujourd'hui</div>
                <div className="stat-val">{stats.terminesAujourdhui}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Mes coupes totales</div>
                <div className="stat-val">{user?.totalCoupes || 0}</div>
              </div>
            </div>

            {/* Derniers tickets de la file */}
            <div className="section-block">
              <h3>File d'attente en direct</h3>
              {file.length === 0
                ? <p className="empty-msg">Aucun client en attente.</p>
                : file.slice(0, 5).map((t, i) => (
                  <div key={t._id} className="file-row">
                    <span className="file-pos">{i + 1}</span>
                    <span className="file-num">{t.numero}</span>
                    <span className="file-name">{t.nomClient}</span>
                    <span className="file-service">{t.service?.replace(/_/g, ' ')}</span>
                    {statusBadge(t.statut)}
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* MENU */}
        {onglet === 'menu' && (
          <div className="dash-content">
            <div className="dash-header"><h1>Menu & Tarifs</h1></div>
            <div className="menu-grid">
              {SERVICES.map(s => (
                <div key={s.id} className="menu-card">
                  <div className="menu-card-top">
                    <span className="menu-name">{s.label}</span>
                    {s.badge && <span className="menu-badge">{s.badge}</span>}
                  </div>
                  <div className="menu-info">
                    <span className="menu-duree">⏱ {s.duree}</span>
                    <span className="menu-prix">{s.prix.toLocaleString()} CFA</span>
                  </div>
                  <button className="btn-outline-small" onClick={() => commanderTicket(s)}>
                    Commander →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FILE D'ATTENTE */}
        {onglet === 'file' && (
          <div className="dash-content">
            <div className="dash-header">
              <h1>File d'attente</h1>
              <span className="live-badge">● LIVE</span>
            </div>
            <div className="file-full">
              {file.length === 0
                ? <div className="empty-state"><div style={{ fontSize: '3rem' }}>✂</div><p>File vide — Pas d'attente !</p></div>
                : file.map((t, i) => (
                  <div key={t._id} className={'file-card ' + t.statut}>
                    <div className="fc-pos">{i + 1}</div>
                    <div className="fc-info">
                      <div className="fc-num">{t.numero}</div>
                      <div className="fc-name">{t.nomClient}</div>
                      <div className="fc-service">{t.service?.replace(/_/g, ' ')}</div>
                    </div>
                    <div className="fc-right">
                      {statusBadge(t.statut)}
                      <div className="fc-prix">{t.prixCFA?.toLocaleString()} CFA</div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* MES TICKETS */}
        {onglet === 'mes-tickets' && (
          <div className="dash-content">
            <div className="dash-header"><h1>Mes Tickets</h1></div>
            {mesTickets.length === 0
              ? <div className="empty-state"><p>Aucun ticket pour le moment.</p><button className="btn-gold" onClick={() => setTicketModal(true)}>Prendre un ticket →</button></div>
              : (
                <div className="tickets-list">
                  {mesTickets.map(t => (
                    <div key={t._id} className="ticket-item">
                      <div className="ti-num">{t.numero}</div>
                      <div className="ti-info">
                        <div className="ti-service">{t.service?.replace(/_/g, ' ')}</div>
                        <div className="ti-date">{new Date(t.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      <div className="ti-right">
                        {statusBadge(t.statut)}
                        <div className="ti-prix">{t.prixCFA?.toLocaleString()} CFA</div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        )}
      </main>

      {/* Modals */}
      {ticketModal && <TicketModal onClose={() => setTicketModal(false)} onSuccess={onTicketCree} services={SERVICES} />}
      {paymentModal && <PaymentModal service={paymentModal.service} user={user} onClose={() => setPaymentModal(null)} onSuccess={onTicketCree} />}

      {/* Navigation mobile bas d'écran */}
      <nav className="mobile-nav">
        {[
          { id: 'accueil', icon: '⬛', label: 'Accueil' },
          { id: 'menu', icon: '✂', label: 'Menu' },
          { id: 'file', icon: '⏱', label: 'File' },
          { id: 'mes-tickets', icon: '🎫', label: 'Tickets' },
        ].map(item => (
          <button key={item.id} className={onglet === item.id ? 'mobile-nav-btn active' : 'mobile-nav-btn'} onClick={() => setOnglet(item.id)}>
            <span className="mobile-nav-icon">{item.icon}</span>
            <span className="mobile-nav-label">{item.label}</span>
          </button>
        ))}
        <button className="mobile-nav-btn" onClick={() => setTicketModal(true)}>
          <span className="mobile-nav-icon">+</span>
          <span className="mobile-nav-label">Ticket</span>
        </button>
      </nav>
    </div>
  );
};

export default Dashboard;navbar 