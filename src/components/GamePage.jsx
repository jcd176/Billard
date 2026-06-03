import React, { useState, useEffect } from 'react';
import { ref, onValue, remove, push, update } from 'firebase/database';
import { database } from '../services/firebase';

export default function GamePage({ roomId, onLeave }) {
  const [players, setPlayers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [winner, setWinner] = useState('');
  const [loser, setLoser] = useState('');

  useEffect(() => {
    // Écoute des joueurs
    const playersRef = ref(database, `rooms/${roomId}/players`);
    const unsubscribePlayers = onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, p]) => ({ id, ...p })) : [];
      setPlayers(list.sort((a, b) => (b.wins || 0) - (a.wins || 0)));
    });

    // Écoute de l'historique
    const logsRef = ref(database, `rooms/${roomId}/logs`);
    const unsubscribeLogs = onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, log]) => ({ id, ...log })) : [];
      setLogs(list.reverse().slice(0, 10)); 
    });

    return () => {
      unsubscribePlayers();
      unsubscribeLogs();
    };
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
    setWinner(''); 
    setLoser('');
  };

  const adjustScore = (player, type) => {
    update(ref(database, `rooms/${roomId}/players/${player.id}`), {
      wins: type === 'win' ? (player.wins || 0) + 1 : Math.max(0, (player.wins || 0) - 1),
      losses: type === 'loss' ? (player.losses || 0) + 1 : Math.max(0, (player.losses || 0) - 1)
    });
  };

  const removePlayer = (playerId, playerName) => {
    if (prompt("Saisissez le mot de passe") === 'root') {
      remove(ref(database, `rooms/${roomId}/players/${playerId}`));
      addLog(`${playerName} a été supprimé`, 'remove');
    }
  };

  return (
    <div className="card">
      <button onClick={onLeave} style={{marginBottom: '10px'}}>← Retour</button>
      <h2>Salle : {roomId}</h2>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '5px' }}>
        <input value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Nom du joueur" />
        <button onClick={addPlayer} className="btn-primary">Ajouter</button>
      </div>

      <div style={{ background: '#333', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
        <select value={winner} onChange={(e) => setWinner(e.target.value)} style={{width: '100%', marginBottom: '5px'}}>
          <option value="">👑 Vainqueur</option>
          {players.map(p => <option key={p.id} value={p.id}>👑 {p.name}</option>)}
        </select>
        <select value={loser} onChange={(e) => setLoser(e.target.value)} style={{width: '100%', marginBottom: '10px'}}>
          <option value="">🎱 Perdant</option>
          {players.map(p => <option key={p.id} value={p.id}>🎱 {p.name}</option>)}
        </select>
        <button onClick={declareMatch} className="btn-primary" style={{width: '100%'}}>Déclarer Match</button>
      </div>

      <h3>Classement :</h3>
      {players.map((p) => {
        const total = (p.wins || 0) + (p.losses || 0);
        const winRate = total > 0 ? Math.round(((p.wins || 0) / total) * 100) : 0;
        return (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#222', padding: '10px', marginBottom: '8px', borderRadius: '4px' }}>
            <span style={{ flex: 1, color: '#fff' }}>{p.name}</span>
            <span style={{fontSize: '12px', color: '#aaa'}}>{p.wins}V - {p.losses}D ({winRate}%)</span>
            <button onClick={() => adjustScore(p, 'win')}>+</button>
            <button onClick={() => adjustScore(p, 'loss')}>-</button>
            <button onClick={() => removePlayer(p.id, p.name)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '24px' }}>🗑️</button>
          </div>
        );
      })}

      <h3>Historique :</h3>
      <div style={{ background: '#111', padding: '10px', borderRadius: '5px', fontSize: '14px', marginTop: '10px' }}>
        {logs.length === 0 && <span style={{color: '#555'}}>Aucun historique pour le moment.</span>}
        {logs.map((log) => (
          <div key={log.id} style={{ 
            color: log.type === 'add' ? '#FFD700' : (log.type === 'remove' ? '#DA70D6' : '#FF4500'),
            marginBottom: '5px',
            borderBottom: '1px solid #222'
          }}>
            {log.message}
          </div>
        ))}
      </div>
    </div>
  );
}
