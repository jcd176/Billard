import React, { useState, useEffect } from 'react';
import { ref, onValue, push, remove } from 'firebase/database';
import { database } from '../services/firebase';

// Liste exhaustive Mini-Rampe avec variantes FS/BS
const TRICKS_LIST = [
  "Ollie", "FS 180", "BS 180", "FS 360", "BS 360",
  "Kickflip", "FS Kickflip", "BS Kickflip", "Heelflip", "FS Heelflip", "BS Heelflip",
  "FS Shove-it", "BS Shove-it", "Varial Kickflip", "Tre Flip (360 Flip)", "Hardflip",
  "Axle Stall", "FS Axle Stall", "BS Axle Stall", "Rock to Fakie", "Rock 'n' Roll",
  "FS Rock 'n' Roll", "BS Rock 'n' Roll", "Blunt Stall", "FS Blunt Stall", "BS Blunt Stall",
  "Nosepick", "Tail Stall", "Nose Stall", "50-50 Grind", "FS 50-50", "BS 50-50",
  "5-0 Grind", "FS 5-0", "BS 5-0", "Smith Grind", "FS Smith", "BS Smith",
  "Feeble Grind", "FS Feeble", "BS Feeble", "Crooked Grind", "FS Crooked", "BS Crooked",
  "FS Disaster", "BS Disaster", "Indy Air", "Melon Air", "Mute Air", "Stalefish",
  "Boneless", "Manual", "Nose Manual", "Bluntslide", "Tailslide", "Noseslide", 
  "FS Tailslide", "BS Tailslide", "Sweeper", "Crail Slide", "Hippy Jump"
];

const STANCES = ["Normal", "Fakie", "Nollie", "Switch"];

export default function SkatePage({ roomId, onLeave }) {
  const [players, setPlayers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const path = `rooms/skate/${roomId}`;

  useEffect(() => {
    onValue(ref(database, `${path}/players`), (s) => {
      const data = s.val() || {};
      setPlayers(Object.entries(data).map(([id, p]) => ({ id, ...p })));
    });
    onValue(ref(database, `${path}/logs`), (s) => {
      const data = s.val() || {};
      setLogs(Object.values(data).reverse());
    });
  }, [roomId]);

  const addLog = (message, type = 'system') => {
    push(ref(database, `${path}/logs`), { message, type, timestamp: Date.now() });
  };

  const addPlayer = () => {
    const trimmedName = newPlayerName.trim();
    if (!trimmedName || trimmedName.length > 13) return;
    if (players.some(p => p.name.toLowerCase() === trimmedName.toLowerCase())) return;
    push(ref(database, `${path}/players`), { name: trimmedName });
    addLog(`${trimmedName} a rejoint la session`, 'system');
    setNewPlayerName('');
    setIsAddPlayerOpen(false);
  };

  const removePlayer = (playerId, playerName) => {
    if (window.confirm(`Confirmer la suppression de ${playerName} ?`)) {
      remove(ref(database, `${path}/players/${playerId}`));
      addLog(`${playerName} a été supprimé`, 'system');
    }
  };

  return (
    <div className="card" style={{ position: 'relative', paddingTop: '80px' }}>
      <button onClick={onLeave} style={{ position: 'absolute', top: '20px', left: '20px', width: '45px', height: '45px', borderRadius: '50%', background: '#ff4d4d', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '28px' }}>↩</button>
      
      <h2 style={{ textAlign: 'center', color: '#00d0ff' }}>Session Mini-Rampe 🛹</h2>

      <button onClick={() => setIsAddPlayerOpen(!isAddPlayerOpen)} className="btn-primary" style={{ width: '100%', marginBottom: '10px', padding: '12px', borderRadius: '6px' }}>
        {isAddPlayerOpen ? 'Fermer' : '+ Ajouter un Skateur'}
      </button>

      {isAddPlayerOpen && (
        <div style={{ background: '#333', padding: '15px', marginBottom: '15px', borderRadius: '6px' }}>
          <input maxLength={13} value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Nom (max 13 car.)" style={{width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px'}} />
          <button onClick={addPlayer} className="btn-primary" style={{ width: '100%', padding: '10px' }}>Valider</button>
        </div>
      )}

      {players.map(p => (
        <PlayerTrickEntry key={p.id} player={p} onRemove={() => removePlayer(p.id, p.name)} onLog={addLog} />
      ))}

      <div style={{ background: '#1a1a1a', padding: '15px', borderRadius: '6px', maxHeight: '300px', overflowY: 'auto', marginTop: '20px' }}>
        <h3 style={{ color: '#00d0ff', fontSize: '1.1rem', marginBottom: '10px' }}>Historique</h3>
        {logs.map((log, index) => (
          <p key={index} style={{ fontSize: '0.9rem', color: log.type === 'trick' ? '#00d0ff' : '#4ade80' }}>
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

  const handleValidate = () => {
    if (!stance || !trick) return;
    onLog(`${player.name} a rentré un ${stance} ${trick}`, 'trick');
    setStance(""); // Reset
    setTrick("");  // Reset
  };

  return (
    <div style={{ background: '#222', padding: '10px', marginBottom: '10px', borderRadius: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <span style={{ fontWeight: 'bold' }}>{player.name}</span>
        <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>🛹</button>
      </div>
      <div style={{ display: 'flex', gap: '5px' }}>
        <select value={stance} onChange={(e) => setStance(e.target.value)} style={{ width: '30%' }}>
          <option value="">Stance</option>
          {STANCES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={trick} onChange={(e) => setTrick(e.target.value)} style={{ flex: 1 }}>
          <option value="">Trick</option>
          {TRICKS_LIST.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button onClick={handleValidate} style={{ background: '#00d0ff', border: 'none', borderRadius: '4px', padding: '0 10px', cursor: 'pointer' }}>OK</button>
      </div>
    </div>
  );
}
