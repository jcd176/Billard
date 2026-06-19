import React, { useState, useEffect } from 'react';
import { ref, onValue, update, push } from 'firebase/database';
import { database } from '../services/firebase';

const TRICKS_LIST = [
  "Ollie", "FS 180", "BS 180", "Kickflip", "Heelflip", 
  "Rock to Fakie", "Rock 'n' Roll", "Axle Stall", "50-50", "Blunt Stall"
];

export default function SkatePage({ roomId, onLeave }) {
  const [players, setPlayers] = useState([]);
  const path = `rooms/skate/${roomId}`;

  useEffect(() => {
    const playersRef = ref(database, `${path}/players`);
    return onValue(playersRef, (s) => {
      const data = s.val() || {};
      setPlayers(Object.entries(data).map(([id, p]) => ({ id, ...p })));
    });
  }, [roomId]);

  const addLetter = (playerId) => {
    const player = players.find(p => p.id === playerId);
    const newLetters = Math.min((player.letters || 0) + 1, 5);
    update(ref(database, `${path}/players/${playerId}`), { letters: newLetters });
    push(ref(database, `${path}/logs`), { 
      message: `${player.name} a pris une lettre (${"SKATE".substring(0, newLetters)})`, 
      timestamp: Date.now() 
    });
  };

  return (
    <div className="card" style={{ paddingTop: '80px' }}>
      <button onClick={onLeave} style={{ position: 'absolute', top: '20px', left: '20px' }}>↩</button>
      <h2>Session Mini-Rampe 🛹</h2>
      
      {players.map(p => (
        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#333', marginBottom: '10px', borderRadius: '5px' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{p.name}</span>
          <span style={{ color: '#ffcc00', fontSize: '1.5rem', fontWeight: 'bold' }}>
            {"SKATE".substring(0, p.letters || 0)}
          </span>
          <button onClick={() => addLetter(p.id)} style={{ background: '#dc3545', border: 'none', color: '#fff', padding: '5px 15px', borderRadius: '4px' }}>
            Bail ❌
          </button>
        </div>
      ))}
    </div>
  );
}
