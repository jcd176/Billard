import React, { useState, useEffect } from 'react';
import { ref, onValue, update, push, remove } from 'firebase/database';
import { database } from '../services/firebase';

export default function GamePage({ roomId, onLeave }) {
  const [players, setPlayers] = useState([]);
  const [newPlayer, setNewPlayer] = useState('');

  useEffect(() => {
    if (!roomId) return;
    const playersRef = ref(database, `rooms/${roomId}/players`);
    return onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, p]) => ({ id, ...p })) : [];
      setPlayers(list.sort((a, b) => (b.wins || 0) - (a.wins || 0)));
    });
  }, [roomId]);

  const addPlayer = () => {
    if (!newPlayer.trim()) return;
    push(ref(database, `rooms/${roomId}/players`), { name: newPlayer, wins: 0, losses: 0 });
    setNewPlayer('');
  };

  return (
    <div style={{ color: '#fff', padding: '20px', background: '#222', borderRadius: '10px' }}>
      <button onClick={onLeave} style={{ marginBottom: '10px' }}>← Retour</button>
      <h2>Salle : {roomId}</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <input value={newPlayer} onChange={(e) => setNewPlayer(e.target.value)} placeholder="Nom joueur" />
        <button onClick={addPlayer}>Ajouter</button>
      </div>

      <h3>Classement Général</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Joueur</th>
            <th style={{ textAlign: 'center' }}>Vict</th>
            <th style={{ textAlign: 'center' }}>Déf</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.id} style={{ borderBottom: '1px solid #444' }}>
              <td style={{ padding: '8px' }}>{p.name}</td>
              <td style={{ textAlign: 'center' }}>{p.wins || 0}</td>
              <td style={{ textAlign: 'center' }}>{p.losses || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
