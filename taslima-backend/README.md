# ✂ Taslima Coiffure — Backend API

Backend complet pour le site Taslima Coiffure.
**Stack**: Node.js + Express + MongoDB + Socket.IO (WebSocket)

---

## 🚀 Installation & Démarrage

```bash
# 1. Cloner et installer les dépendances
cd taslima-backend
npm install

# 2. Configurer les variables d'environnement
cp .env.example .env
# → Éditer .env avec ton MONGO_URI (MongoDB Atlas)

# 3. (Optionnel) Peupler la base avec des données de test
npm run seed

# 4. Démarrer en développement
npm run dev

# 5. Démarrer en production
npm start
```

---

## 📡 API Endpoints

### Authentification
| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| POST | `/api/auth/inscription` | Créer un compte | ❌ |
| POST | `/api/auth/connexion` | Se connecter | ❌ |
| GET | `/api/auth/moi` | Mon profil | ✅ |
| PUT | `/api/auth/modifier` | Modifier profil | ✅ |

### Tickets
| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| POST | `/api/tickets` | Créer un ticket | ❌ (optionnel) |
| GET | `/api/tickets/file` | File d'attente actuelle | ❌ |
| GET | `/api/tickets/suivi/:numero` | Suivre son ticket | ❌ |
| GET | `/api/tickets/mes-tickets` | Mes tickets | ✅ Client |
| GET | `/api/tickets` | Tous les tickets | ✅ Admin |
| PUT | `/api/tickets/:id/statut` | Changer statut | ✅ Admin/Coiffeur |

### File d'attente
| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| GET | `/api/queue/stats` | Stats du jour | ❌ |
| POST | `/api/queue/appeler-suivant` | Appeler le prochain | ✅ Admin/Coiffeur |

---

## 🔌 WebSocket Events (Socket.IO)

### Client → Serveur
```js
socket.emit('rejoindre:file')          // Rejoindre la salle file
socket.emit('suivre:ticket', 'T-001') // Suivre un ticket spécifique
socket.emit('rejoindre:admin', token)  // Panel admin
```

### Serveur → Client
```js
socket.on('file:etat_initial', (data) => {})  // État actuel de la file
socket.on('file:mise_a_jour', (data) => {})   // Mise à jour file
socket.on('file:appel', (data) => {})          // Appel d'un ticket
socket.on('ticket:nouveau', (data) => {})      // Nouveau ticket créé
socket.on('ticket:T-001:statut', (data) => {}) // Changement statut ticket
```

### Exemple d'utilisation côté React:
```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

// Rejoindre la file
socket.emit('rejoindre:file');

// Écouter les mises à jour
socket.on('file:mise_a_jour', ({ file, stats }) => {
  setFile(file);
  setStats(stats);
});

// Suivre son ticket après commande
socket.emit('suivre:ticket', 'T-001');
socket.on('ticket:T-001:statut', ({ statut, message }) => {
  if (statut === 'en_cours') alert('C\'est votre tour !');
});
```

---

## 💳 Exemple d'appels API (fetch)

### Inscription
```js
const res = await fetch('http://localhost:5000/api/auth/inscription', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nom: 'Moussa Diallo',
    telephone: '+221771234567',
    password: 'monmotdepasse'
  })
});
const { token, user } = await res.json();
localStorage.setItem('token', token);
```

### Créer un ticket
```js
const res = await fetch('http://localhost:5000/api/tickets', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}` // Optionnel
  },
  body: JSON.stringify({
    nomClient: 'Moussa Diallo',
    telephoneClient: '+221771234567',
    service: 'degrade_americain',
    creneau: 'matin'
  })
});
const { ticket } = await res.json();
console.log('Ton ticket:', ticket.numero); // T-001
```

---

## 🌐 Déploiement

### Backend → Render.com (gratuit)
1. Créer un compte sur render.com
2. "New Web Service" → connecter ton repo GitHub
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Ajouter les variables d'environnement depuis `.env`

### Base de données → MongoDB Atlas (gratuit)
1. Créer un compte sur mongodb.com/atlas
2. Créer un cluster gratuit (M0)
3. "Connect" → copier l'URL → coller dans `MONGO_URI`

---

## 📁 Structure du projet

```
taslima-backend/
├── src/
│   ├── index.js              # Point d'entrée principal
│   ├── config/
│   │   └── db.js             # Connexion MongoDB
│   ├── models/
│   │   ├── User.js           # Modèle utilisateur + auth
│   │   └── Ticket.js         # Modèle ticket + file
│   ├── routes/
│   │   ├── auth.js           # Routes authentification
│   │   ├── tickets.js        # Routes tickets
│   │   └── queue.js          # Routes file d'attente
│   ├── middleware/
│   │   └── auth.js           # JWT middleware
│   ├── socket/
│   │   └── socketManager.js  # WebSocket Socket.IO
│   └── seed.js               # Données de test
├── .env.example
├── package.json
└── README.md
```
