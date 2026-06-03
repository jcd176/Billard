import React, { useState, useEffect } from 'react';
import { ref, onValue, remove, push, update } from 'firebase/database';
import { database } from '../services/firebase';

export default function GamePage({ roomId, onLeave }) {
  const [players, setPlayers] = useState([]);
  const [logs, setLogs] = useState([]); // Nouvel état pour l'historique
  const [newPlayerName, setNewPlayerName] = useState('');
  const [winner, setWinner] = useState('');
  const [loser, setLoser] = useState('');

  useEffect(() => {
    // Écoute des joueurs
    const playersRef = ref(database, `rooms/${roomId}/players`);
    const playersUnsub = onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, p]) => ({ id, ...p })) : [];
      setPlayers(list.sort((a, b) => (b.wins || 0) - (a.wins || 0)));
    });

    // Écoute de l'historique (les 10 derniers)
    const logsRef = ref(database, `rooms/${roomId}/logs`);
    const logsUnsub = onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, log]) => ({ id, ...log })) : [];
      setLogs(list.reverse().slice(0, 10)); // Affiche les 10 plus récents
    });

    return () => { playersUnsub(); logsUnsub(); };
  }, [roomId]);

  const addLog = (message, type) => {
    push(ref(database, `rooms/${roomId}/logs`), { message, type, timestamp: Date.now() });
  };

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    push(ref(database, `rooms/${roomId}/players`), { name: newPlayerName, wins: 0, losses: 0 });
    addLog(`${newPlayerName} a rejoint la salle`, 'add');
    setNewPlayerName('');
  };

  const declareMatch = () => {
    if (!winner || !loser || winner === loser) return;
    const wPlayer = players.find(p => p.id === winner);
    const lPlayer = players.find(p => p.id === loser);

    update(ref(database, `rooms/${roomId}/players/${winner}`), { wins: (wPlayer.wins || 0) + 1 });
    update(ref(database, `rooms/${roomId}/players/${loser}`), { losses: (lPlayer.losses || 0) + 1 });
    
    addLog(`${wPlayer.name} a gagné contre ${lPlayer.name}`, 'match');
    setWinner(''); setLoser('');
  };

  const removePlayer = (playerId, playerName) => {
    if (prompt("Saisissez le mot de passe") === 'root') {
      remove(ref(database, `rooms/${roomId}/players/${playerId}`));
      addLog(`${playerName} a été supprimé`, 'remove');
    }
  };

  return (
    <div className="card">
      {/* ... (Votre code précédent pour les selects reste identique) ... */}

      <h3>Historique :</h3>
      <div style={{ background: '#111', padding: '10px', borderRadius: '5px', fontSize: '14px' }}>
        {logs.map((log) => (
          <div key={log.id} style={{ 
            color: log.type === 'add' ? '#FFD700' : (log.type === 'remove' ? '#DA70D6' : '#FF4500'),
            marginBottom: '5px' 
          }}>
            {log.message}
          </div>
        ))}
      </div>
    </div>
  );
}
