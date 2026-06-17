import { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { database } from '../services/firebase';

const TRICK_LEVELS = {
  "Niveau 1": [{ id: 'pump', label: 'Pompage' }, { id: 'kickturn', label: 'Kickturn' }, { id: 'rock_to_fakie', label: 'Rock to Fakie' }],
  "Niveau 2": [{ id: 'rock_n_roll', label: 'Rock \'n\' Roll' }, { id: 'axle_stall', label: 'Axle Stall' }, { id: 'tail_stall', label: 'Tail Stall' }],
  "Niveau 3": [{ id: '5050_grind', label: '50-50 Grind' }, { id: '50_grind', label: '5-0 Grind' }, { id: 'smith_stall', label: 'Smith Stall' }],
  "Niveau 4": [{ id: 'disaster', label: 'Disaster' }, { id: 'blunt_stall', label: 'Blunt Stall' }, { id: 'ollie_to_fakie', label: 'Ollie to Fakie' }]
};

export default function GamePage({ roomId, onLeave }) {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    if (!roomId) return;
    // On pointe bien vers ton arborescence 'skate/ROOM_ID/players'
    const playersRef = ref(database, `skate/${roomId}/players`);
    
    return onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, p]) => ({
          id,
          ...p,
          tricks: p.tricks || {} 
        }));
        setPlayers(list);
      } else {
        setPlayers([]);
      }
    });
  }, [roomId]);

  const toggleTrick = (playerId, trickId, currentStatus) => {
    const tricksRef = ref(database, `skate/${roomId}/players/${playerId}/tricks`);
    update(tricksRef, { [trickId]: !currentStatus });
  };

  return (
    <div style={{ background: '#121212', color: '#fff', padding: '20px', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <button onClick={onLeave} style={{ background: '#444', color: '#fff', border: 'none', padding: '10px', borderRadius: '5px', cursor: 'pointer' }}>⬅ Retour</button>
      
      <h1 style={{ textAlign: 'center' }}>Progression Minirampe</h1>
      
      {players.map(p => (
        <div key={p.id} style={{ background: '#1e1e1e', padding: '15px', marginBottom: '20px', borderRadius: '10px', border: '1px solid #333' }}>
          <h2 style={{ color: '#00e676', marginTop: 0 }}>{p.name}</h2>
          
          {Object.entries(TRICK_LEVELS).map(([level, tricks]) => (
            <div key={level} style={{ marginTop: '15px' }}>
              <h3 style={{ fontSize: '14px', color: '#888', textTransform: 'uppercase', marginBottom: '8px' }}>{level}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {tricks.map(trick => {
                  const isDone = !!p.tricks[trick.id];
                  return (
                    <button 
                      key={trick.id}
                      onClick={() => toggleTrick(p.id, trick.id, isDone)}
                      style={{ 
                        background: isDone ? '#00c853' : '#333',
                        color: isDone ? '#000' : '#fff',
                        border: 'none',
                        padding: '10px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '13px'
                      }}
                    >
                      {trick.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
