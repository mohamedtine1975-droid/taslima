import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { ticketsAPI } from '../../services/api';
import './TicketModal.css';

const TicketModal = ({ onClose, onSuccess, services, user }) => {
  const [etape, setEtape] = useState(1); // 1: infos, 2: service, 3: confirmation
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nomClient: user?.nom || '',
    telephoneClient: user?.telephone || '',
    service: '',
    creneau: 'matin',
  });

  const changer = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const serviceChoisi = services?.find(s => s.id === form.service);

  const suivant = () => {
    if (etape === 1 && (!form.nomClient || !form.telephoneClient)) {
      toast.error('Remplissez nom et téléphone.'); return;
    }
    if (etape === 2 && !form.service) {
      toast.error('Choisissez un service.'); return;
    }
    setEtape(e => e + 1);
  };

  const creerTicket = async () => {
    setLoading(true);
    try {
      const res = await ticketsAPI.creer(form);
      onSuccess(res.data.ticket);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur création ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ticket-modal">
        <button className="tm-close" onClick={onClose}>✕</button>

        {/* Progress */}
        <div className="tm-progress">
          {[1, 2, 3].map(n => (
            <div key={n} className={'tm-step ' + (etape >= n ? 'active' : '') + (etape > n ? ' done' : '')}>
              <div className="step-circle">{etape > n ? '✓' : n}</div>
              <div className="step-label">{n === 1 ? 'Identité' : n === 2 ? 'Service' : 'Confirmer'}</div>
            </div>
          ))}
        </div>

        {/* ÉTAPE 1: Identité */}
        {etape === 1 && (
          <div className="tm-body">
            <h3>Vos informations</h3>
            <div className="form-group">
              <label>Nom complet</label>
              <input name="nomClient" type="text" value={form.nomClient} onChange={changer} placeholder="Moussa Diallo" />
            </div>
            <div className="form-group">
              <label>Téléphone</label>
              <input name="telephoneClient" type="tel" value={form.telephoneClient} onChange={changer} placeholder="+221 77 000 00 00" />
            </div>
            <div className="form-group">
              <label>Créneau souhaité</label>
              <select name="creneau" value={form.creneau} onChange={changer}>
                <option value="matin">Matin (08h — 12h)</option>
                <option value="apres_midi">Après-midi (12h — 16h)</option>
                <option value="soir">Soir (16h — 20h)</option>
              </select>
            </div>
            <button className="btn-next" onClick={suivant}>Suivant →</button>
          </div>
        )}

        {/* ÉTAPE 2: Service */}
        {etape === 2 && (
          <div className="tm-body">
            <h3>Choisissez votre service</h3>
            <div className="services-list">
              {services?.map(s => (
                <label key={s.id} className={'service-option ' + (form.service === s.id ? 'selected' : '')}>
                  <input type="radio" name="service" value={s.id} checked={form.service === s.id} onChange={changer} />
                  <div className="so-info">
                    <span className="so-name">{s.label}</span>
                    {s.badge && <span className="so-badge">{s.badge}</span>}
                    <span className="so-duree">⏱ {s.duree}</span>
                  </div>
                  <span className="so-prix">{s.prix.toLocaleString()} CFA</span>
                </label>
              ))}
            </div>
            <div className="tm-actions">
              <button className="btn-back" onClick={() => setEtape(1)}>← Retour</button>
              <button className="btn-next" onClick={suivant}>Suivant →</button>
            </div>
          </div>
        )}

        {/* ÉTAPE 3: Confirmation */}
        {etape === 3 && (
          <div className="tm-body">
            <h3>Confirmer votre ticket</h3>
            <div className="recap">
              <div className="recap-row"><span>Client</span><strong>{form.nomClient}</strong></div>
              <div className="recap-row"><span>Téléphone</span><strong>{form.telephoneClient}</strong></div>
              <div className="recap-row"><span>Service</span><strong>{serviceChoisi?.label}</strong></div>
              <div className="recap-row"><span>Créneau</span><strong>{{ matin: 'Matin', apres_midi: 'Après-midi', soir: 'Soir' }[form.creneau]}</strong></div>
              <div className="recap-total"><span>Total</span><strong>{serviceChoisi?.prix.toLocaleString()} CFA</strong></div>
            </div>
            <div className="tm-actions">
              <button className="btn-back" onClick={() => setEtape(2)}>← Retour</button>
              <button className="btn-confirm" onClick={creerTicket} disabled={loading}>
                {loading ? 'Création...' : '✂ Confirmer mon ticket'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketModal;
