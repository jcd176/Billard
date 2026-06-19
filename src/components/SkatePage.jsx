import React, { useState, useEffect } from 'react';
import { ref, onValue, push, remove, set } from 'firebase/database';
import { database } from '../services/firebase';

const TRICKS_LIST = [
  { name: "50-50 Grind", type: "grind" }, { name: "5-0 Grind", type: "grind" }, { name: "Smith Grind", type: "grind" }, 
  { name: "Feeble Grind", type: "grind" }, { name: "Crooked Grind", type: "grind" }, { name: "Overcrook", type: "grind" },
  { name: "Boardslide", type: "slide" }, { name: "Lipslide", type: "slide" }, { name: "Bluntslide", type: "slide" }, 
  { name: "Tailslide", type: "slide" }, { name: "Noseslide", type: "slide" }, { name: "Darkslide", type: "slide" },
  { name: "Indy Air", type: "grab" }, { name: "Melon Air", type: "grab" }, { name: "Mute Air", type: "grab" }, 
  { name: "Stalefish", type: "grab" }, { name: "Kickflip", type: "flip" }, { name: "Heelflip", type: "flip" }, 
  { name: "Tre Flip", type: "flip" }, { name: "Hardflip", type: "flip" }, { name: "Axle Stall", type: "stall" }, 
  { name: "Rock to Fakie", type: "stall" }, { name: "Rock 'n' Roll", type: "stall" }, { name: "Blunt Stall", type: "stall" }, 
  { name: "Boneless", type: "other" }, { name: "Manual", type: "other" }, { name: "Hippy Jump", type: "other" }
];

const STANCES = ["Normal", "Fakie", "Nollie", "Switch"];

export default function SkatePage({ roomId, onLeave }) {
  const [players, setPlayers] = useState([]);
  const [logs, setLogs] = useState([]);
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

  const resetLogs = () => {
    const password = prompt("Entrez le mot de passe 'root' :");
    if (password === 'root') {
      set(ref(database, `${path}/logs`), null);
    } else {
      addLog("Erreur: Mot de passe incorrect", "error");
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundImage: 'url("https://images.unsplash.com/photo-1547448415-e9f5b97e5112?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80")', backgroundSize: 'cover', backgroundAttachment: 'fixed', padding: '20px' }}>
      <div className="card" style={{ paddingTop: '80px', background: 'rgba(0,0,0,0.85)', color: '#fff' }}>
        <button onClick={onLeave} className="btn-danger" style={{ position: 'absolute', top: '20px', left: '20px' }}>↩</button>
        <h2 style={{ textAlign: 'center' }}>Session Mini-Rampe 🛹</h2>

        {players.map(p => (
          <div key={p.id} style={{ background: '#222', padding: '10px', marginBottom: '10px', borderRadius: '6px' }}>
            <span>🛹 {p.name}</span>
            <PlayerControls player={p} onLog={addLog} />
          </div>
        ))}

        <div style={{ background: '#1a1a1a', padding: '15px', marginTop: '20px', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3>Historique</h3>
            <button onClick={resetLogs} className="btn-danger">Réinitialiser</button>
          </div>
          {logs.map((log, i) => (
            <p key={i} style={{ color: log.type === 'grind' ? '#ffcc00' : log.type === 'slide' ? '#ff9933' : log.type === 'grab' ? '#ff4d4d' : log.type === 'flip' ? '#00d0ff' : log.type === 'stall' ? '#bfbfbf' : log.type === 'join' ? '#4ade80' : log.type === 'error' ? '#800080' : '#ff4d4d' }}>
              {log.message}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlayerControls({ player, onLog }) {
  const [stance, setStance] = useState("");
  const [trickObj, setTrickObj] = useState(null);

  return (
    <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
      <select value={stance} onChange={(e) => setStance(e.target.value)}><option value="">Stance</option>{STANCES.map(s => <option key={s} value={s}>{s}</option>)}</select>
      <select onChange={(e) => setTrickObj(JSON.parse(e.target.value))}><option value="">Trick</option>{TRICKS_LIST.map(t => <option key={t.name} value={JSON.stringify(t)}>{t.name}</option>)}</select>
      <button onClick={() => { if(stance && trickObj) { onLog(`🛹 ${player.name} : ${stance} ${trickObj.name}`, trickObj.type); setStance(""); setTrickObj(null); }}} className="btn-primary">OK</button>
    </div>
  );
}
