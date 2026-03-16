import { useState, useEffect, useCallback } from 'react';
import { rejoindreFile, ecouterAppels, connectSocket } from '../services/socket';
import { queueAPI } from '../services/api';

export const useQueue = () => {
  const [file, setFile] = useState([]);
  const [stats, setStats] = useState({ enAttente: 0, enCours: 0, terminesAujourdhui: 0, caJourCFA: 0 });
  const [dernierAppel, setDernierAppel] = useState(null);
  const [connecte, setConnecte] = useState(false);

  const mettreAJourFile = useCallback((data) => {
    if (data.file) setFile(data.file);
    if (data.stats) setStats(prev => ({ ...prev, ...data.stats }));
  }, []);

  useEffect(() => {
    // Charger stats initiales
    queueAPI.stats()
      .then(res => setStats(res.data.stats))
      .catch(console.error);

    // Connexion WebSocket
    const socket = connectSocket();
    setConnecte(socket.connected);
    socket.on('connect', () => setConnecte(true));
    socket.on('disconnect', () => setConnecte(false));

    // Rejoindre la file
    const unsubFile = rejoindreFile(mettreAJourFile);

    // Écouter les appels
    const unsubAppels = ecouterAppels((data) => {
      setDernierAppel(data);
      // Auto-effacer après 8s
      setTimeout(() => setDernierAppel(null), 8000);
    });

    return () => {
      unsubFile();
      unsubAppels();
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [mettreAJourFile]);

  const tempsAttenteEstime = (position) => {
    if (!position || position <= 0) return 'Bientôt votre tour';
    return '~' + ((position - 1) * 20) + ' min';
  };

  return { file, stats, dernierAppel, connecte, tempsAttenteEstime };
};
