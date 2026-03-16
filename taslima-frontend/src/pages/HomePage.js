import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { queueAPI } from '../services/api';
import './HomePage.css';

const SERVICES = [
  { label: 'Coupe Simple', prix: 1500, badge: null },
  { label: 'Dégradé Américain', prix: 2500, badge: 'Populaire' },
  { label: 'Coupe + Barbe', prix: 3500, badge: 'Populaire' },
  { label: 'Rasage Traditionnel', prix: 1800, badge: null },
  { label: 'Twists / Dreadlocks', prix: 5000, badge: 'Nouveau' },
  { label: 'Soin Cuir Chevelu', prix: 2000, badge: 'Nouveau' },
  { label: 'Coupe Enfant', prix: 1000, badge: null },
  { label: 'Forfait VIP', prix: 7500, badge: '★ Premium' },
];

const AVIS = [
  { nom: 'Moussa K.', initiales: 'MK', texte: 'Meilleur coiffeur de Dakar. Le dégradé est impeccable à chaque visite, depuis 3 ans.', service: 'Dégradé Américain' },
  { nom: 'Abdou F.', initiales: 'AF', texte: 'Le système de ticket en ligne a tout changé. Plus d\'attente debout, j\'arrive juste à temps.', service: 'Forfait VIP' },
  { nom: 'Ibrahima S.', initiales: 'IS', texte: 'Le rasage traditionnel est une expérience à part. Serviette chaude, lame propre, after-shave. Chef !', service: 'Rasage Traditionnel' },
];

