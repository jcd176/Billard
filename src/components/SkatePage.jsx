import React, { useState, useEffect } from 'react';
import { ref, onValue, push, remove, set } from 'firebase/database';
import { database } from '../services/firebase';

const TRICKS_LIST = [
  // --- GRINDS ---
  { name: "50-50 Grind", type: "grind" }, { name: "FS 50-50", type: "grind" }, { name: "BS 50-50", type: "grind" },
  { name: "5-0 Grind", type: "grind" }, { name: "FS 5-0", type: "grind" }, { name: "BS 5-0", type: "grind" },
  { name: "Smith Grind", type: "grind" }, { name: "FS Smith Grind", type: "grind" }, { name: "BS Smith Grind", type: "grind" },
  { name: "Feeble Grind", type: "grind" }, { name: "FS Feeble", type: "grind" }, { name: "BS Feeble", type: "grind" },
  { name: "Crooked Grind", type: "grind" }, { name: "FS Crooked", type: "grind" }, { name: "BS Crooked", type: "grind" },
  { name: "Nosegrind", type: "grind" }, { name: "Overcrook", type: "grind" }, { name: "Suski Grind", type: "grind" },
  { name: "Salad Grind", type: "grind" }, { name: "Willy Grind", type: "grind" },

  // --- SLIDES ---
  { name: "Boardslide", type: "slide" }, { name: "FS Boardslide", type: "slide" }, { name: "BS Boardslide", type: "slide" },
  { name: "Lipslide", type: "slide" }, { name: "FS Lipslide", type: "slide" }, { name: "BS Lipslide", type: "slide" },
  { name: "Bluntslide", type: "slide" }, { name: "FS Bluntslide", type: "slide" }, { name: "BS Bluntslide", type: "slide" },
  { name: "Tailslide", type: "slide" }, { name: "FS Tailslide", type: "slide" }, { name: "BS Tailslide", type: "slide" },
  { name: "Noseslide", type: "slide" }, { name: "Darkslide", type: "slide" }, { name: "Crail Slide", type: "slide" },
  { name: "Nosebluntslide", type: "slide" },

  // --- STALLS & TRANSITION ---
  { name: "Axle Stall", type: "stall" }, { name: "FS Axle Stall", type: "stall" }, { name: "BS Axle Stall", type: "stall" },
  { name: "Rock to Fakie", type: "stall" }, { name: "Rock 'n' Roll", type: "stall" }, { name: "FS Rock 'n' Roll", type: "stall" },
  { name: "Blunt Stall", type: "stall" }, { name: "FS Blunt Stall", type: "stall" }, { name: "BS Blunt Stall", type: "stall" },
  { name: "Nosepick", type: "stall" }, { name: "Tail Stall", type: "stall" }, { name: "FS Disaster", type: "stall" }, 
  { name: "BS Disaster", type: "stall" }, { name: "Sweeper", type: "stall" }, { name: "Pivot Fakie", type: "stall" },
  { name: "Invert", type: "stall" }, { name: "Eggplant", type: "stall" },

  // --- FLIPS & SPIN ---
  { name: "Ollie", type: "flip" }, { name: "Kickflip", type: "flip" }, { name: "Heelflip", type: "flip" },
  { name: "FS 180", type: "flip" }, { name: "BS 180", type: "flip" }, { name: "FS 360", type: "flip" }, 
  { name: "BS 360", type: "flip" }, { name: "FS Shove-it", type: "flip" }, { name: "BS Shove-it", type: "flip" },
  { name: "Tre Flip (360 Flip)", type: "flip" }, { name: "Hardflip", type: "flip" }, { name: "Varial Kickflip", type: "flip" },
  { name: "Inward Heelflip", type: "flip" }, { name: "Bigspin", type: "flip" }, { name: "Gazelle Flip", type: "flip" },
  { name: "Caballerial", type: "flip" }, { name: "Half Cab", type: "flip" },

  // --- GRABS ---
  { name: "Indy Air", type: "grab" }, { name: "Melon Air", type: "grab" }, { name: "Mute Air", type: "grab" },
  { name: "Stalefish", type: "grab" }, { name: "Method Air", type: "grab" }, { name: "Crail Grab", type: "grab" },
  { name: "Tail Grab", type: "grab" }, { name: "Nose Grab", type: "grab" }, { name: "Japan Air", type: "grab" },
  { name: "Seatbelt Grab", type: "grab" },

  // --- DIVERS ---
  { name: "Boneless", type: "other" }, { name: "No Comply", type: "other" }, { name: "Wallie", type: "other" },
  { name: "Manual", type: "other" }, { name: "Nose Manual", type: "other" }, { name: "Hippy Jump", type: "other" },
  { name: "Powerslide", type: "other" }, { name: "Pressure Flip", type: "other" }
];

