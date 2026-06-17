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
    const playersRef = ref(database, `rooms/${roomId}/players`);
    
    return onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setPlayers([]);
        return;
      }
      // Transformation des données pour inclure l'ID et s'assurer que tricks existe
      const list = Object.entries(data).map(([id, p]) => ({
        id,
        ...p,
        tricks: p.tricks || {} // Sécurité : on initialise l'objet tricks s'il est vide
      }));
      setPlayers(list);
    });
  }, [roomId]);

  const toggleTrick = (playerId, trickId, currentStatus) => {
    // On cible précisément le champ dans Firebase
    const trickRef = ref(database, `rooms/${roomId}/players/${playerId}/tricks/${trickId}`);
    update(ref(database, `rooms/${roomId}/players/${playerId}/tricks`), { 
      [trickId]: !currentStatus 
    });
  };

  return (
    <div style={{ background: '#1a1a1a', color: '#fff', padding: '20px', minHeight: '100vh' }}>
      <button onClick={onLeave} style={{ marginBottom: '20px' }}>↩ Retour</button>
      <h1>Progression Minirampe</h1>
      
      {players.length === 0 && <p>Aucun joueur trouvé dans cette salle.</p>}

      {players.map(p => (
        <div key={p.id} style={{ background: '#2d2d2d', padding: '15px', marginBottom: '20px', borderRadius: '8px' }}>
          <h2 style={{ color: '#007bff' }}>{p.name}</h2>
          
          {Object.entries(TRICK_LEVELS).map(([level, tricks]) => (
            <div key={level} style={{ marginTop: '10px' }}>
              <h4 style={{ margin: '5px 0', borderBottom: '1px solid #444' }}>{level}</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '5px' }}>
                {tricks.map(trick => {
                  const isDone = p.tricks[trick.id] === true;
                  return (
                    <button 
                      key={trick.id}
                      onClick={() => toggleTrick(p.id, trick.id, isDone)}
                      style={{ 
                        background: isDone ? '#0f0' : '#444',
                        color: isDone ? '#000' : '#fff',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '20px',
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
