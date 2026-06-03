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

    update(ref(database, `rooms/${roomId}/players/${winner}`), { wins: (w.wins || 0) + 1 });
    update(ref(database, `rooms/${roomId}/players/${loser}`), { losses: (l.losses || 0) + 1 });

    const duoKey = [winner, loser].sort().join('_');
    const currentStats = matchStats[duoKey] || { p1: w.name, p2: l.name, wins1: 0, wins2: 0 };
    
    update(ref(database, `rooms/${roomId}/matchStats/${duoKey}`), {
        p1: w.id < l.id ? w.name : l.name,
        p2: w.id < l.id ? l.name : w.name,
        wins1: (w.id < l.id) ? (currentStats.wins1 + 1) : currentStats.wins1,
        wins2: (w.id > l.id) ? (currentStats.wins2 + 1) : currentStats.wins2
    });

    push(ref(database, `rooms/${roomId}/logs`), { message: `${w.name} a battu ${l.name}`, type: 'match', timestamp: Date.now() });
    setWinner(''); setLoser('');
  };

  const resetAll = () => {
    if (prompt("Mot de passe pour tout réinitialiser ?") === 'root') {
        set(ref(database, `rooms/${roomId}/matchStats`), null);
        set(ref(database, `rooms/${roomId}/logs`), null);
        players.forEach(p => update(ref(database, `rooms/${roomId}/players/${p.id}`), { wins: 0, losses: 0 }));
    }
  };

  const adjustScore = (player, type, field) => {
    const newVal = type === 'plus' ? (player[field] || 0) + 1 : Math.max(0, (player[field] || 0) - 1);
    update(ref(database, `rooms/${roomId}/players/${player.id}`), { [field]: newVal });
  };

  const removePlayer = (id, name) => { if (prompt("Mot de passe ?") === 'root') remove(ref(database, `rooms/${roomId}/players/${id}`)); };

  // Style helper pour boutons transparents
  const btnStyle = { background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', fontSize: '16px' };

  return (
    <div className="card">
      <button onClick={onLeave} style={{marginBottom: '10px'}}>← Retour</button>
      <h2>Salle : {roomId}</h2>
      
      <div style={{ background: '#333', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
        <select value={winner} onChange={(e) => setWinner(e.target.value)} style={{width: '100%'}}><option value="">👑 Vainqueur</option>{players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <select value={loser} onChange={(e) => setLoser(e.target.value)} style={{width: '100%', margin: '10px 0'}}><option value="">🎱 Perdant</option>{players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <button onClick={declareMatch} className="btn-primary" style={{width: '100%'}}>Déclarer Match</button>
      </div>

      <h3>Classement Général</h3>
      <table style={{width: '100%', color: '#fff', borderCollapse: 'collapse'}}>
        <thead><tr style={{borderBottom: '1px solid #555'}}><th>Joueur</th><th>Vict</th><th>Déf</th><th></th></tr></thead>
        <tbody>
          {players.map((p, i) => (
            <tr key={p.id} style={{borderBottom: '1px solid #333'}}>
              <td style={{padding: '5px'}}>{i === 0 && '👑'}{p.name}</td>
              <td>{p.wins} <button style={btnStyle} onClick={() => adjustScore(p, 'plus', 'wins')}>🟢</button> <button style={btnStyle} onClick={() => adjustScore(p, 'minus', 'wins')}>🔴</button></td>
              <td>{p.losses} <button style={btnStyle} onClick={() => adjustScore(p, 'plus', 'losses')}>🟢</button> <button style={btnStyle} onClick={() => adjustScore(p, 'minus', 'losses')}>🔴</button></td>
              <td><button style={btnStyle} onClick={() => removePlayer(p.id, p.name)}>🎱</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Suivi des rencontres (Duo) <button style={btnStyle} onClick={resetAll}>🔄</button></h3>
      {Object.entries(matchStats).map(([key, s]) => (
        <table key={key} style={{width: '100%', background: '#222', marginBottom: '5px', color: '#fff', textAlign: 'center'}}>
          <thead><tr><th>{s.p1}</th><th>{s.p2}</th></tr></thead>
          <tbody><tr><td style={{color: '#0f0'}}>{s.wins1}</td><td style={{color: '#0f0'}}>{s.wins2}</td></tr></tbody>
        </table>
      ))}

      <h3>Historique :</h3>
      <div style={{background: '#111', fontSize: '13px', padding: '10px', color: '#ccc'}}>
        {logs.map(l => <div key={l.id} style={{padding: '2px 0'}}>{l.message}</div>)}
      </div>
    </div>
  );
}
