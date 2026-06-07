import { useState, useEffect, useRef } from 'react';
import { ref, onValue, remove, push, update, set } from 'firebase/database';
import { database } from '../services/firebase';

export default function GamePage({ roomId, onLeave }) {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState({});
  const [logs, setLogs] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [winner, setWinner] = useState('');
  const [loser, setLoser] = useState('');
  const [roomName, setRoomName] = useState('Chargement...');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [targetPlayerId, setTargetPlayerId] = useState('');
  const [matchOption, setMatchOption] = useState('delete');
  const [matchPopup, setMatchPopup] = useState(null);
  const [playerPopup, setPlayerPopup] = useState(null);

  const [showRanking, setShowRanking] = useState(true);
  const [showMatches, setShowMatches] = useState(true);
  const [showHistory, setShowHistory] = useState(true);

  const btnReset = { background: 'transparent', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' };
  const btnAction = { border: 'none', background: 'none', cursor: 'pointer', padding: '0 4px', fontSize: '18px' };
  const selectStyle = { width: '100%', marginBottom: '10px', padding: '10px', fontSize: '16px', borderRadius: '4px', boxSizing: 'border-box' };
  const modalBtnStyle = { flex: 1, padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' };

  useEffect(() => {
    // Récupération du nom de la salle (corrigé)
    const roomRef = ref(database, `rooms/${roomId}`);
    onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      setRoomName(data?.name || "Salle sans nom");
    });

    const playersRef = ref(database, `rooms/${roomId}/players`);
    const unsubscribePlayers = onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, p]) => ({ id, ...p })) : [];
      setPlayers(list.sort((a, b) => (b.wins || 0) - (a.wins || 0)));
    });

    const matchesRef = ref(database, `rooms/${roomId}/matches`);
    const unsubscribeMatches = onValue(matchesRef, (snapshot) => setMatches(snapshot.val() || {}));

    const logsRef = ref(database, `rooms/${roomId}/logs`);
    const unsubscribeLogs = onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, log]) => ({ id, ...log })) : [];
      setLogs(list.reverse());
    });

    return () => { unsubscribePlayers(); unsubscribeMatches(); unsubscribeLogs(); };
  }, [roomId]);

  const addLog = (message, type) => push(ref(database, `rooms/${roomId}/logs`), { message, type, timestamp: Date.now() });

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    push(ref(database, `rooms/${roomId}/players`), { name: newPlayerName.trim(), wins: 0, losses: 0 });
    setNewPlayerName(''); setIsAddPlayerOpen(false);
  };

  const declareMatch = () => {
    if (!winner || !loser || winner === loser) return;
    const wPlayer = players.find(p => p.id === winner);
    const lPlayer = players.find(p => p.id === loser);
    update(ref(database, `rooms/${roomId}/players/${winner}`), { wins: (wPlayer.wins || 0) + 1 });
    update(ref(database, `rooms/${roomId}/players/${loser}`), { losses: (lPlayer.losses || 0) + 1 });
    addLog(`MATCH:${wPlayer.name}|${lPlayer.name}`, 'match');
    setWinner(''); setLoser('');
  };

  const resetAction = (type, path) => {
    if (prompt(`Mot de passe pour vider ${type} ?`) === 'root') {
      set(ref(database, `rooms/${roomId}/${path}`), null);
      addLog(`Réinitialisation de ${type}`, 'reset');
    }
  };

  const removePlayer = (playerId, playerName) => {
    if (prompt("Mot de passe suppression") === 'root') {
      remove(ref(database, `rooms/${roomId}/players/${playerId}`));
    }
  };

  return (
    <div className="card">
      {/* Bouton Retour style capture */}
      <button onClick={onLeave} style={{ background: '#ff4d4d', border: 'none', borderRadius: '50%', width: '45px', height: '45px', cursor: 'pointer', color: '#fff', fontSize: '24px', marginBottom: '10px' }}>&#8617;</button>
      
      {/* Header : Nom de salle et bouton ajout */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ margin: 0 }}>Salle : {roomName}</h2>
        <button onClick={() => setIsAddPlayerOpen(!isAddPlayerOpen)} style={{ background: '#333', color: '#fff', border: '1px solid #555', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>
          + Ajouter un joueur
        </button>
      </div>

      {isAddPlayerOpen && (
        <div style={{ marginBottom: '15px', background: '#333', padding: '10px', borderRadius: '5px' }}>
          <input value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Nom" style={{ width: '70%', padding: '8px' }} />
          <button onClick={addPlayer} style={{ marginLeft: '10px', padding: '8px' }}>OK</button>
        </div>
      )}

      {/* Interface de match */}
      <div style={{ background: '#333', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
        <select value={winner} onChange={(e) => setWinner(e.target.value)} style={selectStyle}>
          <option value="">👑 Vainqueur</option>
          {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={loser} onChange={(e) => setLoser(e.target.value)} style={selectStyle}>
          <option value="">🎱 Perdant</option>
          {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button onClick={declareMatch} style={{ width: '100%', padding: '10px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px' }}>Déclarer Match</button>
      </div>

      {/* Sections Classement / Matchs / Historique */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Classement :</h3>
        <button onClick={() => resetAction('classement', 'players')} style={btnReset}>↻</button>
      </div>
      
      {showRanking && (
        <table style={{ width: '100%', color: '#fff' }}>
            <thead><tr><th>Joueur</th><th>Vict</th><th>Déf</th><th></th></tr></thead>
            <tbody>
            {players.map(p => (
                <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.wins || 0}</td>
                    <td>{p.losses || 0}</td>
                    <td><button onClick={() => removePlayer(p.id, p.name)} style={btnAction}>🗑️</button></td>
                </tr>
            ))}
            </tbody>
        </table>
      )}

      <h3>Suivi des rencontres :</h3>
      <button onClick={() => resetAction('suivi', 'matches')} style={btnReset}>↻</button>
      <div style={{ background: '#222', padding: '10px', borderRadius: '5px' }}>
        {Object.entries(matches).map(([id, m]) => (
            <div key={id}>{m.p1} vs {m.p2}</div>
        ))}
      </div>
      
      <h3>Historique :</h3>
      <button onClick={() => resetAction('historique', 'logs')} style={btnReset}>↻</button>
      <div style={{ background: '#111', padding: '10px', borderRadius: '5px', maxHeight: '200px', overflowY: 'auto' }}>
        {logs.map(log => <div key={log.id}>{log.message}</div>)}
      </div>
    </div>
  );
}
