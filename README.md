# ✂ Taslima Coiffure

Projet complet: landing page + espace client + panel admin + paiement mobile.

## Structure

```
taslima-coiffure/
├── taslima-backend/    ← Node.js + Express + MongoDB + Socket.IO
└── taslima-frontend/   ← React 18 + React Router
```

## Démarrage rapide

### 1. Backend
```bash
cd taslima-backend
npm install
cp .env.example .env       # Remplir MONGO_URI avec MongoDB Atlas
npm run seed               # Données de test (optionnel)
npm run dev                # Port 5000
```

Comptes seed:
- Admin: +221770000001 / admin123
- Client: +221771234567 / client123

### 2. Frontend
```bash
cd taslima-frontend
npm install
cp .env.example .env       # Laisser tel quel pour local
npm start                  # Port 3000
```

## Pages
- `/` → Landing page publique
- `/connexion` → Inscription / Connexion
- `/dashboard` → Espace client (protégé)
- `/admin` → Panel admin (admin seulement)

## Stack
- **Backend**: Node.js, Express, MongoDB/Mongoose, Socket.IO, JWT, bcrypt
- **Frontend**: React 18, React Router 6, Axios, Socket.IO client, react-hot-toast
