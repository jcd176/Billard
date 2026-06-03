import React, { useState, useEffect } from 'react';
import { ref, onValue, remove, push, update } from 'firebase/database';
import { database } from '../services/firebase';

export default function GamePage({ roomId, onLeave }) {
  const [players, setPlayers] = useState([]);
  const [matchStats, setMatchStats] = useState({});
  const [logs, setLogs] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [winner, setWinner] = useState('');
  const [loser, setLoser] = useState('');

  // Bouton transparent forcé
  const btnStyle = { background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', fontSize: '16px' };

  useEffect(() => {
    if (!roomId) return;
    
    const playersRef = ref(database, `rooms/${roomId}/players`);
    const statsRef = ref(database, `rooms/${roomId}/matchStats`);
    const logsRef = ref(database, `rooms/${roomId}/logs`);

    const unsubP = onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, p]) => ({ id, ...p })) : [];
      setPlayers(list.sort((a, b) => (b.wins || 0) - (a.wins || 0)));
    });

    const unsubS = onValue(statsRef, (snapshot) => {
      setMatchStats(snapshot.val() || {});
    });
    
    const unsubL = onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, log]) => ({ id, ...log })) : [];
      setLogs(list.reverse().slice(0, 10));
    });

    return () => { unsubP(); unsubS(); unsubL(); };
  }, [roomId]);

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    push(ref(database, `rooms/${roomId}/players`), { name: newPlayerName, wins: 0, losses: 0 });
    setNewPlayerName('');
  };

  const declareMatch = () => {
    if (!winner || !loser || winner === loser) return;
    const w = players.find(p => p.id === winner);
    const l = players.find(p => p.id === loser);
    if (!w || !l) return;

    update(ref(database, `rooms/${roomId}/players/${winner}`), { wins: (w.wins || 0) + 1 });
    update(ref(database, `rooms/${roomId}/players/${loser}`), { losses: (l.losses || 0) + 1 });
    
    const duoKey = [winner, loser].sort().join('_');
    const current = matchStats[duoKey] || { p1: w.name, p2: l.name, wins1: 0, wins2: 0 };
    update(ref(database, `rooms/${roomId}/matchStats/${duoKey}`), {
        p1: w.id < l.id ? w.name : l.name, p2: w.id < l.id ? l.name : w.name,
        wins1: (w.id < l.id) ? (current.wins1 + 1) : current.wins1,
        wins2: (w.id > l.id) ? (current.wins2 + 1) : current.wins2
    });
    push(ref(database, `rooms/${roomId}/logs`), { message: `MATCH:${w.name}|${l.name}`, type: 'match' });
    setWinner(''); setLoser('');
  };

  const adjustScore = (p, type, field) => {
    if (!p || !p.id) return;
    update(ref(database, `rooms/${roomId}/players/${p.id}`), { [field]: type === 'plus' ? (p[field] || 0) + 1 : Math.max(0, (p[field] || 0) - 1) });
  };

  // Rendu conditionnel minimaliste pour isoler le bug
  return (
    <div className="card" style={{color: '#fff', padding: '20px'}}>
      <button onClick={onLeave} style={{marginBottom: '10px'}}>← Retour</button>
      <h2>Salle : {roomId}</h2>
      
      {/* Formulaire ajout */}
      <div style={{ marginBottom: '20px' }}>
        <input value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Nom joueur" />
        <button onClick={addPlayer}>Ajouter</button>
      </div>

      {/* Classement */}
      <h3>Classement</h3>
      <table style={{width: '100%'}}>
        <tbody>
          {players && players.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.wins} <button style={btnStyle} onClick={() => adjustScore(p, 'plus', 'wins')}>🟢</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Stats duo */}
      <h3>Rencontres</h3>
      {matchStats && Object.entries(matchStats).map(([key, s]) => (
        <div key={key}>{s?.p1} vs {s?.p2} : {s?.wins1} - {s?.wins2}</div>
      ))}
    </div>
  );
}
