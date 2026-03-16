const mongoose = require('mongoose');

// Compteur auto-incrémenté pour le numéro de ticket
const compteurSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  valeur: { type: Number, default: 0 }
});
const Compteur = mongoose.model('Compteur', compteurSchema);

const ticketSchema = new mongoose.Schema({
  numero: {
    type: String,
    unique: true
    // Ex: T-001, T-002... généré automatiquement
  },
  // Peut être client inscrit OU anonyme
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Infos pour les clients non-inscrits
  nomClient: {
    type: String,
    required: [true, 'Le nom du client est obligatoire'],
    trim: true
  },
  telephoneClient: {
    type: String,
    required: [true, 'Le téléphone est obligatoire'],
    trim: true
  },
  // Prestation
  service: {
    type: String,
    required: [true, 'Le service est obligatoire'],
    enum: [
      'coupe_simple',
      'degrade_americain',
      'coupe_barbe',
      'rasage_traditionnel',
      'twists_dreadlocks',
      'soin_cuir_chevelu',
      'coupe_enfant',
      'forfait_vip'
    ]
  },
  prixCFA: {
    type: Number,
    required: true
  },
  // Créneau souhaité
  creneau: {
    type: String,
    enum: ['matin', 'apres_midi', 'soir'],
    default: 'matin'
  },
  // File d'attente
  position: {
    type: Number,
    default: null // Position dans la file
  },
  statut: {
    type: String,
    enum: ['en_attente', 'en_cours', 'termine', 'annule', 'absent'],
    default: 'en_attente'
  },
  // Coiffeur assigné
  coiffeurAssigne: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Timestamps métier
  heureAppel: { type: Date, default: null },     // Quand appelé en salle
  heureDebut: { type: Date, default: null },      // Début de la coupe
  heureFin: { type: Date, default: null },        // Fin de la coupe
  // Durée estimée en minutes selon le service
  dureeEstimeeMin: { type: Number, default: 20 },
  // Notes
  notes: { type: String, default: '' }
}, {
  timestamps: true
});

// ─── Index pour les requêtes fréquentes ─────────────────
ticketSchema.index({ statut: 1, createdAt: 1 });
ticketSchema.index({ numero: 1 });

// ─── Génération automatique du numéro de ticket ─────────
ticketSchema.pre('save', async function (next) {
  if (this.isNew) {
    const compteur = await Compteur.findOneAndUpdate(
      { nom: 'ticket' },
      { $inc: { valeur: 1 } },
      { new: true, upsert: true }
    );
    const num = String(compteur.valeur).padStart(3, '0');
    this.numero = `T-${num}`;
  }
  next();
});

// ─── Prix par service ────────────────────────────────────
ticketSchema.statics.PRIX = {
  coupe_simple: 1500,
  degrade_americain: 2500,
  coupe_barbe: 3500,
  rasage_traditionnel: 1800,
  twists_dreadlocks: 5000,
  soin_cuir_chevelu: 2000,
  coupe_enfant: 1000,
  forfait_vip: 7500
};

ticketSchema.statics.DUREE = {
  coupe_simple: 15,
  degrade_americain: 25,
  coupe_barbe: 30,
  rasage_traditionnel: 20,
  twists_dreadlocks: 60,
  soin_cuir_chevelu: 25,
  coupe_enfant: 10,
  forfait_vip: 50
};

ticketSchema.statics.LABELS = {
  coupe_simple: 'Coupe Simple',
  degrade_americain: 'Dégradé Américain',
  coupe_barbe: 'Coupe + Barbe',
  rasage_traditionnel: 'Rasage Traditionnel',
  twists_dreadlocks: 'Twists / Dreadlocks',
  soin_cuir_chevelu: 'Soin Cuir Chevelu',
  coupe_enfant: 'Coupe Enfant',
  forfait_vip: 'Forfait VIP'
};

module.exports = mongoose.model('Ticket', ticketSchema);
