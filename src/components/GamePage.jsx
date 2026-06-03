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

  // ... (formatDate, useEffect, addLog, addPlayer, reset, etc. restent identiques)
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
      setPlayers(list.sort((a, b) => (b.wins || 0) - (a.wins || 0)));
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

    // Gestion du suivi des rencontres
    const ids = [winner, loser].sort();
    const matchKey = ids.join('_vs_');
    const existing = matches[matchKey] || { 
      p1Id: ids[0], p2Id: ids[1], 
      p1Name: ids[0] === winner ? wPlayer.name : lPlayer.name,
      p2Name: ids[1] === winner ? wPlayer.name : lPlayer.name,
      p1Wins: 0, p2Wins: 0 
    };

    const updates = {};
    updates[`${matchKey}/p1Name`] = existing.p1Name;
    updates[`${matchKey}/p2Name`] = existing.p2Name;
    updates[`${matchKey}/p1Wins`] = existing.p1Wins + (ids[0] === winner ? 1 : 0);
    updates[`${matchKey}/p2Wins`] = existing.p2Wins + (ids[1] === winner ? 1 : 0);

    update(ref(database, `rooms/${roomId}/matches`), { [matchKey]: updates[matchKey] || { ...existing, 
      p1Wins: existing.p1Wins + (ids[0] === winner ? 1 : 0),
      p2Wins: existing.p2Wins + (ids[1] === winner ? 1 : 0)
    }});

    addLog(`MATCH:${wPlayer.name}|${lPlayer.name}`, 'match');
    setWinner(''); setLoser('');
  };

  const resetRanking = () => {
    if (prompt("Mot de passe pour vider tout le classement ?") === 'root') {
      set(ref(database, `rooms/${roomId}/players`), null);
      addLog("Classement réinitialisé !", 'reset');
    }
  };

  const resetMatches = () => {
    if (prompt("Mot de passe pour vider le suivi ?") === 'root') {
      set(ref(database, `rooms/${roomId}/matches`), null);
    }
  };

  const resetLogs = () => {
    if (prompt("Mot de passe pour vider l'historique ?") === 'root') {
      set(ref(database, `rooms/${roomId}/logs`), null);
    }
  };

  const adjustScore = (player, type, field) => {
    const newVal = type === 'plus' ? (player[field] || 0) + 1 : Math.max(0, (player[field] || 0) - 1);
    update(ref(database, `rooms/${roomId}/players/${player.id}`), { [field]: newVal });
    addLog(`Manuel ${type === 'plus' ? '+' : '-'}1 ${field} pour "${player.name}"`, 'manual');
  };

  const removePlayer = (playerId, playerName) => {
    if (prompt("Mot de passe ?") === 'root') {
      remove(ref(database, `rooms/${roomId}/players/${playerId}`));
    }
  };

  return (
    <div className="card">
      <button onClick={onLeave}>← Retour</button>
      <h2>Salle : {roomId}</h2>

      {/* Inputs, Selects, Classement... (partie identique à précédemment) */}
      
      {/* SECTION SUIVI DES RENCONTRES */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Suivi des rencontres :</h3>
        <button onClick={resetMatches} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>↻</button>
      </div>

      <table style={{ width: '100%', color: '#fff', borderCollapse: 'collapse', background: '#222' }}>
        <thead>
          <tr>
            <th style={{ padding: '8px' }}>Duel</th>
            <th>Vict</th><th>Déf</th><th>%Vict</th>
          </tr>
        </thead>
        <tbody>
          {Object.values(matches).map((m, i) => {
            const total = m.p1Wins + m.p2Wins;
            const p1Rate = total > 0 ? Math.round((m.p1Wins / total) * 100) : 0;
            const p2Rate = total > 0 ? Math.round((m.p2Wins / total) * 100) : 0;
            return (
              <>
                <tr key={`${i}-p1`} style={{ borderBottom: '1px solid #444' }}>
                  <td style={{ padding: '8px' }}>{m.p1Name}</td>
                  <td style={{ textAlign: 'center' }}>{m.p1Wins}</td>
                  <td style={{ textAlign: 'center' }}>{m.p2Wins}</td>
                  <td style={{ textAlign: 'center' }}>{p1Rate}%</td>
                </tr>
                <tr key={`${i}-p2`} style={{ borderBottom: '1px solid #666' }}>
                  <td style={{ padding: '8px' }}>{m.p2Name}</td>
                  <td style={{ textAlign: 'center' }}>{m.p2Wins}</td>
                  <td style={{ textAlign: 'center' }}>{m.p1Wins}</td>
                  <td style={{ textAlign: 'center' }}>{p2Rate}%</td>
                </tr>
              </>
            );
          })}
        </tbody>
      </table>

      {/* Historique... */}
    </div>
  );
}
