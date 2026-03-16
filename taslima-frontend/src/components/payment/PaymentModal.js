import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { ticketsAPI } from '../../services/api';
import './PaymentModal.css';

const METHODES = [
  { id: 'wave', label: 'Wave', color: '#1E96FF', icon: '🌊', desc: 'Paiement instantané Wave' },
  { id: 'orange_money', label: 'Orange Money', color: '#FF6C00', icon: '🟠', desc: 'Paiement Orange Money' },
  { id: 'free_money', label: 'Free Money', color: '#E30613', icon: '🔴', desc: 'Paiement Free Money' },
  { id: 'sur_place', label: 'Sur place', color: '#C9A84C', icon: '💵', desc: 'Payer à l\'arrivée' },
];

const PaymentModal = ({ service, user, onClose, onSuccess }) => {
  const [etape, setEtape] = useState('choix'); // choix | paiement | confirmation | succes
  const [methode, setMethode] = useState(null);
  const [telephone, setTelephone] = useState(user?.telephone || '');
  const [loading, setLoading] = useState(false);
  const [creneau, setCreneau] = useState('matin');

  const choisirMethode = (m) => {
    setMethode(m);
    if (m.id === 'sur_place') {
      setEtape('confirmation');
    } else {
      setEtape('paiement');
    }
  };

  const lancerPaiement = async () => {
    setLoading(true);
    try {
      // Simulation paiement mobile money (en prod: intégrer API Wave/Orange)
      await new Promise(r => setTimeout(r, 2000)); // Simule l'appel API

      if (methode.id === 'wave') {
        // En production: rediriger vers Wave Checkout
        // window.location.href = `https://pay.wave.com/m/taslima?amount=${service.prix}&currency=XOF`
        toast('Simulation Wave — En production, redirection vers Wave Pay', { icon: '🌊' });
      } else if (methode.id === 'orange_money') {
        // En production: API Orange Money
        toast('Simulation Orange Money — SMS de confirmation envoyé', { icon: '🟠' });
      }

      setEtape('confirmation');
    } catch {
      toast.error('Erreur de paiement. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const confirmerTicket = async () => {
    setLoading(true);
    try {
      const res = await ticketsAPI.creer({
        nomClient: user?.nom || 'Client',
        telephoneClient: telephone,
        service: service.id,
        creneau,
        methodePaiement: methode?.id || 'sur_place',
      });
      setEtape('succes');
      setTimeout(() => {
        onSuccess(res.data.ticket);
        onClose();
      }, 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la création du ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="payment-modal">
        <button className="modal-close-btn" onClick={onClose}>✕</button>

        {/* ÉTAPE 1: Choix du mode de paiement */}
        {etape === 'choix' && (
          <>
            <div className="pm-header">
              <div className="pm-service">{service.label}</div>
              <div className="pm-prix">{service.prix.toLocaleString()} CFA</div>
            </div>
            <h3>Comment voulez-vous payer ?</h3>
            <div className="methodes-grid">
              {METHODES.map(m => (
                <button key={m.id} className="methode-card" onClick={() => choisirMethode(m)} style={{ '--m-color': m.color }}>
                  <span className="methode-icon">{m.icon}</span>
                  <span className="methode-label">{m.label}</span>
                  <span className="methode-desc">{m.desc}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ÉTAPE 2: Saisie numéro pour mobile money */}
        {etape === 'paiement' && (
          <>
            <div className="pm-header">
              <div className="pm-service">{service.label}</div>
              <div className="pm-prix">{service.prix.toLocaleString()} CFA</div>
            </div>
            <div className="pm-methode-selected" style={{ background: methode.color + '15', borderColor: methode.color + '40' }}>
              <span>{methode.icon}</span> Paiement {methode.label}
            </div>
            <h3>Entrez votre numéro {methode.label}</h3>
            <div className="form-group">
              <label>Numéro de téléphone</label>
              <input type="tel" value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="+221 77 000 00 00" />
            </div>
            <div className="form-group">
              <label>Créneau souhaité</label>
              <select value={creneau} onChange={e => setCreneau(e.target.value)}>
                <option value="matin">Matin (08h — 12h)</option>
                <option value="apres_midi">Après-midi (12h — 16h)</option>
                <option value="soir">Soir (16h — 20h)</option>
              </select>
            </div>
            <div className="pm-summary">
              <span>Total à payer</span>
              <strong>{service.prix.toLocaleString()} CFA</strong>
            </div>
            <div className="pm-actions">
              <button className="btn-back" onClick={() => setEtape('choix')}>← Retour</button>
              <button className="btn-pay" onClick={lancerPaiement} disabled={loading || !telephone}
                style={{ background: methode.color }}>
                {loading ? 'Traitement...' : 'Payer ' + service.prix.toLocaleString() + ' CFA →'}
              </button>
            </div>
          </>
        )}

        {/* ÉTAPE 3: Confirmation finale */}
        {etape === 'confirmation' && (
          <>
            <div className="pm-header">
              <div className="pm-service">{service.label}</div>
              <div className="pm-prix">{service.prix.toLocaleString()} CFA</div>
            </div>
            <div className="pm-confirmation">
              <div className="confirm-icon">✓</div>
              <h3>{methode?.id === 'sur_place' ? 'Réservation sans pré-paiement' : 'Paiement accepté !'}</h3>
              <p>{methode?.id === 'sur_place' ? 'Vous paierez sur place à votre arrivée.' : 'Votre paiement ' + methode?.label + ' a été traité.'}</p>
            </div>
            <div className="form-group">
              <label>Créneau souhaité</label>
              <select value={creneau} onChange={e => setCreneau(e.target.value)}>
                <option value="matin">Matin (08h — 12h)</option>
                <option value="apres_midi">Après-midi (12h — 16h)</option>
                <option value="soir">Soir (16h — 20h)</option>
              </select>
            </div>
            <button className="btn-gold-full" onClick={confirmerTicket} disabled={loading}>
              {loading ? 'Création...' : 'Confirmer et obtenir mon ticket →'}
            </button>
          </>
        )}

        {/* ÉTAPE 4: Succès */}
        {etape === 'succes' && (
          <div className="pm-succes">
            <div className="succes-scissors">✂</div>
            <h2>Ticket créé !</h2>
            <p>Votre ticket a été enregistré. Vous recevrez une notification quand c'est votre tour.</p>
            <div className="succes-loader"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
