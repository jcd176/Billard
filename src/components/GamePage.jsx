import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../services/firebase';

export default function GamePage({ roomId, onLeave }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) return;
    const playersRef = ref(database, `rooms/${roomId}/players`);
    
    const unsubscribe = onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, p]) => ({ id, ...p })) : [];
      setPlayers(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [roomId]);

  if (loading) return <div style={{color: '#fff'}}>Chargement...</div>;

  return (
    <div style={{color: '#fff', padding: '20px'}}>
      <button onClick={onLeave}>← Retour</button>
      <h2>Salle : {roomId}</h2>
      <h3>Liste des joueurs :</h3>
      <ul>
        {players.map(p => <li key={p.id}>{p.name}</li>)}
      </ul>
    </div>
  );
}
