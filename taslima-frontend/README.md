# ✂ Taslima Coiffure — Projet Complet

Application web complète pour un salon de coiffure homme à Dakar.

## 🏗 Architecture du projet

```
taslima/
├── taslima-backend/          ← API Node.js + MongoDB + Socket.IO
│   ├── src/
│   │   ├── index.js          ← Point d'entrée + WebSocket
│   │   ├── config/db.js      ← Connexion MongoDB
│   │   ├── models/
│   │   │   ├── User.js       ← Utilisateurs (bcrypt + JWT)
│   │   │   └── Ticket.js     ← Tickets (numéro auto, file)
│   │   ├── routes/
│   │   │   ├── auth.js       ← Inscription, connexion, profil
│   │   │   ├── tickets.js    ← CRUD tickets + statuts
│   │   │   └── queue.js      ← Stats + appeler suivant
│   │   ├── middleware/auth.js ← JWT protect + authorize
│   │   └── socket/
│   │       └── socketManager.js ← Rooms WebSocket temps réel
│   └── package.json
│
└── taslima-frontend/         ← React 18 + React Router
    ├── src/
    │   ├── App.js            ← Routing (public, protégé, admin)
    │   ├── context/
    │   │   └── AuthContext.js ← État global auth
    │   ├── services/
    │   │   ├── api.js         ← Axios + intercepteurs JWT
    │   │   └── socket.js      ← Socket.IO client + helpers
    │   ├── hooks/
    │   │   └── useQueue.js    ← File d'attente temps réel
    │   ├── pages/
    │   │   ├── HomePage.js    ← Landing page publique
    │   │   ├── AuthPage.js    ← Inscription / Connexion
    │   │   ├── Dashboard.js   ← Espace client connecté
    │   │   └── AdminPanel.js  ← Panel admin / coiffeur
    │   └── components/
    │       ├── tickets/TicketModal.js   ← Commande en 3 étapes
    │       ├── payment/PaymentModal.js  ← Wave, Orange Money, etc.
    │       └── layout/ProtectedRoute.js ← Guards de route
    └── package.json
```

---

## 🚀 Lancement rapide

### 1. Backend

```bash
cd taslima-backend
npm install
cp .env.example .env        # → Remplir MONGO_URI (MongoDB Atlas)
npm run seed                 # Données de test (optionnel)
npm run dev                  # Démarre sur :5000
```

Comptes créés par le seed :
- **Admin** : `+221770000001` / `admin123`
- **Coiffeur** : `+221770000002` / `coiff123`
- **Client** : `+221771234567` / `client123`

### 2. Frontend

```bash
cd taslima-frontend
npm install
cp .env.example .env        # → Laisser tel quel pour local
npm start                    # Démarre sur :3000
```

---

## 🔌 Fonctionnalités implémentées

### ✅ Backend (Node.js + Express + MongoDB)
- Auth JWT complète (inscription, connexion, refresh, profil)
- Modèle User avec bcrypt hash automatique, rôles (client/coiffeur/admin)
- Modèle Ticket avec numérotation auto (T-001, T-002...), 8 services en CFA
- File d'attente : création, suivi, changement de statut
- Stats du jour (CA, clients, terminés)
- WebSocket Socket.IO avec salles (file_attente, ticket_XXX, admin_panel)
- Broadcast automatique sur tout changement de la file

### ✅ Frontend (React 18)
- Landing page publique avec stats live
- Auth (inscription/connexion) avec validation
- Dashboard client : stats, file live, mes tickets, menu
- TicketModal en 3 étapes (identité → service → confirmation)
- PaymentModal : Wave, Orange Money, Free Money, Sur place
- Panel admin : file en direct, contrôles (appeler/terminer/absent), stats du jour, tous les tickets avec filtres
- Temps réel via WebSocket (mises à jour file, notifications d'appel)
- Lazy loading des pages, toasts styled

---

## 🌐 Déploiement en production

### Backend → Render.com
1. Créer un "Web Service" sur render.com
2. Build : `npm install` | Start : `npm start`
3. Variables d'env : `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`

### Frontend → Vercel
1. `npm run build`
2. Déployer le dossier `build/` sur Vercel
3. Variables d'env : `REACT_APP_API_URL`, `REACT_APP_SOCKET_URL`

### Base de données → MongoDB Atlas
1. Cluster gratuit M0 sur mongodb.com/atlas
2. Network Access : `0.0.0.0/0` pour autoriser Render
3. Copier l'URL dans `MONGO_URI`

---

## 💳 Intégration paiement en production

### Wave (Sénégal)
```js
// Rediriger vers Wave Checkout
window.location.href = `https://pay.wave.com/m/VOTRE_ID_MERCHANT?amount=${prix}&currency=XOF&reference=${ticketNumero}`;
// Webhook de confirmation → POST /api/webhooks/wave
```

### Orange Money
```js
// API Orange Money Sénégal
const res = await fetch('https://api.orange.com/orange-money-webpay/dev/v1/webpayment', {
  method: 'POST',
  headers: { Authorization: 'Bearer ' + OM_TOKEN },
  body: JSON.stringify({ amount: prix, currency: 'XOF', return_url: '...', notif_url: '...' })
});
```

---

## 📡 Événements WebSocket

| Événement | Direction | Description |
|-----------|-----------|-------------|
| `rejoindre:file` | Client→Serveur | Rejoindre la file |
| `suivre:ticket` | Client→Serveur | Suivre un ticket précis |
| `rejoindre:admin` | Client→Serveur | Panel admin |
| `file:etat_initial` | Serveur→Client | État actuel au connexion |
| `file:mise_a_jour` | Serveur→Client | Après chaque changement |
| `file:appel` | Serveur→Client | Quand un ticket est appelé |
| `ticket:T-001:statut` | Serveur→Client | Notification personnelle |
| `ticket:nouveau` | Serveur→Client | Nouveau ticket créé |
