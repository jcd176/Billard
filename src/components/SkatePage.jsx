import { useState, useEffect } from 'react';
import { ref, onValue, push, update, set } from 'firebase/database';
import { database } from '../services/firebase';

const TRICKS_LIST = [
  "Ollie", "FS 180", "BS 180", "Kickflip", "Heelflip", 
  "Rock to Fakie", "Rock 'n' Roll", "Axle Stall", "50-50", "5-0"
];

export default function SkatePage({ roomId, onLeave }) {
  const path = `rooms/skate/${roomId}`;
  const [players, setPlayers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [attackerId, setAttackerId] = useState('');
  const [defenderId, setDefenderId] = useState('');
  const [trick, setTrick] = useState('');

  useEffect(() => {
    // Écoute des joueurs
    const playersRef = ref(database, `${path}/players`);
    onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      setPlayers(data ? Object.entries(data).map(([id, p]) => ({ id, ...p })) : []);
    });
    
    // Écoute des logs
    const logsRef = ref(database, `${path}/logs`);
    onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      setLogs(data ? Object.entries(data).map(([id, l]) => ({ id, ...l })).reverse() : []);
    });
  }, [path]);

  const recordBail = (playerId) => {
    const player = players.find(p => p.id === playerId);
    const newLetters = (player.letters || 0) + 1;
    update(ref(database, `${path}/players/${playerId}`), { letters: newLetters });
    push(ref(database, `${path}/logs`), { 
      message: `${player.name} a pris une lettre (${"SKATE".substring(0, newLetters)})`, 
      timestamp: Date.now() 
    });
  };

  return (
    <div className="card">
      <button onClick={onLeave}>↩ Retour</button>
      <h2>🛹 Session Mini-Rampe</h2>

      {/* Zone de jeu */}
      <div style={{ background: '#333', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <select onChange={(e) => setTrick(e.target.value)} value={trick}>
          <option value="">Sélectionner le Trick</option>
          {TRICKS_LIST.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        
        <div style={{ marginTop: '10px' }}>
          <p>Le défenseur a raté le <strong>{trick || '...'}</strong> ?</p>
          {players.map(p => (
            <button key={p.id} onClick={() => recordBail(p.id)} style={{ margin: '5px' }}>
              Bail : {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Classement */}
      <h3>Scoreboard</h3>
      {players.map(p => (
        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #444' }}>
          <span>{p.name}</span>
          <span style={{ color: '#ffcc00', fontWeight: 'bold' }}>{"SKATE".substring(0, p.letters || 0)}</span>
        </div>
      ))}
    </div>
  );
}
