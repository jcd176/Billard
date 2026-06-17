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
    // CORRECTION : Le chemin est 'skate/ROOM_ID/players'
    if (!roomId) return;
    const playersRef = ref(database, `skate/${roomId}/players`);
    
    return onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setPlayers([]);
        return;
      }
      
      const list = Object.entries(data).map(([id, p]) => ({
        id,
        ...p,
        // Si 'tricks' n'existe pas encore dans Firebase, on initialise un objet vide
        tricks: p.tricks || {} 
      }));
      setPlayers(list);
    });
  }, [roomId]);

  const toggleTrick = (playerId, trickId, currentStatus) => {
    // CORRECTION : Le chemin d'écriture doit correspondre à la lecture
    const tricksRef = ref(database, `skate/${roomId}/players/${playerId}/tricks`);
    update(tricksRef, { 
      [trickId]: !currentStatus 
    });
  };

  return (
    <div style={{ padding: '20px', background: '#222', color: '#fff', minHeight: '100vh' }}>
      <button onClick={onLeave} style={{ marginBottom: '20px' }}>⬅ Retour</button>
      <h1>Progression Minirampe</h1>
      
      {players.map(p => (
        <div key={p.id} style={{ background: '#333', padding: '15px', marginBottom: '20px', borderRadius: '8px' }}>
          <h2>{p.name}</h2>
          
          {Object.entries(TRICK_LEVELS).map(([level, tricks]) => (
            <div key={level} style={{ marginTop: '15px' }}>
              <h4 style={{ color: '#aaa', margin: '5px 0' }}>{level}</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {tricks.map(trick => {
                  const isDone = p.tricks[trick.id] === true;
                  return (
                    <button 
                      key={trick.id}
                      onClick={() => toggleTrick(p.id, trick.id, isDone)}
                      style={{ 
                        background: isDone ? '#0f0' : '#555',
                        color: isDone ? '#000' : '#fff',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer'
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
