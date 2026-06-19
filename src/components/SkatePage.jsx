import React, { useState, useEffect } from 'react';
import { ref, onValue, push, remove, set } from 'firebase/database';
import { database } from '../services/firebase';

const TRICKS_LIST = [
  { name: "50-50 Grind", type: "grind" }, { name: "5-0 Grind", type: "grind" }, { name: "Smith Grind", type: "grind" }, 
  { name: "Feeble Grind", type: "grind" }, { name: "Crooked Grind", type: "grind" }, { name: "Boardslide", type: "slide" },
  { name: "Indy Air", type: "grab" }, { name: "Melon Air", type: "grab" }, { name: "Kickflip", type: "flip" }, 
  { name: "Tre Flip", type: "flip" }, { name: "Axle Stall", type: "stall" }, { name: "Rock to Fakie", type: "stall" }, 
  { name: "Boneless", type: "other" }, { name: "Manual", type: "other" }
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
    <div style={{ minHeight: '100vh', backgroundImage: 'url("https://images.unsplash.com/photo-1547448415-e9f5b97e5112?w=1600")', backgroundSize: 'cover', padding: '20px' }}>
      <div className="card" style={{ paddingTop: '80px', background: 'rgba(0,0,0,0.85)', color: '#fff', position: 'relative' }}>
        <button onClick={onLeave} style={{ position: 'absolute', top: '20px', left: '20px', background: '#ff4d4d', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '5px' }}>↩</button>
        <h2 style={{ textAlign: 'center' }}>Mini-Rampe 🛹</h2>

        <button onClick={() => setIsAddOpen(!isAddOpen)} className="btn-primary" style={{ width: '100%', marginBottom: '10px' }}>{isAddOpen ? 'Fermer' : '+ Ajouter Skateur'}</button>
        {isAddOpen && (
          <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
            <input value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Nom..." style={{ flex: 1 }} />
            <button onClick={addPlayer} className="btn-primary">OK</button>
          </div>
        )}

        {players.map(p => (
          <div key={p.id} style={{ background: '#222', padding: '10px', marginBottom: '5px', borderRadius: '5px' }}>
            <span>🛹 {p.name}</span>
            <PlayerControls player={p} onLog={addLog} />
          </div>
        ))}

        <div style={{ background: '#111', padding: '10px', marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><h3>Logs</h3><button onClick={resetLogs} style={{ background: 'none', border: 'none' }}>🗑️</button></div>
          {logs.map((log, i) => (
            <p key={i} style={{ color: getLogColor(log.type), fontSize: '0.85rem' }}>
              [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
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
      <select onChange={(e) => setS(e.target.value)} value={s}><option value="">Stance</option>{STANCES.map(st => <option key={st} value={st}>{st}</option>)}</select>
      <select onChange={(e) => setT(JSON.parse(e.target.value))} value={t ? JSON.stringify(t) : ""}><option value="">Trick</option>{TRICKS_LIST.map(tr => <option key={tr.name} value={JSON.stringify(tr)}>{tr.name}</option>)}</select>
      <button onClick={() => { if(s && t) { onLog(`🛹 ${player.name} : ${s} ${t.name}`, t.type); setS(""); setT(null); }}} className="btn-primary">OK</button>
    </div>
  );
}
