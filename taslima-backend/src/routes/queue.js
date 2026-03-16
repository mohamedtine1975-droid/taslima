const express = require('express');
const Ticket = require('../models/Ticket');
const { proteger, autoriser } = require('../middleware/auth');

const router = express.Router();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/queue/stats — Statistiques du jour
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.get('/stats', async (req, res) => {
  try {
    const debutJour = new Date();
    debutJour.setHours(0, 0, 0, 0);

    const [enAttente, enCours, terminesAujourdhui, caJour] = await Promise.all([
      Ticket.countDocuments({ statut: 'en_attente' }),
      Ticket.countDocuments({ statut: 'en_cours' }),
      Ticket.countDocuments({ statut: 'termine', createdAt: { $gte: debutJour } }),
      Ticket.aggregate([
        { $match: { statut: 'termine', createdAt: { $gte: debutJour } } },
        { $group: { _id: null, total: { $sum: '$prixCFA' } } }
      ])
    ]);

    const tempsAttenteEstime = enAttente * 20; // ~20 min en moyenne

    res.json({
      success: true,
      stats: {
        enAttente,
        enCours,
        terminesAujourdhui,
        caJourCFA: caJour[0]?.total || 0,
        tempsAttenteEstime: `~${tempsAttenteEstime} min`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/queue/appeler-suivant — Appeler le prochain (admin)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.post('/appeler-suivant', proteger, autoriser('admin', 'coiffeur'), async (req, res) => {
  try {
    const { getIO } = require('../socket/socketManager');

    // Trouver le prochain ticket en attente
    const suivant = await Ticket.findOne({ statut: 'en_attente' }).sort({ createdAt: 1 });

    if (!suivant) {
      return res.json({ success: true, message: 'File d\'attente vide.', ticket: null });
    }

    // Passer en cours
    suivant.statut = 'en_cours';
    suivant.heureAppel = new Date();
    suivant.heureDebut = new Date();
    await suivant.save();

    // Émettre via WebSocket
    const io = getIO();
    if (io) {
      io.emit('file:appel', {
        numero: suivant.numero,
        nomClient: suivant.nomClient,
        service: Ticket.LABELS[suivant.service],
        message: `🔔 Ticket ${suivant.numero} — ${suivant.nomClient}, c'est votre tour !`
      });

      // Mettre à jour toute la file
      const file = await Ticket.find({ statut: { $in: ['en_attente', 'en_cours'] } })
        .sort({ createdAt: 1 });
      io.emit('file:mise_a_jour', { file, total: file.length });
    }

    res.json({
      success: true,
      message: `Ticket ${suivant.numero} appelé.`,
      ticket: suivant
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

module.exports = router;
