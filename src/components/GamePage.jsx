import { useState, useEffect, useRef } from 'react';
import { ref, onValue, remove, push, update, set, get } from 'firebase/database';
import { database } from '../services/firebase';

export default function GamePage({ roomId, onLeave }) {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState({});
  const [logs, setLogs] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [winner, setWinner] = useState('');
  const [loser, setLoser] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState(null);

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

  const executeAdjustment = () => {
    const password = prompt("Saisissez le mot de passe");
    if (password === 'root') {
      const { player, type, field } = modalAction;
      const change = type === 'plus' ? 1 : -1;
      const newVal = Math.max(0, (player[field] || 0) + change);
      update(ref(database, `rooms/${roomId}/players/${player.id}`), { [field]: newVal });
      addLog(`${change > 0 ? '+' : ''}${change} ${field === 'wins' ? 'Victoire' : 'Défaite'} "${player.name}"`, 'manual');
    }
    setIsModalOpen(false);
  };

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    push(ref(database, `rooms/${roomId}/players`), { name: newPlayerName, wins: 0, losses: 0 });
    addLog(`${newPlayerName} a rejoint`, 'add');
    setNewPlayerName('');
  };

  const declareMatch = async () => {
    if (!winner || !loser || winner === loser) return;
    const wPlayer = players.find(p => p.id === winner);
    const lPlayer = players.find(p => p.id === loser);

    update(ref(database, `rooms/${roomId}/players/${winner}`), { wins: (wPlayer.wins || 0) + 1 });
    update(ref(database, `rooms/${roomId}/players/${loser}`), { losses: (lPlayer.losses || 0) + 1 });

    const matchId = [winner, loser].sort().join('_');
    const matchRef = ref(database, `rooms/${roomId}/matches/${matchId}`);
    const snapshot = await get(matchRef);
    
    if (snapshot.exists()) {
      const m = snapshot.val();
      let p1Wins = m.p1Id === winner ? m.p1Wins + 1 : m.p1Wins;
      let p2Wins = m.p2Id === loser ? m.p2Wins + 1 : m.p2Wins;
      if (p2Wins > p1Wins) {
        set(matchRef, { p1Id: loser, p1Name: lPlayer.name, p1Wins: p2Wins, p2Id: winner, p2Name: wPlayer.name, p2Wins: p1Wins });
      } else {
        update(matchRef, { p1Wins, p2Wins });
      }
    } else {
      set(matchRef, { p1Id: winner, p1Name: wPlayer.name, p1Wins: 1, p2Id: loser, p2Name: lPlayer.name, p2Wins: 0 });
    }
    addLog(`MATCH:${wPlayer.name}|${lPlayer.name}`, 'match');
    setWinner(''); setLoser('');
  };

  const resetAction = (type, path) => {
    if (prompt(`Mot de passe pour vider ${type} ?`) === 'root') {
      set(ref(database, `rooms/${roomId}/${path}`), null);
    }
  };

  const removePlayer = (id, name) => {
    if (prompt("Mot de passe suppression") === 'root') remove(ref(database, `rooms/${roomId}/players/${id}`));
  };

  return (
    <div className="card">
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#333', padding: '20px', borderRadius: '8px', color: '#fff' }}>
            <p>Valider la modification ?</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={executeAdjustment}>Valider</button>
              <button onClick={() => setIsModalOpen(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      <button onClick={onLeave}>← Retour</button>
      <h2>Salle : {roomId}</h2>
      
      <div style={{ background: '#333', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
        <select value={winner} onChange={(e) => setWinner(e.target.value)}><option value="">👑 Vainqueur</option>{players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <select value={loser} onChange={(e) => setLoser(e.target.value)}><option value="">🎱 Perdant</option>{players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <button onClick={declareMatch} style={{ width: '100%' }}>Déclarer Match</button>
      </div>

      <h3>Classement :</h3>
      <table style={{ width: '100%', color: '#fff' }}>
        <tbody>
          {players.map((p, i) => (
            <tr key={p.id}>
              <td>{i === 0 && '👑 '}{p.name}</td>
              <td>{p.wins || 0}</td>
              <td><button onClick={() => { setModalAction({player: p, type: 'plus', field: 'wins'}); setIsModalOpen(true); }}>+</button></td>
              <td><button onClick={() => removePlayer(p.id, p.name)}>🗑️</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Suivi des rencontres :</h3>
      <div style={{ background: '#222', padding: '10px', borderRadius: '5px' }}>
        {Object.values(matches).map((m, i) => (
          <div key={i} style={{ borderBottom: '1px solid #444', padding: '5px' }}>
            👑 {m.p1Name} <strong>{m.p1Wins}</strong> vs 🎱 {m.p2Name} <strong>{m.p2Wins}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
