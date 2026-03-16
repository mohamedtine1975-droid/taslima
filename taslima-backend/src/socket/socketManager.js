const { Server } = require('socket.io');

let io = null;

// ─── Initialiser Socket.IO ───────────────────────────────
const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    // Reconnexion automatique
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // ─── Événements de connexion ──────────────────────────
  io.on('connection', (socket) => {
    console.log(`📡 Client connecté: ${socket.id}`);

    // Client rejoint la salle de la file d'attente
    socket.on('rejoindre:file', async () => {
      socket.join('file_attente');
      console.log(`Client ${socket.id} rejoint la file`);

      // Envoyer immédiatement l'état actuel de la file
      try {
        const Ticket = require('../models/Ticket');
        const file = await Ticket.find({ statut: { $in: ['en_attente', 'en_cours'] } })
          .sort({ createdAt: 1 })
          .select('numero nomClient service statut position prixCFA createdAt dureeEstimeeMin');

        socket.emit('file:etat_initial', {
          file,
          total: file.length,
          enAttente: file.filter(t => t.statut === 'en_attente').length,
          enCours: file.filter(t => t.statut === 'en_cours').length,
          timestamp: new Date()
        });
      } catch (err) {
        console.error('Erreur envoi état initial:', err);
      }
    });

    // Client suit son ticket spécifique
    socket.on('suivre:ticket', (numero) => {
      socket.join(`ticket_${numero}`);
      console.log(`Client ${socket.id} suit le ticket ${numero}`);
    });

    // Admin/coiffeur rejoint le panel de gestion
    socket.on('rejoindre:admin', (token) => {
      // En prod: vérifier le JWT ici
      socket.join('admin_panel');
      console.log(`Admin ${socket.id} connecté au panel`);
    });

    // Déconnexion
    socket.on('disconnect', (reason) => {
      console.log(`❌ Client déconnecté: ${socket.id} — Raison: ${reason}`);
    });
  });

  console.log('📡 Socket.IO initialisé');
  return io;
};

// ─── Récupérer l'instance IO ─────────────────────────────
const getIO = () => {
  if (!io) {
    console.warn('⚠️  Socket.IO non initialisé');
    return null;
  }
  return io;
};

// ─── Émettre vers un ticket spécifique ──────────────────
const notifierTicket = (numero, event, data) => {
  if (io) {
    io.to(`ticket_${numero}`).emit(event, data);
  }
};

// ─── Émettre à tous les admins ───────────────────────────
const notifierAdmins = (event, data) => {
  if (io) {
    io.to('admin_panel').emit(event, data);
  }
};

module.exports = { initSocket, getIO, notifierTicket, notifierAdmins };
