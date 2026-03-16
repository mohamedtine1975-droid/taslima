require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/db');
const { initSocket } = require('./socket/socketManager');

const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const queueRoutes = require('./routes/queue');

const app = express();
const server = http.createServer(app);

connectDB();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/queue', queueRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Taslima Backend en ligne' });
});

app.use('*', (req, res) => res.status(404).json({ success: false, message: 'Route introuvable' }));
app.use((err, req, res, next) => res.status(500).json({ success: false, message: 'Erreur serveur' }));

initSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log('Taslima Backend demarre sur le port ' + PORT);
  console.log('WebSocket active');
});

module.exports = { app, server };
