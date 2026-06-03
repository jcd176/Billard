import React, { useState, useEffect } from 'react';
import { ref, onValue, remove, push, update, set } from 'firebase/database';
import { database } from '../services/firebase';

export default function GamePage({ roomId, onLeave }) {
  const [players, setPlayers] = useState([]);
  const [matchStats, setMatchStats] = useState({});
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

    const statsRef = ref(database, `rooms/${roomId}/matchStats`);
    onValue(statsRef, (snapshot) => setMatchStats(snapshot.val() || {}));

    const logsRef = ref(database, `rooms/${roomId}/logs`);
    onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, log]) => ({ id, ...log })) : [];
      setLogs(list.reverse().slice(0, 10));
    });
  }, [roomId]);

  const declareMatch = () => {
    if (!winner || !loser || winner === loser) return;
    const w = players.find(p => p.id === winner);
    const l = players.find(p => p.id === loser);

    // 1. Mise à jour classement global
    update(ref(database, `rooms/${roomId}/players/${winner}`), { wins: (w.wins || 0) + 1 });
    update(ref(database, `rooms/${roomId}/players/${loser}`), { losses: (l.losses || 0) + 1 });

    // 2. Mise à jour suivi duo (clé unique)
    const duoKey = [winner, loser].sort().join('_');
    const currentStats = matchStats[duoKey] || { p1: w.name, p2: l.name, wins1: 0, wins2: 0 };
    
    // On incrémente selon qui est le gagnant
    const isWFirst = w.name === currentStats.p1;
    update(ref(database, `rooms/${roomId}/matchStats/${duoKey}`), {
        p1: currentStats.p1,
        p2: currentStats.p2,
        wins1: isWFirst ? currentStats.wins1 + 1 : currentStats.wins1,
        wins2: !isWFirst ? currentStats.wins2 + 1 : currentStats.wins2
    });

    push(ref(database, `rooms/${roomId}/logs`), { message: `MATCH:${w.name}|${l.name}`, type: 'match', timestamp: Date.now() });
    setWinner(''); setLoser('');
  };

  // ... (Fonctions reset, addPlayer, removePlayer identiques)
  const removePlayer = (id, name) => { if (prompt("Mot de passe ?") === 'root') remove(ref(database, `rooms/${roomId}/players/${id}`)); };

  return (
    <div className="card">
      <button onClick={onLeave}>← Retour</button>
      <h2>Salle : {roomId}</h2>
      
      {/* ... (Formulaire et Classement général) ... */}
      <div style={{ background: '#333', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
         {/* ... (Selects Vainqueur/Perdant et bouton Déclarer) ... */}
      </div>

      <h3>Classement Général</h3>
      {/* ... (Tableau classement) ... */}

      <h3>Suivi des rencontres (Duo)</h3>
      {Object.entries(matchStats).map(([key, stats]) => (
        <div key={key} style={{ background: '#222', padding: '10px', marginBottom: '10px', borderRadius: '5px' }}>
          <table style={{ width: '100%', color: '#fff' }}>
            <thead>
              <tr><th>Joueur</th><th>Victoires</th></tr>
            </thead>
            <tbody>
              <tr><td>{stats.p1}</td><td>{stats.wins1}</td></tr>
              <tr><td>{stats.p2}</td><td>{stats.wins2}</td></tr>
            </tbody>
          </table>
        </div>
      ))}

      <h3>Historique :</h3>
      {/* ... (Logs) ... */}
    </div>
  );
}
