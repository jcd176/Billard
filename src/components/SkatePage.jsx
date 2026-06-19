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
    const trimmedName = newPlayerName.trim();
    if (!trimmedName) return;
    if (trimmedName.length > 13) return alert("Le nom est trop long (max 13 car.)");
    if (players.some(p => p.name.toLowerCase() === trimmedName.toLowerCase())) {
      return alert("Ce joueur existe déjà !");
    }

    push(ref(database, `${path}/players`), { name: trimmedName, letters: 0 });
    addLog(`${trimmedName} a rejoint la session`);
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
    <div className="card" style={{ position: 'relative', paddingTop: '80px' }}>
      {/* Bouton retour rouge comme le Dashboard */}
      <button 
        onClick={onLeave} 
        style={{
          position: 'absolute', top: '20px', left: '20px', width: '45px', height: '45px',
          borderRadius: '50%', background: '#ff4d4d', color: '#fff', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          fontSize: '28px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
        }}
      >
        ↩
      </button>
      
      <h2 style={{ textAlign: 'center', color: '#00d0ff' }}>Session Mini-Rampe 🛹</h2>

      <button onClick={() => setIsAddPlayerOpen(!isAddPlayerOpen)} className="btn-primary" style={{ width: '100%', marginBottom: '10px', padding: '12px', borderRadius: '6px' }}>
        {isAddPlayerOpen ? 'Fermer' : '+ Ajouter un Skateur'}
      </button>

      {isAddPlayerOpen && (
        <div style={{ background: '#333', padding: '15px', marginBottom: '15px', borderRadius: '6px' }}>
          <input 
            className="join-input"
            maxLength={13}
            value={newPlayerName} 
            onChange={(e) => setNewPlayerName(e.target.value)} 
            placeholder="Nom (max 13 car.)" 
            style={{width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px'}} 
          />
          <button onClick={addPlayer} className="btn-primary" style={{ width: '100%', padding: '10px' }}>Valider</button>
        </div>
      )}

      <select style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '6px' }}>
        <option value="">Sélectionner un Trick (Mini-rampe)</option>
        {TRICKS_LIST.map(trick => <option key={trick} value={trick}>{trick}</option>)}
      </select>

      {players.map(p => (
        <div key={p.id} style={{ display: 'flex', alignItems: 'center', padding: '10px', background: '#222', marginBottom: '8px', borderRadius: '6px' }}>
          <button onClick={() => removePlayer(p.id, p.name)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>🛹</button>
          <span style={{ flex: 1, marginLeft: '15px', fontWeight: 'bold' }}>{p.name}</span>
          <span style={{ color: '#ffcc00', fontWeight: 'bold', fontSize: '1.5rem', marginRight: '15px' }}>
            {"SKATE".substring(0, p.letters || 0)}
          </span>
          <button onClick={() => addLetter(p.id, p.name)} style={{ background: '#dc3545', border: 'none', color: '#fff', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}>
            Bail ❌
          </button>
        </div>
      ))}
    </div>
  );
}
