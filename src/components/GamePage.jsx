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
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState(null);

  const prevLeaderIdRef = useRef(null);

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
      
      if (sorted.length > 0) {
        const currentLeader = sorted[0];
        if (prevLeaderIdRef.current && prevLeaderIdRef.current !== currentLeader.id) {
          addLog(`Nouveau leader : ${currentLeader.name} 👑`, 'leader');
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

  const declareMatch = () => {
    if (!winner || !loser || winner === loser) return;
    const wPlayer = players.find(p => p.id === winner);
    const lPlayer = players.find(p => p.id === loser);
    
    update(ref(database, `rooms/${roomId}/players/${winner}`), { wins: (wPlayer.wins || 0) + 1 });
    update(ref(database, `rooms/${roomId}/players/${loser}`), { losses: (lPlayer.losses || 0) + 1 });
    
    const matchId = [winner, loser].sort().join('_');
    const existing = matches[matchId] || { p1: wPlayer.name, p2: lPlayer.name, count: 0 };
    update(ref(database, `rooms/${roomId}/matches/${matchId}`), { count: (existing.count || 0) + 1 });

    addLog(`MATCH:${wPlayer.name}|${lPlayer.name}`, 'match');
    setWinner(''); setLoser('');
  };

  const btnAction = { border: 'none', background: 'none', cursor: 'pointer', padding: '0 2px', fontSize: '14px' };

  return (
    <div className="card">
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#333', padding: '20px', borderRadius: '8px', color: '#fff' }}>
            <p>Valider la modification ?</p>
            <button onClick={executeAdjustment}>Valider</button>
            <button onClick={() => setIsModalOpen(false)}>Annuler</button>
          </div>
        </div>
      )}

      <button onClick={onLeave}>← Retour</button>
      <h2>Salle : {roomId}</h2>

      <div style={{ background: '#333', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
        <select value={winner} onChange={(e) => setWinner(e.target.value)}><option value="">👑 Vainqueur</option>{players.map(p => <option key={p.id} value={p.id}>👑 {p.name}</option>)}</select>
        <select value={loser} onChange={(e) => setLoser(e.target.value)}><option value="">🎱 Perdant</option>{players.map(p => <option key={p.id} value={p.id}>🎱 {p.name}</option>)}</select>
        <button onClick={declareMatch}>Déclarer Match</button>
      </div>

      <h3>Classement :</h3>
      <table style={{ width: '100%', color: '#fff' }}>
        <thead><tr><th>Joueur</th><th>Vict</th><th>Déf</th></tr></thead>
        <tbody>
          {players.map((p, i) => (
            <tr key={p.id}>
              <td>{i === 0 && '👑 '}{p.name}</td>
              <td>{p.wins || 0} 
                <span style={{ display: 'inline-flex', flexDirection: 'column', marginLeft: '5px' }}>
                  <button onClick={() => { setModalAction({player: p, type: 'plus', field: 'wins'}); setIsModalOpen(true); }} style={btnAction}>🟢</button>
                  <button onClick={() => { setModalAction({player: p, type: 'minus', field: 'wins'}); setIsModalOpen(true); }} style={btnAction}>🔴</button>
                </span>
              </td>
              <td>{p.losses || 0}
                <span style={{ display: 'inline-flex', flexDirection: 'column', marginLeft: '5px' }}>
                  <button onClick={() => { setModalAction({player: p, type: 'plus', field: 'losses'}); setIsModalOpen(true); }} style={btnAction}>🟢</button>
                  <button onClick={() => { setModalAction({player: p, type: 'minus', field: 'losses'}); setIsModalOpen(true); }} style={btnAction}>🔴</button>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Suivi des rencontres :</h3>
      {Object.entries(matches).map(([id, m]) => <div key={id}>👑 {m.p1} vs 🎱 {m.p2} : {m.count} parties</div>)}

      <h3>Historique :</h3>
      {logs.map(log => <div key={log.id}>{formatDate(log.timestamp)} - {log.message}</div>)}
    </div>
  );
}
