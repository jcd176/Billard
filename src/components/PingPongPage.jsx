import { useState, useEffect, useRef } from 'react';
import { ref, onValue, remove, push, update, set } from 'firebase/database';
import { database } from '../services/firebase';

export default function PingPongPage({ roomId, onLeave }) {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState({});
  const [logs, setLogs] = useState([]);
  const [roomName, setRoomName] = useState('Chargement...');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [winner, setWinner] = useState('');
  const [loser, setLoser] = useState('');

  // États pour le mode Live
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
  const [liveP1Id, setLiveP1Id] = useState('');
  const [liveP2Id, setLiveP2Id] = useState('');
  const [scoreP1, setScoreP1] = useState(0);
  const [scoreP2, setScoreP2] = useState(0);

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

  const prevLeaderIdRef = useRef(null);
  const SPORT_ICON = '🏓';

  const whiteIconStyle = { filter: 'brightness(0) invert(1)', fontSize: '14px', display: 'inline-block' };
  const btnReset = { background: 'transparent', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' };
  const btnAction = { border: 'none', background: 'none', cursor: 'pointer', padding: '0 4px', fontSize: '18px' };
  const selectStyle = { width: '100%', marginBottom: '10px', padding: '10px', fontSize: '16px', borderRadius: '4px', boxSizing: 'border-box' };
  const modalBtnStyle = { flex: 1, padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear()).slice(-2)}`;
  };

  useEffect(() => {
    const roomRef = ref(database, `rooms/pingpong/${roomId}/name`);
    onValue(roomRef, (snapshot) => setRoomName(snapshot.exists() ? snapshot.val() : "Match créé"));

    const playersRef = ref(database, `rooms/${roomId}/players`);
    onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, p]) => ({ id, ...p })) : [];
      const sorted = list.sort((a, b) => (b.wins || 0) - (a.wins || 0));
      if (sorted.length > 0 && prevLeaderIdRef.current !== null && prevLeaderIdRef.current !== sorted[0].id) {
        addLog(`Nouveau leader : ${sorted[0].name} 👑`, 'leader');
      }
      prevLeaderIdRef.current = sorted[0]?.id || null;
      setPlayers(sorted);
    });

    const matchesRef = ref(database, `rooms/${roomId}/matches`);
    onValue(matchesRef, (snapshot) => setMatches(snapshot.val() || {}));

    const logsRef = ref(database, `rooms/${roomId}/logs`);
    onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, log]) => ({ id, ...log })) : [];
      setLogs(list.reverse());
    });
  }, [roomId]);

  const addLog = (message, type) => push(ref(database, `rooms/${roomId}/logs`), { message, type, timestamp: Date.now() });

  const finishLiveMatch = () => {
    if (!liveP1Id || !liveP2Id || liveP1Id === liveP2Id) return;
    const wId = scoreP1 > scoreP2 ? liveP1Id : liveP2Id;
    const lId = scoreP1 > scoreP2 ? liveP2Id : liveP1Id;
    const wPlayer = players.find(p => p.id === wId);
    const lPlayer = players.find(p => p.id === lId);

    update(ref(database, `rooms/${roomId}/players/${wId}`), { wins: (wPlayer.wins || 0) + 1 });
    update(ref(database, `rooms/${roomId}/players/${lId}`), { losses: (lPlayer.losses || 0) + 1 });
    addLog(`MATCH:${wPlayer.name}|${lPlayer.name} (${scoreP1}-${scoreP2})`, 'match');
    setIsLiveModalOpen(false);
    setScoreP1(0); setScoreP2(0);
  };

  const addPlayer = () => {
    const trimmedName = newPlayerName.trim();
    if (!trimmedName || players.some(p => p.name.toLowerCase() === trimmedName.toLowerCase())) return;
    push(ref(database, `rooms/${roomId}/players`), { name: trimmedName, wins: 0, losses: 0 });
    addLog(`${trimmedName} a rejoint la salle`, 'add');
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
      if (type === 'classement') players.forEach(p => update(ref(database, `rooms/${roomId}/players/${p.id}`), { wins: 0, losses: 0 }));
      else set(ref(database, `rooms/${roomId}/${path}`), null);
      addLog(`Réinitialisation de ${type} effectuée`, 'reset');
    }
  };

  const removePlayer = (playerId, playerName) => {
    if (prompt("Mot de passe suppression") === 'root') {
      remove(ref(database, `rooms/${roomId}/players/${playerId}`));
      addLog(`${playerName} a été supprimé`, 'remove');
    }
  };

  return (
    <div className="card">
      {/* Bouton Lancer Partie Live */}
      <button onClick={() => setIsLiveModalOpen(true)} style={{ width: '100%', padding: '12px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '5px', marginBottom: '15px', cursor: 'pointer' }}>
        {SPORT_ICON} Lancer une partie Live
      </button>

      {isLiveModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
          <h2 style={{ color: '#fff' }}>Match Live {SPORT_ICON}</h2>
          <div style={{ display: 'flex', gap: '20px', width: '100%', maxWidth: '400px' }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <select onChange={(e) => setLiveP1Id(e.target.value)} style={selectStyle}><option value="">J1</option>{players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
              <h1 style={{ fontSize: '60px', color: '#0f0' }}>{scoreP1}</h1>
              <button onClick={() => setScoreP1(s => s + 1)} style={{ padding: '10px 20px' }}>+</button>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <select onChange={(e) => setLiveP2Id(e.target.value)} style={selectStyle}><option value="">J2</option>{players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
              <h1 style={{ fontSize: '60px', color: '#f00' }}>{scoreP2}</h1>
              <button onClick={() => setScoreP2(s => s + 1)} style={{ padding: '10px 20px' }}>+</button>
            </div>
          </div>
          <button onClick={finishLiveMatch} style={{ marginTop: '30px', padding: '15px 30px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '5px' }}>Terminer Match</button>
          <button onClick={() => setIsLiveModalOpen(false)} style={{ marginTop: '10px', background: 'transparent', color: '#ccc', border: 'none' }}>Fermer</button>
        </div>
      )}

      <button onClick={onLeave} style={{ background: '#ff4d4d', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', marginBottom: '10px' }}>↩</button>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ margin: 0 }}>Match : {roomName}</h2>
        <button onClick={() => setIsAddPlayerOpen(!isAddPlayerOpen)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><span style={whiteIconStyle}>➕👤</span></button>
      </div>

      {isAddPlayerOpen && (
        <div style={{ background: '#333', padding: '10px', borderRadius: '5px', marginBottom: '10px' }}>
          <input value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Nom du joueur" style={{ width: '100%', padding: '8px', marginBottom: '5px' }} />
          <button onClick={addPlayer} style={{ width: '100%', padding: '5px' }}>Ajouter</button>
        </div>
      )}

      <div style={{ background: '#333', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
        <select value={winner} onChange={(e) => setWinner(e.target.value)} style={selectStyle}><option value="">👑 Vainqueur</option>{players.filter(p => p.id !== loser).map(p => <option key={p.id} value={p.id}>👑 {p.name}</option>)}</select>
        <select value={loser} onChange={(e) => setLoser(e.target.value)} style={selectStyle}><option value="">{SPORT_ICON} Perdant</option>{players.filter(p => p.id !== winner).map(p => <option key={p.id} value={p.id}>{SPORT_ICON} {p.name}</option>)}</select>
        <button onClick={declareMatch} className="btn-primary" style={{ width: '100%', padding: '10px' }}>Déclarer Match</button>
      </div>

      <h3>Classement :</h3>
      <table style={{ width: '100%', color: '#fff', borderCollapse: 'collapse' }}>
        <thead><tr style={{ borderBottom: '1px solid #444' }}><th>Joueur</th><th>Vict</th><th>Déf</th><th>%</th><th>{SPORT_ICON}</th></tr></thead>
        <tbody>
          {players.map((p, i) => (
            <tr key={p.id} style={{ borderBottom: '1px solid #222' }}>
              <td>{i === 0 && '👑 '}{p.name}</td>
              <td>{p.wins || 0}</td>
              <td>{p.losses || 0}</td>
              <td>{((p.wins || 0) + (p.losses || 0)) > 0 ? Math.round(((p.wins || 0) / ((p.wins || 0) + (p.losses || 0))) * 100) : 0}%</td>
              <td><button onClick={() => removePlayer(p.id, p.name)} style={btnAction}>{SPORT_ICON}</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Historique :</h3>
      <div style={{ background: '#111', padding: '10px', borderRadius: '5px', maxHeight: '200px', overflowY: 'auto', fontSize: '14px' }}>
        {logs.map(log => <div key={log.id} style={{ marginBottom: '5px' }}>{formatDate(log.timestamp)} {log.message}</div>)}
      </div>
    </div>
  );
}
