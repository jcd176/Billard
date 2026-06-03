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

  // Style pour forcer les boutons sans fond blanc
  const btnStyle = { background: 'transparent', border: 'none', cursor: 'pointer', padding: '0 5px', fontSize: '18px' };

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

    const unsubS = onValue(statsRef, (snapshot) => setMatchStats(snapshot.val() || {}));
    
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
    
    const duoKey = [winner, loser].sort().join('_vs_');
    const current = matchStats[duoKey] || { p1: w.name, p2: l.name, w1: 0, w2: 0 };
    
    const isW1 = (w.id < l.id);
    update(ref(database, `rooms/${roomId}/matchStats/${duoKey}`), {
        p1: w.id < l.id ? w.name : l.name,
        p2: w.id < l.id ? l.name : w.name,
        w1: isW1 ? current.w1 + 1 : current.w1,
        w2: !isW1 ? current.w2 + 1 : current.w2
    });
    push(ref(database, `rooms/${roomId}/logs`), { message: `MATCH:${w.name}|${l.name}`, type: 'match' });
    setWinner(''); setLoser('');
  };

  const adjustScore = (p, field, val) => {
    update(ref(database, `rooms/${roomId}/players/${p.id}`), { [field]: Math.max(0, (p[field] || 0) + val) });
  };

  return (
    <div className="card" style={{color: '#fff', padding: '15px'}}>
      <button onClick={onLeave} style={{marginBottom: '10px'}}>← Retour</button>
      <h2>Salle : {roomId}</h2>
      
      <div style={{ display: 'flex', gap: '5px', marginBottom: '20px' }}>
        <input value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Nom joueur" />
        <button onClick={addPlayer}>Ajouter</button>
      </div>

      <div style={{ background: '#333', padding: '10px', borderRadius: '5px', marginBottom: '20px' }}>
        <select value={winner} onChange={(e) => setWinner(e.target.value)} style={{width: '100%'}}><option value="">👑 Vainqueur</option>{players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <select value={loser} onChange={(e) => setLoser(e.target.value)} style={{width: '100%', margin: '5px 0'}}><option value="">🎱 Perdant</option>{players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <button onClick={declareMatch} style={{width: '100%'}}>Déclarer Match</button>
      </div>

      <h3>Classement Général</h3>
      <table style={{width: '100%', borderCollapse: 'collapse', marginBottom: '20px'}}>
        <thead><tr style={{borderBottom: '1px solid #555'}}><th>Joueur</th><th>Vict</th><th>Déf</th><th>%</th><th></th></tr></thead>
        <tbody>
          {players.map((p, i) => {
            const tot = (p.wins || 0) + (p.losses || 0);
            return (
              <tr key={p.id} style={{borderBottom: '1px solid #333'}}>
                <td>{i === 0 && '👑'}{p.name}</td>
                <td>{p.wins} <button style={btnStyle} onClick={() => adjustScore(p, 'wins', 1)}>🟢</button><button style={btnStyle} onClick={() => adjustScore(p, 'wins', -1)}>🔴</button></td>
                <td>{p.losses} <button style={btnStyle} onClick={() => adjustScore(p, 'losses', 1)}>🟢</button><button style={btnStyle} onClick={() => adjustScore(p, 'losses', -1)}>🔴</button></td>
                <td>{tot > 0 ? Math.round(((p.wins || 0) / tot) * 100) : 0}%</td>
                <td><button style={btnStyle} onClick={() => remove(ref(database, `rooms/${roomId}/players/${p.id}`))}>🎱</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h3>Suivi des rencontres (Duo)</h3>
      {Object.entries(matchStats).map(([key, s]) => (
        <div key={key} style={{background: '#222', padding: '5px', marginBottom: '5px', borderRadius: '3px'}}>
            {s.p1} <strong>{s.w1}</strong> - <strong>{s.w2}</strong> {s.p2}
        </div>
      ))}

      <h3>Historique :</h3>
      <div style={{background: '#111', padding: '10px', fontSize: '14px'}}>
        {logs.map(l => (
            <div key={l.id} style={{padding: '2px 0'}}>
                {l.type === 'match' ? (
                  <span>
                    <span style={{color: '#0f0'}}>{l.message.split('MATCH:')[1].split('|')[0]} 👑</span>
                    <span style={{color: '#fff'}}> vs </span>
                    <span style={{color: '#f00'}}>{l.message.split('|')[1]} 🎱</span>
                  </span>
                ) : <span style={{color: '#fd0'}}>{l.message}</span>}
            </div>
        ))}
      </div>
    </div>
  );
}
