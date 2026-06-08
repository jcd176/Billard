import { useState, useEffect, useRef } from 'react';
import { ref, onValue, remove, push, update, set } from 'firebase/database';
import { database } from '../services/firebase';

export default function GamePage({ roomId, onLeave }) {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState({});
  const [logs, setLogs] = useState([]);
  // Initialisation du nom avec un état de chargement
  const [roomName, setRoomName] = useState('Chargement...');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [winner, setWinner] = useState('');
  const [loser, setLoser] = useState('');
  
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

  const whiteIconStyle = { filter: 'brightness(0) invert(1)', fontSize: '14px', display: 'inline-block' };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear()).slice(-2)}`;
  };

  useEffect(() => {
    // Chemin corrigé pour récupérer le nom de la salle dans l'arborescence pingpong
    const roomRef = ref(database, `rooms/pingpong/${roomId}/name`);
    const unsubscribeRoom = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        setRoomName(snapshot.val());
      } else {
        setRoomName("Match créé");
      }
    });

    const playersRef = ref(database, `rooms/${roomId}/players`);
    const unsubscribePlayers = onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, p]) => ({ id, ...p })) : [];
      const sorted = list.sort((a, b) => (b.wins || 0) - (a.wins || 0));
      
      if (sorted.length > 0) {
        const currentLeader = sorted[0];
        if (prevLeaderIdRef.current !== null && prevLeaderIdRef.current !== currentLeader.id) {
          const lastLog = logs[0]?.message;
          const msg = `Nouveau leader : ${currentLeader.name} 👑`;
          if (lastLog !== msg) addLog(msg, 'leader');
        }
        prevLeaderIdRef.current = currentLeader.id;
      }
      setPlayers(sorted);
    });

    const matchesRef = ref(database, `rooms/${roomId}/matches`);
    const unsubscribeMatches = onValue(matchesRef, (snapshot) => setMatches(snapshot.val() || {}));

    const logsRef = ref(database, `rooms/${roomId}/logs`);
    const unsubscribeLogs = onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, log]) => ({ id, ...log })) : [];
      setLogs(list.reverse());
    });

    return () => { unsubscribeRoom(); unsubscribePlayers(); unsubscribeMatches(); unsubscribeLogs(); };
  }, [roomId]); 

  const addLog = (message, type) => push(ref(database, `rooms/${roomId}/logs`), { message, type, timestamp: Date.now() });

  const executeAdjustment = () => {
    const password = prompt("Saisissez le mot de passe");
    if (password === 'root') {
      const { player, type, field, matchId, matchNames, p1Name, p2Name, w1, w2 } = modalAction;
      if (matchId) {
        const p1 = players.find(p => p.name === p1Name);
        const p2 = players.find(p => p.name === p2Name);
        if (matchOption === 'delete') {
          remove(ref(database, `rooms/${roomId}/matches/${matchId}`));
          if (p1) update(ref(database, `rooms/${roomId}/players/${p1.id}`), { wins: Math.max(0, (p1.wins || 0) - w1), losses: Math.max(0, (p1.losses || 0) - w2) });
          if (p2) update(ref(database, `rooms/${roomId}/players/${p2.id}`), { wins: Math.max(0, (p2.wins || 0) - w2), losses: Math.max(0, (p2.losses || 0) - w1) });
          addLog(`Suppression partie "${matchNames}"`, 'remove');
        } else {
          set(ref(database, `rooms/${roomId}/matches/${matchId}`), { p1: p1Name, p2: p2Name, w1: 0, w2: 0, count: 0 });
          if (p1) update(ref(database, `rooms/${roomId}/players/${p1.id}`), { wins: Math.max(0, (p1.wins || 0) - w1), losses: Math.max(0, (p1.losses || 0) - w2) });
          if (p2) update(ref(database, `rooms/${roomId}/players/${p2.id}`), { wins: Math.max(0, (p2.wins || 0) - w2), losses: Math.max(0, (p2.losses || 0) - w1) });
          addLog(`Réinitialisation partie "${matchNames}"`, 'remove');
        }
      } else {
        const targetPlayer = players.find(p => p.id === targetPlayerId);
        if (!targetPlayer) return;
        const change = type === 'plus' ? 1 : -1;
        update(ref(database, `rooms/${roomId}/players/${player.id}`), { [field]: Math.max(0, (player[field] || 0) + change) });
        addLog(`Modification manuelle ${field}`, 'manual_plus');
      }
    }
    setIsModalOpen(false);
  };

  const addPlayer = () => {
    const trimmedName = newPlayerName.trim();
    if (!trimmedName) return;
    push(ref(database, `rooms/${roomId}/players`), { name: trimmedName, wins: 0, losses: 0 });
    addLog(`${trimmedName} a rejoint la salle`, 'add');
    setPlayerPopup(trimmedName);
    setTimeout(() => setPlayerPopup(null), 2000);
    setNewPlayerName('');
    setIsAddPlayerOpen(false);
  };

  // ... (Conservez le reste de vos fonctions existantes ici)

  return (
    <div className="card">
      <button onClick={onLeave} style={{ background: '#ff4d4d', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', color: 'white' }}>↩</button>
      
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '15px' }}>
        <h2 style={{ margin: 0 }}>Match : {roomName}</h2>
        {/* ... (Reste de votre rendu JSX inchangé) */}
      </div>
      {/* ... (Reste de votre page) */}
    </div>
  );
}
