const express = require('express');
const { body, validationResult } = require('express-validator');
const Ticket = require('../models/Ticket');
const { proteger, autoriser } = require('../middleware/auth');
const { getIO } = require('../socket/socketManager');

const router = express.Router();

// ─── Helper validation ───────────────────────────────────
const valider = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }
  return null;
};

// ─── Émettre la mise à jour de la file à tous les clients ─
const emettreMAJFile = async () => {
  try {
    const file = await Ticket.find({ statut: { $in: ['en_attente', 'en_cours'] } })
      .sort({ createdAt: 1 })
      .select('numero nomClient service statut position prixCFA createdAt dureeEstimeeMin');

    const io = getIO();
    if (io) {
      io.emit('file:mise_a_jour', {
        file,
        total: file.length,
        enAttente: file.filter(t => t.statut === 'en_attente').length,
        enCours: file.filter(t => t.statut === 'en_cours').length,
        timestamp: new Date()
      });
    }
  } catch (err) {
    console.error('Erreur émission WebSocket:', err);
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/tickets — Créer un ticket (public ou connecté)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.post('/', [
  body('nomClient').trim().notEmpty().withMessage('Le nom est obligatoire'),
  body('telephoneClient').trim().notEmpty().withMessage('Le téléphone est obligatoire'),
  body('service').notEmpty().withMessage('Le service est obligatoire')
    .isIn(Object.keys(Ticket.schema.path('service').enumValues
      ? Ticket.schema.path('service').options.enum
      : ['coupe_simple','degrade_americain','coupe_barbe','rasage_traditionnel',
         'twists_dreadlocks','soin_cuir_chevelu','coupe_enfant','forfait_vip']))
    .withMessage('Service invalide')
], async (req, res) => {
  try {
    const erreur = valider(req, res);
    if (erreur) return;

    const { nomClient, telephoneClient, service, creneau } = req.body;

    // Calculer la position dans la file
    const nbEnAttente = await Ticket.countDocuments({ statut: 'en_attente' });

    // Créer le ticket
    const ticket = await Ticket.create({
      nomClient,
      telephoneClient,
      service,
      creneau: creneau || 'matin',
      prixCFA: Ticket.PRIX[service],
      dureeEstimeeMin: Ticket.DUREE[service],
      position: nbEnAttente + 1,
      // Lier au compte si connecté (optionnel via header Authorization)
      client: req.user ? req.user._id : null
    });

    // Émettre la mise à jour en temps réel
    await emettreMAJFile();

    // Émettre un événement spécifique pour ce ticket
    const io = getIO();
    if (io) {
      io.emit('ticket:nouveau', {
        numero: ticket.numero,
        nomClient: ticket.nomClient,
        service: Ticket.LABELS[service],
        position: ticket.position,
        tempsAttenteEstime: (nbEnAttente) * 20 // ~20 min par client
      });
    }

    res.status(201).json({
      success: true,
      message: `Ticket ${ticket.numero} créé avec succès !`,
      ticket: {
        id: ticket._id,
        numero: ticket.numero,
        nomClient: ticket.nomClient,
        service: Ticket.LABELS[service],
        prixCFA: ticket.prixCFA,
        position: ticket.position,
        statut: ticket.statut,
        tempsAttenteEstime: `~${nbEnAttente * 20} min`,
        createdAt: ticket.createdAt
      }
    });

  } catch (error) {
    console.error('Erreur création ticket:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la création du ticket.' });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/tickets/file — File d'attente en cours (public)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.get('/file', async (req, res) => {
  try {
    const file = await Ticket.find({ statut: { $in: ['en_attente', 'en_cours'] } })
      .sort({ createdAt: 1 })
      .select('numero nomClient service statut position prixCFA createdAt dureeEstimeeMin');

    const tempsAttenteTotal = file
      .filter(t => t.statut === 'en_attente')
      .reduce((acc, t) => acc + t.dureeEstimeeMin, 0);

    res.json({
      success: true,
      file,
      stats: {
        total: file.length,
        enAttente: file.filter(t => t.statut === 'en_attente').length,
        enCours: file.filter(t => t.statut === 'en_cours').length,
        tempsAttenteEstime: `~${tempsAttenteTotal} min`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/tickets/suivi/:numero — Suivre son ticket
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.get('/suivi/:numero', async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ numero: req.params.numero.toUpperCase() });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket introuvable.' });
    }

    // Calculer combien de personnes sont avant ce ticket
    let avantMoi = 0;
    if (ticket.statut === 'en_attente') {
      avantMoi = await Ticket.countDocuments({
        statut: 'en_attente',
        createdAt: { $lt: ticket.createdAt }
      });
    }

    res.json({
      success: true,
      ticket: {
        numero: ticket.numero,
        nomClient: ticket.nomClient,
        service: Ticket.LABELS[ticket.service],
        prixCFA: ticket.prixCFA,
        statut: ticket.statut,
        position: ticket.position,
        avantMoi,
        tempsAttenteEstime: avantMoi > 0 ? `~${avantMoi * 20} min` : 'C\'est bientôt votre tour !',
        createdAt: ticket.createdAt,
        heureAppel: ticket.heureAppel,
        heureFin: ticket.heureFin
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PUT /api/tickets/:id/statut — Changer statut (admin/coiffeur)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.put('/:id/statut', proteger, autoriser('admin', 'coiffeur'), async (req, res) => {
  try {
    const { statut } = req.body;
    const statutsValides = ['en_attente', 'en_cours', 'termine', 'annule', 'absent'];

    if (!statutsValides.includes(statut)) {
      return res.status(400).json({ success: false, message: 'Statut invalide.' });
    }

    const updates = { statut };
    if (statut === 'en_cours') updates.heureDebut = new Date();
    if (statut === 'en_cours' && !updates.heureAppel) updates.heureAppel = new Date();
    if (statut === 'termine') updates.heureFin = new Date();

    const ticket = await Ticket.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket introuvable.' });
    }

    // Réémettre la file mise à jour
    await emettreMAJFile();

    // Notifier spécifiquement le client sur son ticket
    const io = getIO();
    if (io) {
      io.emit(`ticket:${ticket.numero}:statut`, {
        numero: ticket.numero,
        statut: ticket.statut,
        message: statut === 'en_cours'
          ? `C'est votre tour ! Ticket ${ticket.numero}`
          : statut === 'termine'
          ? `Merci ${ticket.nomClient} ! À bientôt chez Taslima.`
          : `Ticket ${ticket.numero} — statut: ${statut}`
      });
    }

    res.json({ success: true, message: 'Statut mis à jour.', ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/tickets/mes-tickets — Tickets du client connecté
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.get('/mes-tickets', proteger, async (req, res) => {
  try {
    const tickets = await Ticket.find({ client: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/tickets — Tous les tickets (admin)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.get('/', proteger, autoriser('admin'), async (req, res) => {
  try {
    const { statut, date } = req.query;
    const filtre = {};
    if (statut) filtre.statut = statut;
    if (date) {
      const debut = new Date(date);
      const fin = new Date(date);
      fin.setDate(fin.getDate() + 1);
      filtre.createdAt = { $gte: debut, $lt: fin };
    }

    const tickets = await Ticket.find(filtre)
      .sort({ createdAt: -1 })
      .populate('client', 'nom telephone')
      .limit(100);

    res.json({ success: true, total: tickets.length, tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

module.exports = router;
