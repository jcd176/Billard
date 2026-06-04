import { useState, useEffect } from 'react';
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
  const [matchModal, setMatchModal] = useState(null);

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
    } else {
      addLog(`Echec modification Classement`, 'error');
    }
    setIsModalOpen(false);
  };

  const handleMatchAction = (action, matchKey) => {
    const password = prompt("Saisissez le mot de passe");
    if (password === 'root') {
      if (action === 'reset') {
        update(ref(database, `rooms/${roomId}/matches/${matchKey}`), { p1Wins: 0, p2Wins: 0 });
        addLog(`Réinitialisation scores duel : ${matchKey}`, 'manual');
      } else if (action === 'delete') {
        remove(ref(database, `rooms/${roomId}/matches/${matchKey}`));
        addLog(`Suppression duel : ${matchKey}`, 'manual');
      }
    } else {
      addLog(`Echec modification Match`, 'error');
    }
    setMatchModal(null);
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
    const matchKey = [winner, loser].sort().join('_vs_');
    const existing = matches[matchKey] || { p1Name: wPlayer.name, p2Name: lPlayer.name, p1Wins: 0, p2Wins: 0 };
    update(ref(database, `rooms/${roomId}/matches/${matchKey}`), { ...existing, p1Wins: (existing.p1Wins || 0) + (winner === winner ? 1 : 0), p2Wins: (existing.p2Wins || 0) + (loser === loser ? 1 : 0) });
    addLog(`MATCH:${wPlayer.name}|${lPlayer.name}`, 'match');
    setWinner(''); setLoser('');
  };

  const resetAction = (type, path) => {
    if (prompt(`Mot de passe pour vider ${type} ?`) === 'root') {
      set(ref(database, `rooms/${roomId}/${path}`), null);
      addLog(`Réinitialisation de ${type} effectuée`, 'reset');
    } else { addLog(`Échec réinitialisation ${type}`, 'error'); }
  };

  return (
    <div className="card">
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#333', padding: '20px', borderRadius: '8px', color: '#fff', textAlign: 'center' }}>
            <p>Validez {modalAction?.type === 'plus' ? "l'ajout" : "le retrait"} d'une {modalAction?.field === 'wins' ? 'victoire' : 'défaite'} ?</p>
            <button onClick={executeAdjustment}>Valider</button>
            <button onClick={() => setIsModalOpen(false)}>Annuler</button>
          </div>
        </div>
      )}
      {matchModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#333', padding: '20px', borderRadius: '8px', color: '#fff', textAlign: 'center' }}>
            <p>Action sur le duel :</p>
            <button onClick={() => handleMatchAction('reset', matchModal)}>Réinitialiser Scores</button>
            <button onClick={() => handleMatchAction('delete', matchModal)} style={{ color: 'red' }}>Supprimer Duel</button>
            <button onClick={() => setMatchModal(null)}>Annuler</button>
          </div>
        </div>
      )}

      <button onClick={onLeave}>← Retour</button>
      <h2>Salle : {roomId}</h2>
      
      <h3>Classement :</h3>
      <table style={{ width: '100%', color: '#fff' }}>
        <tbody>
          {players.map((p, i) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.wins} <button onClick={() => { setModalAction({player: p, type: 'plus', field: 'wins'}); setIsModalOpen(true); }}>🟢</button><button onClick={() => { setModalAction({player: p, type: 'minus', field: 'wins'}); setIsModalOpen(true); }}>🔴</button></td>
              <td>{p.losses} <button onClick={() => { setModalAction({player: p, type: 'plus', field: 'losses'}); setIsModalOpen(true); }}>🟢</button><button onClick={() => { setModalAction({player: p, type: 'minus', field: 'losses'}); setIsModalOpen(true); }}>🔴</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Suivi des rencontres :</h3>
      {Object.entries(matches).map(([key, m]) => (
        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #444' }}>
          <span>{m.p1Name} {m.p1Wins} vs {m.p2Name} {m.p2Wins}</span>
          <button onClick={() => setMatchModal(key)}>🎱</button>
        </div>
      ))}

      <h3>Historique :</h3>
      <div style={{ background: '#111', padding: '10px' }}>
        {logs.map(log => (
          <div key={log.id} style={{ color: log.type === 'error' ? '#EE82EE' : log.type === 'manual' ? '#FFD700' : '#fff' }}>
            {formatDate(log.timestamp)} - {log.message}
          </div>
        ))}
      </div>
    </div>
  );
}
