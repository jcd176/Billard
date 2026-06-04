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
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear()).slice(-2)}`;
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
        if (
          prevLeaderIdRef.current !== null && 
          prevLeaderIdRef.current !== currentLeader.id &&
          now - lastLeaderAnnouncementRef.current > 5000 
        ) {
          addLog(`${currentLeader.name} Passe en tête !`, 'leader');
          lastLeaderAnnouncementRef.current = now;
        }
        prevLeaderIdRef.current = currentLeader.id;
      }
      setPlayers(sorted);
    });

    const matchesRef = ref(database, `rooms/${roomId}/matches`);
    const unsubscribeMatches = onValue(matchesRef, (snapshot) => {
      setMatches(snapshot.val() || {});
    });

    const logsRef = ref(database, `rooms/${roomId}/logs`);
    const unsubscribeLogs = onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, log]) => ({ id, ...log })) : [];
      setLogs(list.reverse().slice(0, 10));
    });

    return () => { unsubscribePlayers(); unsubscribeMatches(); unsubscribeLogs(); };
  }, [roomId]);

  const addLog = (message, type) => {
    push(ref(database, `rooms/${roomId}/logs`), { message, type, timestamp: Date.now() });
  };

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

    // Création de la clé unique pour le duel, ex: "id1_vs_id2"
    const ids = [winner, loser].sort();
    const matchKey = ids.join('_vs_');
    
    // On récupère les infos existantes pour incrémenter
    const existing = matches[matchKey] || { p1Id: ids[0], p2Id: ids[1], wins: 0 };
    
    update(ref(database, `rooms/${roomId}/matches/${matchKey}`), {
      p1Id: ids[0],
      p2Id: ids[1],
      wins: (existing.wins || 0) + 1
    });

    addLog(`MATCH:${wPlayer.name}|${lPlayer.name}`, 'match');
    setWinner(''); setLoser('');
  };

  // ... (fonctions resetLogs, resetRanking, resetMatches, adjustScore, removePlayer restent inchangées)
  
  // Note: Pour des raisons de concision, j'ai omis de répéter les fonctions reset 
  // car elles sont identiques à votre code d'origine.

  return (
    <div className="card">
      {/* ... (début du rendu inchangé jusqu'au Suivi des rencontres) */}
      
      <h3>Suivi des rencontres :</h3>
      <div style={{ background: '#222', padding: '10px', borderRadius: '5px' }}>
        {Object.values(matches).map((m, i) => {
          // Récupération des noms depuis la liste des joueurs chargés
          const p1 = players.find(p => p.id === m.p1Id);
          const p2 = players.find(p => p.id === m.p2Id);
          if (!p1 || !p2) return null;

          return (
            <div key={i} style={{ borderBottom: '1px solid #444', padding: '10px 5px' }}>
              👑 <strong>{p1.name}</strong> vs 🎱 <strong>{p2.name}</strong> 
              <span style={{ marginLeft: '10px', color: '#FFD700' }}>
                Score global : {m.wins} victoire(s)
              </span>
            </div>
          );
        })}
      </div>
      
      {/* ... (reste du code pour l'historique) */}
    </div>
  );
}
