import React, { useState, useEffect } from 'react';
import { ref, onValue, remove, push, update, set } from 'firebase/database';
import { database } from '../services/firebase';

export default function GamePage({ roomId, onLeave }) {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState({});
  const [logs, setLogs] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [winner, setWinner] = useState('');
  const [loser, setLoser] = useState('');

  useEffect(() => {
    const playersRef = ref(database, `rooms/${roomId}/players`);
    onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, p]) => ({ id, ...p })) : [];
      setPlayers(list.sort((a, b) => (b.wins || 0) - (a.wins || 0)));
    });

    const matchesRef = ref(database, `rooms/${roomId}/matches`);
    onValue(matchesRef, (snapshot) => {
      setMatches(snapshot.val() || {});
    });

    const logsRef = ref(database, `rooms/${roomId}/logs`);
    onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, log]) => ({ id, ...log })) : [];
      setLogs(list.reverse().slice(0, 10));
    });
  }, [roomId]);

  const addLog = (message, type) => {
    push(ref(database, `rooms/${roomId}/logs`), { message, type, timestamp: Date.now() });
  };

  const declareMatch = () => {
    if (!winner || !loser || winner === loser) return;
    const wPlayer = players.find(p => p.id === winner);
    const lPlayer = players.find(p => p.id === loser);

    // Mise à jour stats globales
    update(ref(database, `rooms/${roomId}/players/${winner}`), { wins: (wPlayer.wins || 0) + 1 });
    update(ref(database, `rooms/${roomId}/players/${loser}`), { losses: (lPlayer.losses || 0) + 1 });

    // Gestion suivi rencontres (clé unique basée sur les noms triés)
    const matchKey = [wPlayer.name, lPlayer.name].sort().join('_vs_');
    const existing = matches[matchKey] || { winsW: 0, winsL: 0 };
    
    update(ref(database, `rooms/${roomId}/matches/${matchKey}`), {
      p1: wPlayer.name,
      p2: lPlayer.name,
      winsW: existing.winsW + 1
    });

    addLog(`MATCH:${wPlayer.name}|${lPlayer.name}`, 'match');
    setWinner(''); setLoser('');
  };

  // ... Fonctions resetLogs, resetCounters, adjustScore, removePlayer identiques ...
  const resetLogs = () => { if (prompt("Mot de passe ?") === 'root') set(ref(database, `rooms/${roomId}/logs`), null); };
  const resetCounters = () => { if (prompt("Mot de passe ?") === 'root') { players.forEach(p => update(ref(database, `rooms/${roomId}/players/${p.id}`), { wins: 0, losses: 0 })); set(ref(database, `rooms/${roomId}/matches`), null); } };
  const adjustScore = (player, type, field) => { const newVal = type === 'plus' ? (player[field] || 0) + 1 : Math.max(0, (player[field] || 0) - 1); update(ref(database, `rooms/${roomId}/players/${player.id}`), { [field]: newVal }); };
  const removePlayer = (playerId, playerName) => { if (prompt("Mot de passe ?") === 'root') remove(ref(database, `rooms/${roomId}/players/${playerId}`)); };

  return (
    <div className="card">
      <button onClick={onLeave} style={{marginBottom: '10px'}}>← Retour</button>
      <h2>Salle : {roomId}</h2>
      
      {/* ... Formulaire et Classement général (comme avant) ... */}
      
      <h3>Suivi des rencontres :</h3>
      <table style={{ width: '100%', color: '#fff', marginBottom: '20px' }}>
        <thead><tr><th>Rencontre</th><th>Score</th></tr></thead>
        <tbody>
          {Object.entries(matches).map(([key, m]) => (
            <tr key={key}>
              <td>{m.p1} vs {m.p2}</td>
              <td>{m.winsW} victoire(s)</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Historique :</h3>
      {/* ... Rendu des logs (comme avant) ... */}
    </div>
  );
}
