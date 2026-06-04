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
      const sorted = list.sort((a, b) => (b.wins || 0) - (a.wins || 0));
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
    } else {
      addLog(`Echec modification Classement`, 'error');
    }
    setIsModalOpen(false);
  };

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    push(ref(database, `rooms/${roomId}/players`), { name: newPlayerName, wins: 0, losses: 0 });
    addLog(`${newPlayerName} a rejoint la salle`, 'add');
    setNewPlayerName('');
  };

  const declareMatch = async () => {
    if (!winner || !loser || winner === loser) return;
    const wPlayer = players.find(p => p.id === winner);
    const lPlayer = players.find(p => p.id === loser);

    // 1. Mise à jour globale des scores
    update(ref(database, `rooms/${roomId}/players/${winner}`), { wins: (wPlayer.wins || 0) + 1 });
    update(ref(database, `rooms/${roomId}/players/${loser}`), { losses: (lPlayer.losses || 0) + 1 });

    // 2. Mise à jour du suivi des rencontres par binôme
    const matchId = [winner, loser].sort().join('_');
    const matchRef = ref(database, `rooms/${roomId}/matches/${matchId}`);
    
    const snapshot = await get(matchRef);
    if (snapshot.exists()) {
      const m = snapshot.val();
      let p1Wins = m.p1Id === winner ? m.p1Wins + 1 : m.p1Wins;
      let p2Wins = m.p2Id === loser ? m.p2Wins + 1 : m.p2Wins;
      
      // Tri automatique : le leader du duel à gauche (p1)
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
      addLog(`Réinitialisation de ${type} effectuée`, 'reset');
    } else { addLog(`Échec réinitialisation ${type}`, 'error'); }
  };

  const removePlayer = (playerId, playerName) => {
    if (prompt("Mot de passe suppression") === 'root') {
      remove(ref(database, `rooms/${roomId}/players/${playerId}`));
      addLog(`${playerName} a été supprimé`, 'remove');
    } else { addLog(`Suppression de "${playerName}" en échec`, 'error'); }
  };

  const btnReset = { background: 'transparent', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' };
  const btnAction = { border: 'none', background: 'none', cursor: 'pointer', padding: 0, fontSize: '20px' };
  const selectStyle = { width: '100%', marginBottom: '10px', padding: '10px', fontSize: '16px', borderRadius: '4px' };

  return (
    <div className="card">
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#333', padding: '20px', borderRadius: '8px', color: '#fff', textAlign: 'center' }}>
            <p>Validez {modalAction.type === 'plus' ? "l'ajout" : "le retrait"} d'une {modalAction.field === 'wins' ? 'victoire' : 'défaite'} ?</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={executeAdjustment} className="btn-primary">Valider</button>
              <button onClick={() => setIsModalOpen(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      <button onClick={onLeave} style={{ marginBottom: '10px' }}>← Retour</button>
      <h2>Salle : {roomId}</h2>
      
      <div style={{ display: 'flex', gap: '5px', marginBottom: '20px' }}>
        <input value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Nom du joueur" />
        <button onClick={addPlayer} className="btn-primary">Ajouter</button>
      </div>

      <div style={{ background: '#333', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
        <select value={winner} onChange={(e) => setWinner(e.target.value)} style={selectStyle}>
          <option value="">👑 Vainqueur</option>
          {players.filter(p => p.id !== loser).map(p => <option key={p.id} value={p.id}>👑 {p.name}</option>)}
        </select>
        <select value={loser} onChange={(e) => setLoser(e.target.value)} style={selectStyle}>
          <option value="">🎱 Perdant</option>
          {players.filter(p => p.id !== winner).map(p => <option key={p.id} value={p.id}>🎱 {p.name}</option>)}
        </select>
        <button onClick={declareMatch} className="btn-primary" style={{ width: '100%', padding: '10px' }}>Déclarer Match</button>
      </div>

      <h3>Classement :</h3>
      <table style={{ width: '100%', color: '#fff', borderCollapse: 'collapse' }}>
        <thead><tr style={{ borderBottom: '1px solid #444' }}><th style={{ textAlign: 'left', padding: '8px' }}>Joueur</th><th>Vict</th><th>Déf</th><th>%</th><th></th></tr></thead>
        <tbody>
          {players.map((p, i) => {
            const total = (p.wins || 0) + (p.losses || 0);
            const winRate = total > 0 ? Math.round(((p.wins || 0) / total) * 100) : 0;
            return (
              <tr key={p.id} style={{ borderBottom: '1px solid #222' }}>
                <td style={{ padding: '8px' }}>{i === 0 && '👑 '}{p.name}</td>
                <td style={{ padding: '8px' }}>{p.wins || 0} <button onClick={() => { setModalAction({player: p, type: 'plus', field: 'wins'}); setIsModalOpen(true); }} style={btnAction}>🟢</button><button onClick={() => { setModalAction({player: p, type: 'minus', field: 'wins'}); setIsModalOpen(true); }} style={btnAction}>🔴</button></td>
                <td style={{ padding: '8px' }}>{p.losses || 0} <button onClick={() => { setModalAction({player: p, type: 'plus', field: 'losses'}); setIsModalOpen(true); }} style={btnAction}>🟢</button><button onClick={() => { setModalAction({player: p, type: 'minus', field: 'losses'}); setIsModalOpen(true); }} style={btnAction}>🔴</button></td>
                <td style={{ padding: '8px' }}>{winRate}%</td>
                <td style={{ textAlign: 'center' }}><button onClick={() => removePlayer(p.id, p.name)} style={{ ...btnAction, fontSize: '28px' }}>🎱</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h3>Suivi des rencontres :</h3>
