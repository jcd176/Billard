import React, { useState, useEffect } from 'react';
import { ref, onValue, push, remove, set } from 'firebase/database';
import { database } from '../services/firebase';

const TRICKS_LIST = [
  // --- GRINDS ---
  { name: "50-50", type: "grind" }, { name: "FS 50-50", type: "grind" }, { name: "BS 50-50", type: "grind" },
  { name: "5-0", type: "grind" }, { name: "FS 5-0", type: "grind" }, { name: "BS 5-0", type: "grind" },
  { name: "Smith", type: "grind" }, { name: "FS Smith", type: "grind" }, { name: "BS Smith", type: "grind" },
  { name: "Feeble", type: "grind" }, { name: "FS Feeble", type: "grind" }, { name: "BS Feeble", type: "grind" },
  { name: "Crooked", type: "grind" }, { name: "FS Crooked", type: "grind" }, { name: "BS Crooked", type: "grind" },
  { name: "Nosegrind", type: "grind" }, { name: "Overcrook", type: "grind" },
  
  // --- SLIDES ---
  { name: "Boardslide", type: "slide" }, { name: "FS Boardslide", type: "slide" }, { name: "BS Boardslide", type: "slide" },
  { name: "Lipslide", type: "slide" }, { name: "FS Lipslide", type: "slide" }, { name: "BS Lipslide", type: "slide" },
  { name: "Bluntslide", type: "slide" }, { name: "FS Bluntslide", type: "slide" }, { name: "BS Bluntslide", type: "slide" },
  { name: "Nosebluntslide", type: "slide" }, { name: "FS Noseblunt", type: "slide" }, { name: "BS Noseblunt", type: "slide" },
  { name: "Tailslide", type: "slide" }, { name: "FS Tailslide", type: "slide" }, { name: "BS Tailslide", type: "slide" },
  { name: "Noseslide", type: "slide" }, { name: "FS Noseslide", type: "slide" }, { name: "BS Noseslide", type: "slide" },

  // --- STALLS ---
  { name: "Axle Stall", type: "stall" }, { name: "Rock to Fakie", type: "stall" },
  { name: "Rock 'n' Roll", type: "stall" }, { name: "Blunt Stall", type: "stall" },
  { name: "Nosepick", type: "stall" }, { name: "Tail Stall", type: "stall" },
  { name: "FS Disaster", type: "stall" }, { name: "BS Disaster", type: "stall" },

  // --- FLIPS ---
  { name: "Ollie", type: "flip" }, { name: "Kickflip", type: "flip" }, { name: "Heelflip", type: "flip" },
  { name: "FS 180", type: "flip" }, { name: "BS 180", type: "flip" }, { name: "Tre Flip", type: "flip" },
  { name: "Hardflip", type: "flip" }, { name: "Caballerial", type: "flip" }, { name: "Half Cab", type: "flip" },

  // --- GRABS ---
  { name: "Indy Air", type: "grab" }, { name: "Melon Air", type: "grab" }, { name: "Mute Air", type: "grab" },
  { name: "Stalefish", type: "grab" }, { name: "Method Air", type: "grab" }, { name: "Crail Grab", type: "grab" },

  // --- DIVERS ---
  { name: "Boneless", type: "other" }, { name: "Manual", type: "other" }, { name: "Hippy Jump", type: "other" }
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

  const removePlayer = (id, name) => {
    if (window.confirm(`Supprimer ${name} ?`)) {
      remove(ref(database, `${path}/players/${id}`));
      addLog(`${name} a quitté`, 'quit');
    }
  };

  const resetLogs = () => {
    if (prompt("Mot de passe root :") === 'root') set(ref(database, `${path}/logs`), null);
  };

  const getLogColor = (type) => ({
    grind: '#ffcc00', slide: '#ff9933', grab: '#ff4d4d', flip: '#00d0ff', 
    stall: '#bfbfbf', join: '#4ade80', quit: '#ff4d4d', error: '#800080'
  }[type] || '#fff');

  return (
    <div style={{ minHeight: '100vh', backgroundImage: 'url("https://images.unsplash.com/photo-1547448415-e9f5b97e5112?w=1600")', backgroundSize: 'cover', backgroundAttachment: 'fixed', padding: '20px' }}>
      <div className="card" style={{ paddingTop: '80px', background: 'rgba(0,0,0,0.85)', color: '#fff', position: 'relative' }}>
        <button onClick={onLeave} className="btn-danger" style={{ position: 'absolute', top: '20px', left: '20px' }}>↩</button>
        <h2 style={{ textAlign: 'center' }}>Mini-Rampe 🛹</h2>

        <button onClick={() => setIsAddOpen(!isAddOpen)} className="btn-primary" style={{ width: '100%', marginBottom: '10px' }}>{isAddOpen ? 'Fermer' : '+ Ajouter Skateur'}</button>
        {isAddOpen && (
          <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
            <input value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Nom..." style={{ flex: 1, padding: '10px', borderRadius: '4px' }} />
            <button onClick={addPlayer} className="btn-primary">OK</button>
          </div>
        )}

        {players.map(p => (
          <div key={p.id} style={{ background: '#222', padding: '10px', marginBottom: '5px', borderRadius: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>🛹 {p.name}</span>
              <button onClick={() => removePlayer(p.id, p.name)} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer' }}>✖</button>
            </div>
            <PlayerControls player={p} onLog={addLog} />
          </div>
        ))}

        <div style={{ background: '#111', padding: '10px', marginTop: '20px', borderRadius: '5px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Historique</h3>
            <button onClick={resetLogs} style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#000', color: '#fff', border: '1px solid #fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span>↶</span>
            </button>
          </div>
          {logs.map((log, i) => (
            <p key={i} style={{ color: getLogColor(log.type), fontSize: '0.85rem' }}>
              [{new Date(log.timestamp).toLocaleDateString()}] {log.message}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlayerControls({ player, onLog }) {
  const [s, setS] = useState(""); const [t, setT] = useState(null);
  return (
    <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
      <select value={s} onChange={(e) => setS(e.target.value)} style={{ flex: 1 }}><option value="">Stance</option>{STANCES.map(st => <option key={st} value={st}>{st}</option>)}</select>
      <select value={t ? JSON.stringify(t) : ""} onChange={(e) => setT(JSON.parse(e.target.value))} style={{ flex: 2 }}><option value="">Trick</option>{TRICKS_LIST.map(tr => <option key={tr.name} value={JSON.stringify(tr)}>{tr.name}</option>)}</select>
      <button onClick={() => { if(s && t) { onLog(`🛹 ${player.name} : ${s} ${t.name}`, t.type); setS(""); setT(null); }}} className="btn-primary">OK</button>
    </div>
  );
}
