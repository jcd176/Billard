import { useState, useEffect } from 'react';
import { ref, onValue, update, push } from 'firebase/database';
import { database } from '../services/firebase';

// Liste complète classée par niveau
const TRICK_LEVELS = {
  "Niveau 1: Fondations": [
    { id: 'pump', label: 'Pompage' },
    { id: 'kickturn', label: 'Kickturn' },
    { id: 'rock_to_fakie', label: 'Rock to Fakie' }
  ],
  "Niveau 2: Stalls": [
    { id: 'rock_n_roll', label: 'Rock \'n\' Roll' },
    { id: 'axle_stall', label: 'Axle Stall' },
    { id: 'tail_stall', label: 'Tail Stall' }
  ],
  "Niveau 3: Grinds": [
    { id: '5050_grind', label: '50-50 Grind' },
    { id: '50_grind', label: '5-0 Grind' },
    { id: 'smith_stall', label: 'Smith Stall' }
  ],
  "Niveau 4: Experts": [
    { id: 'disaster', label: 'Disaster' },
    { id: 'blunt_stall', label: 'Blunt Stall' },
    { id: 'ollie_to_fakie', label: 'Ollie to Fakie' }
  ]
};

export default function GamePage({ roomId, onLeave }) {
  const [players, setPlayers] = useState([]);
  
  useEffect(() => {
    const playersRef = ref(database, `rooms/${roomId}/players`);
    const unsub = onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, p]) => ({ id, ...p })) : [];
      setPlayers(list);
    });
    return unsub;
  }, [roomId]);

  const toggleTrick = (playerId, trickId, currentStatus) => {
    const trickRef = ref(database, `rooms/${roomId}/players/${playerId}/tricks`);
    update(trickRef, { [trickId]: !currentStatus });
  };

  return (
    <div className="card" style={{ padding: '20px', background: '#222', color: '#fff' }}>
      <button onClick={onLeave} style={{ marginBottom: '20px' }}>↩ Retour</button>
      <h2>Progression Minirampe</h2>
      
      {players.map(p => (
        <div key={p.id} style={{ border: '1px solid #444', padding: '15px', marginBottom: '20px', borderRadius: '8px' }}>
          <h3>{p.name}</h3>
          
          {Object.entries(TRICK_LEVELS).map(([level, tricks]) => (
            <div key={level} style={{ marginBottom: '15px' }}>
              <h4 style={{ color: '#aaa', fontSize: '0.9em' }}>{level}</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '8px' }}>
                {tricks.map(trick => {
                  const isDone = p.tricks?.[trick.id] || false;
                  return (
                    <button 
                      key={trick.id}
                      onClick={() => toggleTrick(p.id, trick.id, isDone)}
                      style={{ 
                        background: isDone ? '#007bff' : '#444',
                        color: 'white',
                        border: 'none',
                        padding: '8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
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