const STANCES = ["Normal", "Fakie", "Nollie", "Switch"];

export default function SkatePage({ roomId, onLeave }) {
  const [players, setPlayers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const path = `rooms/skate/${roomId}`;

  useEffect(() => {
    onValue(ref(database, `${path}/players`), (s) => {
      const data = s.val() || {};
      setPlayers(Object.entries(data).map(([id, p]) => ({ id, ...p })));
    });
    onValue(ref(database, `${path}/logs`), (s) => {
      const data = s.val() || {};
      setLogs(Object.values(data).sort((a, b) => b.timestamp - a.timestamp));
    });
  }, [roomId]);

  const addLog = (message, type = 'system') => {
    push(ref(database, `${path}/logs`), { message, type, timestamp: Date.now() });
  };

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    push(ref(database, `${path}/players`), { name: newPlayerName });
    addLog(`${newPlayerName} a rejoint`, 'join');
    setNewPlayerName(''); setIsAddOpen(false);
  };

  const resetLogs = () => {
    if (prompt("Mot de passe root :") === 'root') set(ref(database, `${path}/logs`), null);
    else addLog("Erreur: Mot de passe incorrect", "error");
  };

  const getLogColor = (type) => {
    switch(type) {
      case 'grind': return '#ffcc00'; case 'slide': return '#ff9933'; case 'grab': return '#ff4d4d';
      case 'flip': return '#00d0ff'; case 'stall': return '#bfbfbf'; case 'join': return '#4ade80';
      case 'error': return '#800080'; default: return '#fff';
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundImage: 'url("https://images.unsplash.com/photo-1547448415-e9f5b97e5112?w=1600")', backgroundSize: 'cover', backgroundAttachment: 'fixed', padding: '20px' }}>
      <div className="card" style={{ paddingTop: '80px', background: 'rgba(0,0,0,0.85)', color: '#fff', position: 'relative' }}>
        <button onClick={onLeave} style={{ position: 'absolute', top: '20px', left: '20px', background: '#ff4d4d', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '5px' }}>↩</button>
        <h2 style={{ textAlign: 'center' }}>Mini-Rampe 🛹</h2>

        <button onClick={() => setIsAddOpen(!isAddOpen)} style={{ width: '100%', marginBottom: '10px', padding: '10px' }}>{isAddOpen ? 'Fermer' : '+ Ajouter Skateur'}</button>
        {isAddOpen && (
          <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
            <input value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Nom..." style={{ flex: 1, padding: '10px' }} />
            <button onClick={addPlayer} style={{ padding: '10px' }}>OK</button>
          </div>
        )}

        {players.map(p => (
          <div key={p.id} style={{ background: '#222', padding: '10px', marginBottom: '5px', borderRadius: '5px' }}>
            <span>🛹 {p.name}</span>
            <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
              <select onChange={(e) => p.s = e.target.value}><option>Stance</option>{STANCES.map(st => <option key={st}>{st}</option>)}</select>
              <select onChange={(e) => p.t = JSON.parse(e.target.value)}><option>Trick</option>{TRICKS_LIST.map(tr => <option key={tr.name} value={JSON.stringify(tr)}>{tr.name}</option>)}</select>
              <button onClick={() => { if(p.s && p.t) { addLog(`🛹 ${p.name} : ${p.s} ${p.t.name}`, p.t.type); } }}>OK</button>
            </div>
          </div>
        ))}

        <div style={{ background: '#111', padding: '10px', marginTop: '20px', borderRadius: '5px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><h3>Historique</h3><button onClick={resetLogs} style={{ border: 'none', background: 'none', fontSize: '1.5rem' }}>🗑️</button></div>
          {logs.map((log, i) => (
            <p key={i} style={{ color: getLogColor(log.type), fontSize: '0.85rem' }}>
              [{new Date(log.timestamp).toLocaleString()}] {log.message}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
