import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const connectSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      console.log('WebSocket connecté:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket déconnecté:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('Erreur WebSocket:', err.message);
    });
  }
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Rejoindre la file d'attente publique
export const rejoindreFile = (callback) => {
  const s = connectSocket();
  s.emit('rejoindre:file');
  s.on('file:etat_initial', callback);
  s.on('file:mise_a_jour', callback);
  return () => {
    s.off('file:etat_initial', callback);
    s.off('file:mise_a_jour', callback);
  };
};

// Écouter quand un ticket est appelé
export const ecouterAppels = (callback) => {
  const s = connectSocket();
  s.on('file:appel', callback);
  return () => s.off('file:appel', callback);
};

// Suivre son propre ticket
export const suivreMonTicket = (numero, callback) => {
  const s = connectSocket();
  s.emit('suivre:ticket', numero);
  const event = 'ticket:' + numero + ':statut';
  s.on(event, callback);
  return () => s.off(event, callback);
};

// Rejoindre panel admin
export const rejoindreAdmin = (token) => {
  const s = connectSocket();
  s.emit('rejoindre:admin', token);
};

export default { connectSocket, getSocket, disconnectSocket, rejoindreFile, ecouterAppels, suivreMonTicket, rejoindreAdmin };
