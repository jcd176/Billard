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

  const prevLeaderIdRef = useRef(null);
  const lastLeaderAnnouncementRef = useRef(0);

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    const playersRef = ref(database, `rooms/${roomId}/players`);
    const unsubscribePlayers = onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, p]) => ({ id, ...p })) : [];
      const sorted = list.sort((a, b) => (b.wins || 0) - (a.wins || 0));

      if (sorted.length > 0 && sorted[0].wins > 0) {
        const currentLeader = sorted[0];
        const now = Date.now();
        if (prevLeaderIdRef.current !== null && prevLeaderIdRef.current !== currentLeader.id && now - lastLeaderAnnouncementRef.current > 5000) {
          addLog(`👑 ${currentLeader.name} Passe en tête ! 👑`, 'leader');
          lastLeaderAnnouncementRef.current = now;
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
      setLogs(list.reverse().slice(0, 10));
    });

    return () => { unsubscribePlayers(); unsubscribeMatches(); unsubscribeLogs(); };
  }, [roomId]);

  const addLog = (message, type) => push(ref(database, `rooms/${roomId}/logs`), { message, type, timestamp: Date.now() });

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    push(ref(database, `rooms/${roomId}/players`), { name: newPlayerName, wins: 0, losses: 0 });
    addLog(`${newPlayerName} a rejoint la salle`, 'add');
    setNewPlayerName('');
  };

  const declareMatch = () => {
    if (!winner || !loser || winner === loser) return;
    const wPlayer = players.find(p => p.id === winner);
    const lPlayer = players.find(p => p.id === loser);
    update(ref(database, `rooms/${roomId}/players/${winner}`), { wins: (wPlayer.wins || 0) + 1 });
    update(ref(database, `rooms/${roomId}/players/${loser}`), { losses: (lPlayer.losses || 0) + 1 });

    const ids = [winner, loser].sort();
    const matchKey = ids.join('_vs_');
    const existing = matches[matchKey] || { p1Id: ids[0], p2Id: ids[1], p1Wins: 0, p2Wins: 0 };
    let p1Id = existing.p1Id, p2Id = existing.p2Id, p1Wins = existing.p1Wins || 0, p2Wins = existing.p2Wins || 0;
    if (winner === p1Id) p1Wins += 1; else p2Wins += 1;
    if (p2Wins > p1Wins) { [p1Id, p2Id] = [p2Id, p1Id]; [p1Wins, p2Wins] = [p2Wins, p1Wins]; }
    update(ref(database, `rooms/${roomId}/matches/${matchKey}`), {
      p1Id, p2Id, p1Name: players.find(p => p.id === p1Id).name, p2Name: players.find(p => p.id === p2Id).name, p1Wins, p2Wins
    });
    addLog(`MATCH:${wPlayer.name}|${lPlayer.name}`, 'match');
    setWinner(''); setLoser('');
  };

  const resetAction = (type, path) => {
    if (prompt(`Mot de passe pour vider ${type} ?`) === 'root') {
      set(ref(database, `rooms/${roomId}/${path}`), null);
      addLog(`Réinitialisation de ${type} effectuée`, 'reset');
    } else { addLog(`Échec réinitialisation ${type}`, 'error'); }
  };

  const adjustScore = (player, action, field) => {
    const otherPlayers = players.filter(p => p.id !== player.id);
    if (otherPlayers.length === 0) { alert("Aucun autre joueur disponible."); return; }
    
    const listString = otherPlayers.map(p => p.name).join('\n');
    const targetName = prompt(`Saisissez le nom du joueur à ajuster inversement parmi :\n\n${listString}`);
    const targetPlayer = otherPlayers.find(p => p.name === targetName);
    
    if (!targetPlayer) { alert("Nom incorrect."); return; }

    if (prompt("Saisissez le mot de passe") === 'root') {
      const val = action === 'plus' ? 1 : -1;
      
      update(ref(database, `rooms/${roomId}/players/${player.id}`), { [field]: Math.max(0, (player[field] || 0) + val) });
      update(ref(database, `rooms/${roomId}/players/${targetPlayer.id}`), { [field]: Math.max(0, (targetPlayer[field] || 0) - val) });
      
      const label = field === 'wins' ? 'Victoire' : 'Défaite';
      addLog(`${val > 0 ? '+' : ''}${val} ${label} "${player.name}" et ${-val > 0 ? '+' : ''}${-val} ${label} "${targetPlayer.name}"`, 'manual');
    } else {
      addLog(`Modification du Classement en échec`, 'error');
    }
  };

  const removePlayer = (playerId, playerName) => {
    if (prompt("Mot de passe suppression") === 'root') {
      remove(ref(database, `rooms/${roomId}/players/${playerId}`));
      addLog(`${playerName} a été supprimé`, 'remove');
    } else { addLog(`Suppression de "${playerName}" en échec`, 'error'); }
  };

  const btnReset = { background: 'transparent', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' };
  const btnAction = { border: 'none', background: 'none', cursor: 'pointer', padding: 0, fontSize: '20px' };
  const selectStyle = { width: '100
