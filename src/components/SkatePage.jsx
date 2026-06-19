import React, { useState, useEffect } from 'react';
import { ref, onValue, push, remove } from 'firebase/database';
import { database } from '../services/firebase';

// Liste exhaustive de tricks spécifiques Mini-Rampe
const TRICKS_LIST = [
  "Axle Stall", "Rock to Fakie", "Rock 'n' Roll", "Blunt Stall", "Nosepick", 
  "Tail Stall", "50-50 Grind", "5-0 Grind", "Smith Grind", "Feeble Grind", 
  "Crooked Grind", "FS Disaster", "BS Disaster", "Ollie Air", "Indy Air", 
  "Melon Air", "Boneless", "Manual", "Nose Manual", "Bluntslide", 
  "Tailslide", "Noseslide", "Sweeper", "Crail Slide", "Hippy Jump"
];

const STANCES = ["Normal", "Fakie", "Nollie", "Switch"];

export default function SkatePage({ roomId, onLeave }) {
  const [players, setPlayers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const path = `rooms/skate/${roomId}`;

  useEffect(() => {
    const playersRef = ref(database, `${path}/players`);
    const logsRef = ref(database, `${path}/logs`);
    
    onValue(playersRef, (s) => {
      const data = s.val() || {};
      setPlayers(Object.entries(data).map(([id, p]) => ({ id, ...p })));
    });

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
    if (!trimmedName || trimmedName.length > 13) return;
    if (players.some(p => p.name.toLowerCase() === trimmedName.toLowerCase())) return;

    push(ref(database, `${path}/players`), { name: trimmedName });
    addLog(`${trimmedName} a rejoint la session`);
    setNewPlayerName('');
    setIsAddPlayerOpen(false);
  };

  const logTrick = (playerName, stance, trick) => {
    if (!stance || !trick) return alert("Veuillez choisir un stance et un trick");
    addLog(`${playerName} a rentré un ${stance} ${trick}`);
  };

  return (
    <div className="card" style={{ position: 'relative', paddingTop: '80px' }}>
      {/* Bouton retour rouge */}
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
          <input className="join-input" maxLength={13} value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Nom (max 13 car.)" style={{width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px'}} />
          <button onClick={addPlayer} className="btn-primary" style={{ width: '100%', padding: '10px' }}>Valider</button>
        </div>
      )}

      {/* Liste des joueurs avec saisie de figures */}
      {players.map(p => (
        <PlayerTrickEntry 
          key={p.id} 
          player={p} 
          onRemove={() => remove(ref(database, `${path}/players/${p.id}`))} 
          onLog={logTrick} 
        />
      ))}

      {/* Historique */}
      <div style={{ background: '#1a1a1a', padding: '15px', borderRadius: '6px', maxHeight: '300px', overflowY: 'auto', marginTop: '20px' }}>
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

function PlayerTrickEntry({ player, onRemove, onLog }) {
  const [stance, setStance] = useState("");
  const [trick, setTrick] = useState("");

  return (
    <div style={{ background: '#222', padding: '10px', marginBottom: '10px', borderRadius: '6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
        <span style={{ fontWeight: 'bold' }}>{player.name}</span>
        <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>🛹</button>
      </div>
      <div style={{ display: 'flex', gap: '5px' }}>
        <select onChange={(e) => setStance(e.target.value)} style={{ width: '30%' }}>
          <option value="">Stance</option>
          {STANCES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select onChange={(e) => setTrick(e.target.value)} style={{ flex: 1 }}>
          <option value="">Trick...</option>
          {TRICKS_LIST.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button onClick={() => onLog(player.name, stance, trick)} style={{ background: '#00d0ff', border: 'none', borderRadius: '4px', padding: '0 10px', cursor: 'pointer' }}>OK</button>
      </div>
    </div>
  );
}
