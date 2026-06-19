import { useState, useEffect, useRef } from 'react';
import { ref, onValue, remove, push, update, set } from 'firebase/database';
import { database } from '../services/firebase';

const TRICKS_LIST = [
  "Ollie", "FS 180", "BS 180", "Kickflip", "Heelflip", 
  "Rock to Fakie", "Rock 'n' Roll", "Axle Stall", "Tail Stall",
  "Disaster", "50-50", "5-0", "Smith Grind", "Feeble Grind",
  "Blunt Stall", "BS Nosepick", "Tail Drop"
];

export default function SkatePage({ roomId, onLeave }) {
  const path = `rooms/skate/${roomId}`;
  
  const [players, setPlayers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  
  // États Skate Game
  const [attacker, setAttacker] = useState('');
  const [defender, setDefender] = useState('');
  const [selectedTrick, setSelectedTrick] = useState('');
  const [isLanded, setIsLanded] = useState(true);

  // --- Initialisation ---
  useEffect(() => {
    const playersRef = ref(database, `${path}/players`);
    const unsubscribePlayers = onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, p]) => ({ id, ...p })) : [];
      setPlayers(list.sort((a, b) => (b.score || 0) - (a.score || 0)));
    });

    const logsRef = ref(database, `${path}/logs`);
    onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      setLogs(data ? Object.entries(data).map(([id, log]) => ({ id, ...log })).reverse() : []);
    });

    return () => unsubscribePlayers();
  }, [path]);

  const addLog = (message, type) => push(ref(database, `${path}/logs`), { message, type, timestamp: Date.now() });

  const processSkateGame = () => {
    if (!attacker || !defender || attacker === defender || !selectedTrick) return;
    
    const defPlayer = players.find(p => p.id === defender);
    
    if (isLanded) {
      addLog(`${attacker} a rentré un ${selectedTrick}. ${defender} doit le refaire.`, 'match');
    } else {
      // Le défenseur a raté : il gagne une lettre
      const currentLetters = defPlayer.letters || 0;
      const newLetters = currentLetters + 1;
      update(ref(database, `${path}/players/${defender}`), { letters: newLetters });
      
      if (newLetters >= 5) {
        addLog(`${defender} a atteint S-K-A-T-E ! Il perd la partie contre ${attacker}.`, 'remove');
        update(ref(database, `${path}/players/${attacker}`), { wins: (attacker.wins || 0) + 1 });
      } else {
        addLog(`${defender} a bail le ${selectedTrick} (Lettre: ${"SKATE".substring(0, newLetters)})`, 'error');
      }
    }
    setAttacker(''); setDefender(''); setSelectedTrick('');
  };

  return (
    <div className="card" style={{ color: '#fff', padding: '20px', background: '#1a1a1a' }}>
      <h2>🛹 Session Mini-Rampe</h2>
      
      {/* Zone de Jeu */}
      <div style={{ background: '#333', padding: '15px', borderRadius: '10px' }}>
        <select onChange={(e) => setAttacker(e.target.value)} value={attacker} style={{width:'100%', padding: '10px', marginBottom: '10px'}}>
          <option value="">Qui attaque ?</option>
          {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <select onChange={(e) => setSelectedTrick(e.target.value)} value={selectedTrick} style={{width:'100%', padding: '10px', marginBottom: '10px'}}>
          <option value="">Quel Trick ?</option>
          {TRICKS_LIST.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <select onChange={(e) => setDefender(e.target.value)} value={defender} style={{width:'100%', padding: '10px', marginBottom: '10px'}}>
          <option value="">Qui défend ?</option>
          {players.filter(p => p.id !== attacker).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => {setIsLanded(true); processSkateGame();}} style={{flex:1, background: '#28a745'}}>Landed ✅</button>
          <button onClick={() => {setIsLanded(false); processSkateGame();}} style={{flex:1, background: '#dc3545'}}>Bailed ❌</button>
        </div>
      </div>

      {/* Classement */}
      <table style={{ width: '100%', marginTop: '20px' }}>
        <thead><tr><th>Skater</th><th>Lettres</th><th>Wins</th></tr></thead>
        <tbody>
          {players.map(p => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td style={{color: '#ffc107', fontWeight: 'bold'}}>{"SKATE".substring(0, p.letters || 0)}</td>
              <td>{p.wins || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={onLeave} style={{marginTop: '20px', width: '100%'}}>Quitter la session</button>
    </div>
  );
}
