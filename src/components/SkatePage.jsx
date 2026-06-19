import React, { useState, useEffect } from 'react';
import { ref, onValue, update, push, remove } from 'firebase/database';
import { database } from '../services/firebase';

const TRICKS_LIST = [
  "Ollie", "FS 180", "BS 180", "Kickflip", "Heelflip", 
  "Rock to Fakie", "Rock 'n' Roll", "Axle Stall", "50-50", 
  "5-0", "Smith Grind", "Feeble Grind", "Blunt Stall", "Nosepick"
];

export default function SkatePage({ roomId, onLeave }) {
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const path = `rooms/skate/${roomId}`;

  useEffect(() => {
    const playersRef = ref(database, `${path}/players`);
    return onValue(playersRef, (s) => {
      const data = s.val() || {};
      setPlayers(Object.entries(data).map(([id, p]) => ({ id, ...p })));
    });
  }, [roomId]);

  const addLog = (message) => {
    push(ref(database, `${path}/logs`), { message, timestamp: Date.now() });
  };

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    push(ref(database, `${path}/players`), { name: newPlayerName, letters: 0 });
    addLog(`${newPlayerName} a rejoint la session`);
    setNewPlayerName('');
    setIsAddPlayerOpen(false);
  };

  const removePlayer = (playerId, playerName) => {
    if (window.confirm(`Supprimer ${playerName} ?`)) {
      remove(ref(database, `${path}/players/${playerId}`));
      addLog(`${playerName} a été supprimé`);
    }
  };

  const addLetter = (playerId, playerName) => {
    const player = players.find(p => p.id === playerId);
    const newLetters = Math.min((player.letters || 0) + 1, 5);
    update(ref(database, `${path}/players/${playerId}`), { letters: newLetters });
    addLog(`${playerName} a pris une lettre (${"SKATE".substring(0, newLetters)})`);
  };

  return (
    <div className="card" style={{ paddingTop: '80px' }}>
      <button onClick={onLeave} style={{ position: 'absolute', top: '20px', left: '20px' }}>↩</button>
      
      <h2>Session Mini-Rampe 🛹</h2>

      <button onClick={() => setIsAddPlayerOpen(!isAddPlayerOpen)} style={{ width: '100%', marginBottom: '10px' }}>
        {isAddPlayerOpen ? 'Fermer' : '+ Ajouter un Skateur'}
      </button>

      {isAddPlayerOpen && (
        <div style={{ background: '#333', padding: '10px', marginBottom: '10px' }}>
          <input value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Nom du skateur" style={{width: '100%', marginBottom: '5px'}} />
          <button onClick={addPlayer} style={{ width: '100%' }}>Valider</button>
        </div>
      )}

      <select style={{ width: '100%', padding: '10px', marginBottom: '20px' }}>
        <option value="">Sélectionner un Trick (Mini-rampe)</option>
        {TRICKS_LIST.map(trick => <option key={trick} value={trick}>{trick}</option>)}
      </select>

      {players.map(p => (
        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#222', marginBottom: '5px', borderRadius: '5px' }}>
          <button onClick={() => removePlayer(p.id, p.name)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>🛹</button>
          <span style={{ flex: 1, marginLeft: '10px' }}>{p.name}</span>
          <span style={{ color: '#ffcc00', fontWeight: 'bold', fontSize: '1.2rem', marginRight: '10px' }}>
            {"SKATE".substring(0, p.letters || 0)}
          </span>
          <button onClick={() => addLetter(p.id, p.name)} style={{ background: '#dc3545', border: 'none', color: '#fff', padding: '5px 10px' }}>
            Bail ❌
          </button>
        </div>
      ))}
    </div>
  );
}
