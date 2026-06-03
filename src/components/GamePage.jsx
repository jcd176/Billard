import React, { useState, useEffect } from 'react';
import { ref, onValue, update, push, remove, set } from 'firebase/database';
import { database } from '../services/firebase';

export default function GamePage({ roomId, onLeave }) {
  const [players, setPlayers] = useState([]);
  const [matchStats, setMatchStats] = useState({});
  const [logs, setLogs] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [winner, setWinner] = useState('');
  const [loser, setLoser] = useState('');

  // Styles pour forcer les couleurs des boutons
  const btnStyle = { background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', fontSize: '16px' };

  useEffect(() => {
    if (!roomId) return;
    const dbRef = ref(database, `rooms/${roomId}`);
    
    onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      
      const pList = data.players ? Object.entries(data.players).map(([id, p]) => ({ id, ...p })) : [];
      setPlayers(pList.sort((a, b) => (b.wins || 0) - (a.wins || 0)));
      setMatchStats(data.matchStats || {});
      const lList = data.logs ? Object.entries(data.logs).map(([id, l]) => ({ id, ...l })) : [];
      setLogs(lList.reverse().slice(0, 15));
    });
  }, [roomId]);

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    push(ref(database, `rooms/${roomId}/players`), { name: newPlayerName, wins: 0, losses: 0 });
    setNewPlayerName('');
  };

  const updateScore = (p, field, delta) => {
    const newVal = Math.max(0, (p[field] || 0) + delta);
    update(ref(database, `rooms/${roomId}/players/${p.id}`), { [field]: newVal });
    push(ref(database, `rooms/${roomId}/logs`), { 
      message: `${p.name} : ${delta > 0 ? '+' : ''}${delta} ${field === 'wins' ? 'Victoire' : 'Défaite'}`, 
      type: 'mod' 
    });
  };

  const declareMatch = () => {
    if (!winner || !loser || winner === loser) return;
    const w = players.find(p => p.id === winner);
    const l = players.find(p => p.id === loser);
    
    update(ref(database, `rooms/${roomId}/players/${winner}`), { wins: (w.wins || 0) + 1 });
    update(ref(database, `rooms/${roomId}/players/${loser}`), { losses: (l.losses || 0) + 1 });
    
    const duoKey = [winner, loser].sort().join('_');
    const cur = matchStats[duoKey] || { p1: w.name, p2: l.name, w1: 0, w2: 0 };
    update(ref(database, `rooms/${roomId}/matchStats/${duoKey}`), {
        p1: w.id < l.id ? w.name : l.name, p2: w.id < l.id ? l.name : w.name,
        w1: (w.id < l.id) ? cur.w1 + 1 : cur.w1,
        w2: (w.id > l.id) ? cur.w2 + 1 : cur.w2
    });
    push(ref(database, `rooms/${roomId}/logs`), { message: `MATCH:${w.name}|${l.name}`, type: 'match' });
    setWinner(''); setLoser('');
  };

  return (
    <div style={{ color: '#fff', padding: '20px' }}>
      <button onClick={onLeave}>← Retour</button>
      <h2>Salle : {roomId}</h2>
      
      <input value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Nom joueur" />
      <button onClick={addPlayer}>Ajouter</button>

      <div style={{ background: '#333', padding: '10px', marginTop: '10px' }}>
        <select onChange={(e) => setWinner(e.target.value)} value={winner}><option value="">👑 Vainqueur</option>{players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <select onChange={(e) => setLoser(e.target.value)} value={loser}><option value="">🎱 Perdant</option>{players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <button onClick={declareMatch}>Déclarer Match</button>
      </div>

      <h3>Classement Général <button style={btnStyle} onClick={() => set(ref(database, `rooms/${roomId}/players`), null)}>🔄</button></h3>
      <table>
        <thead><tr><th>Joueur</th><th>V</th><th>D</th><th>%</th></tr></thead>
        <tbody>
          {players.map(p => {
            const tot = (p.wins || 0) + (p.losses || 0);
            return (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.wins} <button style={btnStyle} onClick={() => updateScore(p, 'wins', 1)}>🟢</button><button style={btnStyle} onClick={() => updateScore(p, 'wins', -1)}>🔴</button></td>
                <td>{p.losses} <button style={btnStyle} onClick={() => updateScore(p, 'losses', 1)}>🟢</button><button style={btnStyle} onClick={() => updateScore(p, 'losses', -1)}>🔴</button></td>
                <td>{tot > 0 ? Math.round(((p.wins || 0) / tot) * 100) : 0}%</td>
                <td><button style={btnStyle} onClick={() => remove(ref(database, `rooms/${roomId}/players/${p.id}`))}>🎱</button></td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <h3>Suivi des rencontres</h3>
      {Object.entries(matchStats).map(([k, s]) => <div key={k}>{s.p1} {s.w1} - {s.w2} {s.p2}</div>)}

      <h3>Historique :</h3>
      {logs.map(l => (
        <div key={l.id} style={{ color: l.type === 'match' ? '#fff' : '#ffa500' }}>
            {l.type === 'match' ? (
                <span><span style={{color: 'gold'}}>👑</span> {l.message.split('|')[0].replace('MATCH:', '')} vs {l.message.split('|')[1]} <span style={{color: 'gray'}}>🎱</span></span>
            ) : l.message}
        </div>
      ))}
    </div>
  );
}
