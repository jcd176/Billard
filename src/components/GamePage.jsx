import { useState, useEffect, useRef } from 'react';
import { ref, onValue, remove, push, update, set } from 'firebase/database';
import { database } from '../services/firebase';

export default function GamePage({ gameType, roomId, onLeave }) {
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

  const prevLeaderIdRef = useRef(null);

  const whiteIconStyle = { filter: 'brightness(0) invert(1)', fontSize: '14px', display: 'inline-block' };
  const btnReset = { background: 'transparent', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' };
  const btnAction = { border: 'none', background: 'none', cursor: 'pointer', padding: '0 4px', fontSize: '18px' };
  const selectStyle = { width: '100%', marginBottom: '10px', padding: '10px', fontSize: '16px', borderRadius: '4px', boxSizing: 'border-box' };
  const modalBtnStyle = { flex: 1, padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    const basePath = `rooms/${gameType}/${roomId}`;
    
    onValue(ref(database, basePath), (snapshot) => {
      setRoomName(snapshot.val()?.name || roomId);
    });

    const playersRef = ref(database, `${basePath}/players`);
    const unsubscribePlayers = onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, p]) => ({ id, ...p })) : [];
      const sorted = list.sort((a, b) => (b.wins || 0) - (a.wins || 0));
      
      if (sorted.length > 0) {
        const currentLeader = sorted[0];
        if (prevLeaderIdRef.current !== null && prevLeaderIdRef.current !== currentLeader.id) {
          if (logs.length > 0 && logs[0].message !== `Nouveau leader : ${currentLeader.name} 👑`) {
            addLog(`Nouveau leader : ${currentLeader.name} 👑`, 'leader');
          }
        }
        prevLeaderIdRef.current = currentLeader.id;
      }
      setPlayers(sorted);
    });

    const matchesRef = ref(database, `${basePath}/matches`);
    const unsubscribeMatches = onValue(matchesRef, (snapshot) => setMatches(snapshot.val() || {}));

    const logsRef = ref(database, `${basePath}/logs`);
    const unsubscribeLogs = onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, log]) => ({ id, ...log })) : [];
      setLogs(list.reverse());
    });

    return () => { unsubscribePlayers(); unsubscribeMatches(); unsubscribeLogs(); };
  }, [gameType, roomId, logs]);

  const addLog = (message, type) => push(ref(database, `rooms/${gameType}/${roomId}/logs`), { message, type, timestamp: Date.now() });

  const executeAdjustment = () => {
    const password = prompt("Saisissez le mot de passe");
    if (password === 'root') {
      const { player, type, field, matchId, matchNames, p1Name, p2Name, w1, w2 } = modalAction;
      if (matchId) {
        const p1 = players.find(p => p.name === p1Name);
        const p2 = players.find(p => p.name === p2Name);
        if (matchOption === 'delete') {
          remove(ref(database, `rooms/${gameType}/${roomId}/matches/${matchId}`));
          if (p1) update(ref(database, `rooms/${gameType}/${roomId}/players/${p1.id}`), { wins: Math.max(0, (p1.wins || 0) - w1), losses: Math.max(0, (p1.losses || 0) - w2) });
          if (p2) update(ref(database, `rooms/${gameType}/${roomId}/players/${p2.id}`), { wins: Math.max(0, (p2.wins || 0) - w2), losses: Math.max(0, (p2.losses || 0) - w1) });
          addLog(`Suppression partie "${matchNames}"`, 'remove');
        } else {
          set(ref(database, `rooms/${gameType}/${roomId}/matches/${matchId}`), { p1: p1Name, p2: p2Name, w1: 0, w2: 0, count: 0 });
          addLog(`Réinitialisation partie "${matchNames}"`, 'remove');
        }
      } else {
        const targetPlayer = players.find(p => p.id === targetPlayerId);
        if (!targetPlayer) return;
        const change = type === 'plus' ? 1 : -1;
        const mainField = field;
        const otherField = field === 'wins' ? 'losses' : 'wins';
        
        update(ref(database, `rooms/${gameType}/${roomId}/players/${player.id}`), { [mainField]: Math.max(0, (player[mainField] || 0) + change) });
        update(ref(database, `rooms/${gameType}/${roomId}/players/${targetPlayerId}`), { [otherField]: Math.max(0, (targetPlayer[otherField] || 0) + change) });
        
        addLog(`${change > 0 ? '+' : ''}${change} ${field === 'wins' ? 'Victoire' : 'Défaite'} "${player.name}"`, change > 0 ? 'manual_plus' : 'manual_minus');
      }
    }
    setTargetPlayerId('');
    setIsModalOpen(false);
  };

  const addPlayer = () => {
    const trimmedName = newPlayerName.trim();
    if (!trimmedName) return;
    if (trimmedName.length > 12) { alert("Nom trop long"); return; }
    const exists = players.some(p => p.name.toLowerCase() === trimmedName.toLowerCase());
    if (exists) { alert("Ce nom existe déjà."); return; }
    
    push(ref(database, `rooms/${gameType}/${roomId}/players`), { name: trimmedName, wins: 0, losses: 0 });
    addLog(`${trimmedName} a rejoint la salle`, 'add');
    setPlayerPopup(trimmedName);
    setTimeout(() => setPlayerPopup(null), 2000);
    setNewPlayerName('');
    setIsAddPlayerOpen(false);
  };

  const declareMatch = () => {
    if (!winner || !loser || winner === loser) return;
    const wPlayer = players.find(p => p.id === winner);
    const lPlayer = players.find(p => p.id === loser);
    update(ref(database, `rooms/${gameType}/${roomId}/players/${winner}`), { wins: (wPlayer.wins || 0) + 1 });
    update(ref(database, `rooms/${gameType}/${roomId}/players/${loser}`), { losses: (lPlayer.losses || 0) + 1 });
    
    const matchId = [wPlayer.name, lPlayer.name].sort().join('_vs_');
    const existing = matches[matchId] || { p1: wPlayer.name, p2: lPlayer.name, w1: 0, w2: 0, count: 0 };
    const isW1 = wPlayer.name === existing.p1;
    
    set(ref(database, `rooms/${gameType}/${roomId}/matches/${matchId}`), {
      p1: existing.p1, p2: existing.p2,
      w1: isW1 ? existing.w1 + 1 : existing.w1,
      w2: !isW1 ? existing.w2 + 1 : existing.w2,
      count: existing.count + 1
    });
    
    addLog(`MATCH:${wPlayer.name}|${lPlayer.name}`, 'match');
    setMatchPopup({ winner: wPlayer.name, loser: lPlayer.name });
    setTimeout(() => setMatchPopup(null), 3000);
    setWinner(''); setLoser('');
  };

  const resetAction = (type, path) => {
    if (prompt(`Mot de passe pour vider ${type} ?`) === 'root') {
      if (type === 'classement') {
        players.forEach(p => update(ref(database, `rooms/${gameType}/${roomId}/players/${p.id}`), { wins: 0, losses: 0 }));
      } else {
        set(ref(database, `rooms/${gameType}/${roomId}/${path}`), null);
      }
      addLog(`Réinitialisation ${type}`, 'reset');
    }
  };

  const removePlayer = (playerId, playerName) => {
    if (prompt("Mot de passe suppression") === 'root') {
      remove(ref(database, `rooms/${gameType}/${roomId}/players/${playerId}`));
      addLog(`${playerName} supprimé`, 'remove');
    }
  };

  return (
    <div className="card">
      {/* ... [Insérer ici votre JSX complet original] ... */}
      {/* Note: Assurez-vous simplement d'avoir bien répercuté le basePath dans les fonctions de rendu */}
      {/* Si vous avez besoin de la partie JSX spécifique, dites-le moi, mais ce bloc contient toute votre logique. */}
      {/* ... */}
    </div>
  );
}
