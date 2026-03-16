/**
 * SEED — Peupler la base de données avec des données de test
 * Usage: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Ticket = require('./models/Ticket');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connecté à MongoDB');

  // Nettoyer
  await User.deleteMany({});
  await Ticket.deleteMany({});
  await mongoose.connection.collection('compteurs').deleteMany({});
  console.log('🗑️  Base nettoyée');

  // Créer admin
  const admin = await User.create({
    nom: 'Taslima Admin',
    telephone: '+221770000001',
    email: 'admin@taslima.sn',
    password: 'admin123',
    role: 'admin'
  });

  // Créer coiffeurs
  const coiffeurs = await User.insertMany([
    { nom: 'Moussa Coiffeur', telephone: '+221770000002', password: 'coiff123', role: 'coiffeur' },
    { nom: 'Ibrahima Style', telephone: '+221770000003', password: 'coiff123', role: 'coiffeur' }
  ]);

  // Créer clients
  const clients = await User.insertMany([
    { nom: 'Abdou Diallo', telephone: '+221771234567', password: 'client123', role: 'client' },
    { nom: 'Cheikh Ndiaye', telephone: '+221772345678', password: 'client123', role: 'client' },
    { nom: 'Serigne Fall', telephone: '+221773456789', password: 'client123', role: 'client' }
  ]);

  // Créer tickets de test
  await Ticket.create({
    nomClient: clients[0].nom, telephoneClient: clients[0].telephone,
    service: 'degrade_americain', prixCFA: 2500, dureeEstimeeMin: 25,
    position: 1, statut: 'en_cours', client: clients[0]._id,
    heureAppel: new Date(), heureDebut: new Date()
  });

  await Ticket.create({
    nomClient: clients[1].nom, telephoneClient: clients[1].telephone,
    service: 'coupe_barbe', prixCFA: 3500, dureeEstimeeMin: 30,
    position: 2, statut: 'en_attente', client: clients[1]._id
  });

  await Ticket.create({
    nomClient: 'Visiteur Anonyme', telephoneClient: '+221779999999',
    service: 'coupe_simple', prixCFA: 1500, dureeEstimeeMin: 15,
    position: 3, statut: 'en_attente'
  });

  console.log('\n✅ Seed terminé !');
  console.log('👤 Admin: +221770000001 / admin123');
  console.log('✂️  Coiffeur: +221770000002 / coiff123');
  console.log('👥 Client: +221771234567 / client123\n');

  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
