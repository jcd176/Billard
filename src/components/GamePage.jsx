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

    const ids = [winner, loser].sort();
    const matchKey = ids.join('_vs_');
    const existing = matches[matchKey] || { p1Id: ids[0], p2Id: ids[1], p1Name: '', p2Name: '', p1Wins: 0, p2Wins: 0 };
    
    let p1Id = existing.p1Id;
    let p2Id = existing.p2Id;
    let p1Wins = existing.p1Wins || 0;
    let p2Wins = existing.p2Wins || 0;

    if (winner === p1Id) p1Wins += 1; else p2Wins += 1;

    if (p2Wins > p1Wins) {
      const tempId = p1Id; p1Id = p2Id; p2Id = tempId;
      const tempWins = p1Wins; p1Wins = p2Wins; p2Wins = tempWins;
    }

    update(ref(database, `rooms/${roomId}/matches/${matchKey}`), {
      p1Id, p2Id, p1Name: players.find(p => p.id === p1Id).name, p2Name: players.find(p => p.id === p2Id).name, p1Wins, p2Wins
    });

    addLog(`MATCH:${wPlayer.name}|${lPlayer.name}`, 'match');
    setWinner(''); setLoser('');
  };

  const resetLogs = () => { if (prompt("Mot de passe ?") === 'root') { set(ref(database, `rooms/${roomId}/logs`), null); addLog("Historique vidé", 'reset'); } };
  const resetRanking = () => { if (prompt("Mot de passe ?") === 'root') { set(ref(database, `rooms/${roomId}/players`), null); addLog("Classement vidé", 'reset'); } };
  const resetMatches = () => { if (prompt("Mot de passe ?") === 'root') { set(ref(database, `rooms/${roomId}/matches`), null); addLog("Suivi vidé", 'reset'); } };

  const adjustScore = (player, type, field) => {
    const newVal = type === 'plus' ? (player[field] || 0) + 1 : Math.max(0, (player[field] || 0) - 1);
    update(ref(database, `rooms/${roomId}/players/${player.id}`), { [field]: newVal });
    addLog(`Manuel: ${type === 'plus' ? '+' : '-'}1 ${field} pour ${player.name}`, 'manual');
  };

  const removePlayer = (playerId, playerName) => {
    if (prompt("Mot de passe ?") === 'root') {
      remove(ref(database, `rooms/${roomId}/players/${playerId}`));
      addLog(`${playerName} supprimé`, 'remove');
    } else {
      addLog(`Suppression ${playerName} échec`, 'error');
    }
  };

  return (
    <div className="card">
      <button onClick={onLeave} style={{ marginBottom: '10px' }}>← Retour</button>
      <h2>Salle : {roomId}</h2>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '5px' }}>
        <input value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Nom du joueur" />
        <button onClick={addPlayer} className="btn-primary">Ajouter</button>
      </div>

      <div style={{ background: '#333', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
        <select value={winner} onChange={(e) => setWinner(e.target.value)} style={{ width: '100%', marginBottom: '10px', padding: '10px' }}>
          <option value="">👑 Vainqueur</option>
          {players.map(p => <option key={p.id} value={p.id}>👑 {p.name}</option>)}
        </select>
        <select value={loser} onChange={(e) => setLoser(e.target.value)} style={{ width: '100%', marginBottom: '10px', padding: '10px' }}>
          <option value="">🎱 Perdant</option>
          {players.map(p => <option key={p.id} value={p.id}>🎱 {p.name}</option>)}
        </select>
        <button onClick={declareMatch} className="btn-primary" style={{ width: '100%', padding: '10px' }}>Déclarer Match</button>
      </div>

      <h3>Classement :</h3>
      <table style={{ width: '100%', color: '#fff', borderCollapse: 'collapse' }}>
        <thead><tr><th>Joueur</th><th>Vict</th><th>Déf</th><th></th></tr></thead>
        <tbody>
          {players.map((p, i) => (
            <tr key={p.id}>
              <td>{i === 0 && '👑 '}{p.name}</td>
              <td>{p.wins || 0} <button onClick={() => adjustScore(p, 'plus', 'wins')}>🟢</button></td>
              <td>{p.losses || 0} <button onClick={() => adjustScore(p, 'plus', 'losses')}>🟢</button></td>
              <td><button onClick={() => removePlayer(p.id, p.name)}>🎱</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Suivi des rencontres :</h3>
      <div style={{ background: '#222', padding: '10px', borderRadius: '5px' }}>
        {Object.values(matches).map((m, i) => (
          <div key={i} style={{ borderBottom: '1px solid #444', padding: '5px' }}>
            👑 {m.p1Name} ({m.p1Wins}) vs 🎱 {m.p2Name} ({m.p2Wins}) : {m.p1Wins + m.p2Wins} Match(s)
          </div>
        ))}
      </div>

      <h3>Historique :</h3>
      <div style={{ background: '#111', padding: '10px', borderRadius: '5px', fontSize: '12px' }}>
        {logs.map(log => <div key={log.id}>{formatDate(log.timestamp)} - {log.message}</div>)}
      </div>
    </div>
  );
}
