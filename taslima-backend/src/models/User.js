const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom est obligatoire'],
    trim: true,
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },
  telephone: {
    type: String,
    required: [true, 'Le téléphone est obligatoire'],
    unique: true,
    trim: true,
    match: [/^(\+221|00221)?[0-9]{9}$/, 'Numéro de téléphone invalide']
  },
  email: {
    type: String,
    unique: true,
    sparse: true, // Permet null/undefined unique
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide']
  },
  password: {
    type: String,
    required: [true, 'Le mot de passe est obligatoire'],
    minlength: [6, 'Le mot de passe doit faire au moins 6 caractères'],
    select: false // Ne jamais retourner le password dans les queries
  },
  role: {
    type: String,
    enum: ['client', 'admin', 'coiffeur'],
    default: 'client'
  },
  // Fidélité
  totalCoupes: { type: Number, default: 0 },
  pointsFidelite: { type: Number, default: 0 },
  // Statut
  actif: { type: Boolean, default: true },
  dernierAcces: { type: Date, default: Date.now }
}, {
  timestamps: true // createdAt, updatedAt auto
});

// ─── Hash du mot de passe avant sauvegarde ───────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Méthode pour vérifier le mot de passe ───────────────
userSchema.methods.verifierPassword = async function (passwordEnClair) {
  return await bcrypt.compare(passwordEnClair, this.password);
};

// ─── Méthode pour retourner l'utilisateur sans infos sensibles ─
userSchema.methods.toPublic = function () {
  return {
    id: this._id,
    nom: this.nom,
    telephone: this.telephone,
    email: this.email,
    role: this.role,
    totalCoupes: this.totalCoupes,
    pointsFidelite: this.pointsFidelite,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('User', userSchema);
