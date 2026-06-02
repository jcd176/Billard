import React, { useState, useEffect } from 'react';
import { ref, onValue, remove, push, update } from 'firebase/database';
import { auth, database } from '../services/firebase';

export default function GamePage({ roomId, onLeave }) {
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');

  useEffect(() => {
    const playersRef = ref(database, `rooms/${roomId}/players`);
    return onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, p]) => ({ id, ...p })) : [];
      setPlayers(list.sort((a, b) => (b.wins || 0) - (a.wins || 0)));
    });
  }, [roomId]);

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    push(ref(database, `rooms/${roomId}/players`), { name: newPlayerName, wins: 0, losses: 0 });
    setNewPlayerName('');
  };

  const adjustScore = (player, type) => {
    update(ref(database, `rooms/${roomId}/players/${player.id}`), {
      wins: type === 'win' ? (player.wins || 0) + 1 : Math.max(0, (player.wins || 0) - 1),
      losses: type === 'loss' ? (player.losses || 0) + 1 : Math.max(0, (player.losses || 0) - 1)
    });
  };

  const resetStats = (player) => {
    const password = prompt("Mot de passe root :");
    if (password === 'root') update(ref(database, `rooms/${roomId}/players/${player.id}`), { wins: 0, losses: 0 });
  };

  const removePlayer = (playerId, playerName) => {
    const password = prompt(`Mot de passe root pour supprimer ${playerName} :`);
    if (password === 'root') remove(ref(database, `rooms/${roomId}/players/${playerId}`));
  };

  return (
    <div className="card">
      <button onClick={onLeave} style={{marginBottom: '10px'}}>← Retour</button>
      <h2>Salle : {roomId}</h2>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '5px' }}>
        <input value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Nom du joueur" />
        <button onClick={addPlayer} className="btn-primary">Ajouter</button>
      </div>

      <h3>Classement :</h3>
      {players.map((p) => (
        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#222', padding: '10px', marginBottom: '8px', borderRadius: '4px' }}>
          <span style={{ flex: 1, color: '#fff' }}>{p.name}</span>
          <button onClick={() => adjustScore(p, 'win')}>+</button>
          <span style={{width:'60px', textAlign:'center', color: '#fff'}}>{p.wins || 0}V-{p.losses || 0}D</span>
          <button onClick={() => adjustScore(p, 'loss')}>-</button>
          <button onClick={() => resetStats(p)} title="Réinitialiser" style={{background:'none', border:'none', color:'#fff', cursor:'pointer'}}>⟲</button>
          <button onClick={() => removePlayer(p.id, p.name)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '32px' }}>🎱</button>
        </div>
      ))}
    </div>
  );
}
