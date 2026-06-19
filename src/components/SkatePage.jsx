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
  const [logs, setLogs] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const path = `rooms/skate/${roomId}`;

  useEffect(() => {
    const playersRef = ref(database, `${path}/players`);
    const logsRef = ref(database, `${path}/logs`);
    
    // Écoute des joueurs
    onValue(playersRef, (s) => {
      const data = s.val() || {};
      setPlayers(Object.entries(data).map(([id, p]) => ({ id, ...p })));
    });

    // Écoute des logs (triés par timestamp si nécessaire côté UI)
    onValue(logsRef, (s) => {
      const data = s.val() || {};
      setLogs(Object.values(data).reverse());
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

    push(ref(database, `${path}/players`), { name: trimmedName });
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

  const logTrick = (playerName, trick) => {
    addLog(`${playerName} a rentré : ${trick}`);
  };

  return (
    <div className="card" style={{ position: 'relative', paddingTop: '80px' }}>
      <button onClick={onLeave} style={{
        position: 'absolute', top: '20px', left: '20px', width: '45px', height: '45px',
        borderRadius: '50%', background: '#ff4d4d', color: '#fff', border: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        fontSize: '28px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
      }}>↩</button>
      
      <h2 style={{ textAlign: 'center', color: '#00d0ff' }}>Session Mini-Rampe 🛹</h2>

      <button onClick={() => setIsAddPlayerOpen(!isAddPlayerOpen)} className="btn-primary" style={{ width: '100%', marginBottom: '10px', padding: '12px', borderRadius: '6px' }}>
        {isAddPlayerOpen ? 'Fermer' : '+ Ajouter un Skateur'}
      </button>

      {isAddPlayerOpen && (
        <div style={{ background: '#333', padding: '15px', marginBottom: '15px', borderRadius: '6px' }}>
          <input className="join-input" maxLength={13} value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Nom (max 13 car.)" style={{width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px'}} />
          <button onClick={addPlayer} className="btn-primary" style={{ width: '100%', padding: '10px' }}>Valider</button>
        </div>
      )}

      {/* Sélecteur de Trick pour chaque joueur */}
      <div style={{ marginBottom: '20px' }}>
        {players.map(p => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
            <button onClick={() => removePlayer(p.id, p.name)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>🛹</button>
            <span style={{ fontWeight: 'bold', width: '80px' }}>{p.name}</span>
            <select onChange={(e) => e.target.value && logTrick(p.name, e.target.value)} style={{ flex: 1, padding: '5px' }}>
              <option value="">Rentrer une figure...</option>
              {TRICKS_LIST.map(trick => <option key={trick} value={trick}>{trick}</option>)}
            </select>
          </div>
        ))}
      </div>

      {/* Section Logs */}
      <div style={{ background: '#1a1a1a', padding: '15px', borderRadius: '6px', maxHeight: '300px', overflowY: 'auto' }}>
        <h3 style={{ color: '#00d0ff', fontSize: '1.1rem', marginBottom: '10px' }}>Historique des figures</h3>
        {logs.map((log, index) => (
          <p key={index} style={{ fontSize: '0.9rem', borderBottom: '1px solid #333', paddingBottom: '5px', color: '#ccc' }}>
            {log.message}
          </p>
        ))}
      </div>
    </div>
  );
}
