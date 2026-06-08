import { useState, useEffect, useRef } from 'react';
import { ref, onValue, remove, push, update, set } from 'firebase/database';
import { database } from '../services/firebase';

export default function GamePage({ roomId, onLeave }) {
  // Chemin racine pour le pingpong
  const basePath = `rooms/pingpong/${roomId}`;

  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState({});
  const [logs, setLogs] = useState([]);
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
    if (!roomId) return;

    // Chargement du nom
    const roomRef = ref(database, `${basePath}/name`);
    const unsubscribeRoom = onValue(roomRef, (snapshot) => {
      setRoomName(snapshot.exists() ? snapshot.val() : "Match créé");
    });

    // Chargement des joueurs
    const playersRef = ref(database, `${basePath}/players`);
    const unsubscribePlayers = onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, p]) => ({ id, ...p })) : [];
      const sorted = list.sort((a, b) => (b.wins || 0) - (a.wins || 0));
      
      if (sorted.length > 0) {
        const currentLeader = sorted[0];
        if (prevLeaderIdRef.current !== null && prevLeaderIdRef.current !== currentLeader.id) {
          addLog(`Nouveau leader : ${currentLeader.name} 👑`, 'leader');
        }
        prevLeaderIdRef.current = currentLeader.id;
      }
      setPlayers(sorted);
    });

    // Chargement des matches
    const matchesRef = ref(database, `${basePath}/matches`);
    const unsubscribeMatches = onValue(matchesRef, (snapshot) => setMatches(snapshot.val() || {}));

    // Chargement des logs
    const logsRef = ref(database, `${basePath}/logs`);
    const unsubscribeLogs = onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, log]) => ({ id, ...log })) : [];
      setLogs(list.reverse());
    });

    return () => { unsubscribeRoom(); unsubscribePlayers(); unsubscribeMatches(); unsubscribeLogs(); };
  }, [roomId]);

  // Fonctions utilisant basePath pour pointer au bon endroit
  const addLog = (message, type) => push(ref(database, `${basePath}/logs`), { message, type, timestamp: Date.now() });

  const executeAdjustment = () => {
    const password = prompt("Saisissez le mot de passe");
    if (password === 'root') {
      const { player, type, field, matchId, matchNames, p1Name, p2Name, w1, w2 } = modalAction;
      if (matchId) {
        const p1 = players.find(p => p.name === p1Name);
        const p2 = players.find(p => p.name === p2Name);
        if (matchOption === 'delete') {
          remove(ref(database, `${basePath}/matches/${matchId}`));
          if (p1) update(ref(database, `${basePath}/players/${p1.id}`), { wins: Math.max(0, (p1.wins || 0) - w1), losses: Math.max(0, (p1.losses || 0) - w2) });
          if (p2) update(ref(database, `${basePath}/players/${p2.id}`), { wins: Math.max(0, (p2.wins || 0) - w2), losses: Math.max(0, (p2.losses || 0) - w1) });
          addLog(`Suppression partie "${matchNames}"`, 'remove');
        } else {
          set(ref(database, `${basePath}/matches/${matchId}`), { p1: p1Name, p2: p2Name, w1: 0, w2: 0, count: 0 });
          addLog(`Réinitialisation partie "${matchNames}"`, 'remove');
        }
      } else {
        const targetPlayer = players.find(p => p.id === targetPlayerId);
        if (!targetPlayer) return;
        const change = type === 'plus' ? 1 : -1;
        update(ref(database, `${basePath}/players/${player.id}`), { [field]: Math.max(0, (player[field] || 0) + change) });
        update(ref(database, `${basePath}/players/${targetPlayerId}`), { [field === 'wins' ? 'losses' : 'wins']: Math.max(0, (targetPlayer[field === 'wins' ? 'losses' : 'wins'] || 0) + change) });
        addLog(`Modification manuelle`, 'manual_plus');
      }
    }
    setIsModalOpen(false);
  };

  const addPlayer = () => {
    const trimmedName = newPlayerName.trim();
    if (!trimmedName) return;
    push(ref(database, `${basePath}/players`), { name: trimmedName, wins: 0, losses: 0 });
    addLog(`${trimmedName} a rejoint la salle`, 'add');
    setNewPlayerName('');
    setIsAddPlayerOpen(false);
  };

  const declareMatch = () => {
    if (!winner || !loser || winner === loser) return;
    const wPlayer = players.find(p => p.id === winner);
    const lPlayer = players.find(p => p.id === loser);
    update(ref(database, `${basePath}/players/${winner}`), { wins: (wPlayer.wins || 0) + 1 });
    update(ref(database, `${basePath}/players/${loser}`), { losses: (lPlayer.losses || 0) + 1 });
    const matchId = [wPlayer.name, lPlayer.name].sort().join('_vs_');
    const existing = matches[matchId] || { p1: wPlayer.name, p2: lPlayer.name, w1: 0, w2: 0, count: 0 };
    set(ref(database, `${basePath}/matches/${matchId}`), {
      p1: existing.p1, p2: existing.p2,
      w1: wPlayer.name === existing.p1 ? existing.w1 + 1 : existing.w1,
      w2: wPlayer.name !== existing.p1 ? existing.w2 + 1 : existing.w2,
      count: existing.count + 1
    });
    addLog(`MATCH:${wPlayer.name}|${lPlayer.name}`, 'match');
    setWinner(''); setLoser('');
  };

  const resetAction = (type, path) => {
    if (prompt(`Mot de passe pour vider ${type} ?`) === 'root') {
      if (type === 'classement') players.forEach(p => update(ref(database, `${basePath}/players/${p.id}`), { wins: 0, losses: 0 }));
      else set(ref(database, `${basePath}/${path}`), null);
      addLog(`Réinitialisation de ${type}`, 'reset');
    }
  };

  const removePlayer = (playerId, playerName) => {
    if (prompt("Mot de passe suppression") === 'root') {
      remove(ref(database, `${basePath}/players/${playerId}`));
      addLog(`${playerName} supprimé`, 'remove');
    }
  };

  // ... (Conservez votre rendu JSX actuel, il est correct)
  return (
    <div className="card">
      <button onClick={onLeave}>↩</button>
      <h2>Match : {roomName}</h2>
      {/* ... reste de votre JSX ... */}
    </div>
  );
}