const HomePage = () => {
  const { estConnecte, estAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ enAttente: 0, enCours: 0, terminesAujourdhui: 0 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    queueAPI.stats().then(res => setStats(res.data.stats)).catch(() => {});
  }, []);

  const goTicket = () => {
    if (estConnecte) navigate('/dashboard');
    else navigate('/connexion');
  };

  return (
    <div className="home">
      {/* Bannière promo */}
      <div className="promo-bar">
        ✦ Offre spéciale : Coupe + Barbe à <strong>3 500 CFA</strong> — Ce week-end uniquement
      </div>

      {/* Nav */}
      <nav className="home-nav">
        <div className="nav-logo">TASLIMA</div>
        <div className={'nav-links ' + (mobileMenuOpen ? 'open' : '')}>
          <a href="#services">Services</a>
          <a href="#file">File live</a>
          <a href="#avis">Avis</a>
          <a href="#contact">Contact</a>
        </div>
        <div className="nav-actions">
          {estConnecte ? (
            <>
              {estAdmin && <button className="nav-btn-outline" onClick={() => navigate('/admin')}>Admin</button>}
              <button className="nav-btn-gold" onClick={() => navigate('/dashboard')}>Mon espace →</button>
            </>
          ) : (
            <>
              <button className="nav-btn-outline" onClick={() => navigate('/connexion')}>Connexion</button>
              <button className="nav-btn-gold" onClick={goTicket}>Prendre un ticket</button>
            </>
          )}
        </div>
        <button className="hamburger" onClick={() => setMobileMenuOpen(o => !o)}>
          <span></span><span></span><span></span>
        </button>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-grid-bg"></div>
        <div className="hero-content">
          <div className="hero-badge">✦ Coiffure Prestige — Dakar, Sénégal</div>
          <h1 className="hero-title">L'Art du<br /><span className="hero-italic">Style Parfait</span></h1>
          <p className="hero-sub">Maîtrise, précision et élégance au service de votre image. Réservez votre ticket en ligne, arrivez à temps.</p>
          <div className="hero-btns">
            <button className="btn-gold-lg" onClick={goTicket}>Réserver mon ticket ✦</button>
            <a href="#services" className="btn-ghost-lg">Voir les tarifs</a>
          </div>
          <div className="hero-stats">
            <div className="hs"><div className="hs-n">2 400+</div><div className="hs-l">Clients satisfaits</div></div>
            <div className="hs-sep"></div>
            <div className="hs"><div className="hs-n">8 ans</div><div className="hs-l">D'expérience</div></div>
            <div className="hs-sep"></div>
            <div className="hs"><div className="hs-n" style={{ color: '#6EE9A5' }}>{stats.enAttente}</div><div className="hs-l">En attente live</div></div>
            <div className="hs-sep"></div>
            <div className="hs"><div className="hs-n">4.9 ★</div><div className="hs-l">Note moyenne</div></div>
          </div>
        </div>
      </section>

      {/* File en direct */}
      <section id="file" className="live-section">
        <div className="live-inner">
          <div className="live-left">
            <div className="section-label">● EN DIRECT</div>
            <h2>File d'attente<br />maintenant</h2>
            <p>Consultez la file en temps réel avant de vous déplacer.</p>
            <button className="btn-gold-lg" onClick={goTicket}>Prendre ma place →</button>
          </div>
          <div className="live-cards">
            <div className="live-stat-card">
              <div className="lsc-num" style={{ color: '#C9A84C' }}>{stats.enAttente}</div>
              <div className="lsc-label">En attente</div>
            </div>
            <div className="live-stat-card">
              <div className="lsc-num" style={{ color: '#6EE9A5' }}>{stats.enCours}</div>
              <div className="lsc-label">En cours</div>
            </div>
            <div className="live-stat-card">
              <div className="lsc-num">{stats.terminesAujourdhui}</div>
              <div className="lsc-label">Terminés aujourd'hui</div>
            </div>
            <div className="live-stat-card">
              <div className="lsc-num">~{stats.enAttente * 20} min</div>
              <div className="lsc-label">Attente estimée</div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="services-section">
        <div className="section-inner">
          <div className="section-label">✦ Nos prestations</div>
          <h2>Menu & Tarifs</h2>
          <p className="section-sub">Tous les prix sont en Francs CFA. Qualité premium accessible.</p>
          <div className="services-grid">
            {SERVICES.map((s, i) => (
              <div key={i} className="service-card">
                <div className="sc-top">
                  <span className="sc-name">{s.label}</span>
                  {s.badge && <span className="sc-badge">{s.badge}</span>}
                </div>
                <div className="sc-prix">{s.prix.toLocaleString()} <span>CFA</span></div>
                <button className="sc-btn" onClick={goTicket}>Commander →</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Paiement */}
      <section className="payment-section">
        <div className="section-inner">
          <div className="section-label">✦ Modes de paiement</div>
          <h2>Payez comme vous voulez</h2>
          <div className="payment-methods">
            {[
              { icon: '🌊', name: 'Wave', desc: 'Instantané' },
              { icon: '🟠', name: 'Orange Money', desc: 'Sécurisé' },
              { icon: '🔴', name: 'Free Money', desc: 'Rapide' },
              { icon: '💵', name: 'Sur place', desc: 'À l\'arrivée' },
            ].map(m => (
              <div key={m.name} className="pm-card">
                <div className="pm-icon">{m.icon}</div>
                <div className="pm-name">{m.name}</div>
                <div className="pm-desc">{m.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Avis */}
      <section id="avis" className="avis-section">
        <div className="section-inner">
          <div className="section-label">✦ Témoignages</div>
          <h2>Ce que disent nos clients</h2>
          <div className="avis-grid">
            {AVIS.map((a, i) => (
              <div key={i} className="avis-card">
                <div className="avis-stars">★ ★ ★ ★ ★</div>
                <p className="avis-texte">"{a.texte}"</p>
                <div className="avis-author">
                  <div className="avis-avatar">{a.initiales}</div>
                  <div>
                    <div className="avis-nom">{a.nom}</div>
                    <div className="avis-service">{a.service}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="cta-section">
        <div className="cta-inner">
          <h2>Prêt pour votre prochaine coupe ?</h2>
          <p>Réservez votre ticket maintenant et arrivez au bon moment.</p>
          <button className="btn-gold-lg" onClick={goTicket}>Prendre mon ticket maintenant ✦</button>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="home-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="footer-logo">TASLIMA</div>
            <p>L'art de la coiffure masculine depuis 2016. Excellence et élégance pour l'homme moderne de Dakar.</p>
          </div>
          <div className="footer-col">
            <h4>Services</h4>
            <a href="#services">Coupes & Tarifs</a>
            <a href="#file">File d'attente live</a>
            <span className="footer-link" onClick={goTicket} style={{ cursor: 'pointer' }}>Réserver un ticket</span>
          </div>
          <div className="footer-col">
            <h4>Contact</h4>
            <a href="tel:+221770000000">+221 77 000 00 00</a>
            <a href="mailto:bonjour@taslima.sn">bonjour@taslima.sn</a>
            <span>Rue 10, Medina — Dakar</span>
          </div>
          <div className="footer-col">
            <h4>Horaires</h4>
            <span>Lun — Ven : 08h — 20h</span>
            <span>Samedi : 08h — 22h</span>
            <span style={{ color: '#FF6B6B' }}>Dimanche : Fermé</span>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2025 Taslima Coiffure. Tous droits réservés.</span>
          <span className="footer-made">✦ Made with pride in Dakar</span>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
