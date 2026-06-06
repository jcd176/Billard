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
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [targetPlayerId, setTargetPlayerId] = useState('');
  const [matchOption, setMatchOption] = useState('delete');
  const [matchPopup, setMatchPopup] = useState(null);

  const prevLeaderIdRef = useRef(null);

  const btnReset = { background: 'transparent', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' };
  const btnAction = { border: 'none', background: 'none', cursor: 'pointer', padding: '0 4px', fontSize: '18px' };
  const selectStyle = { width: '100%', marginBottom: '10px', padding: '10px', fontSize: '16px', borderRadius: '4px', boxSizing: 'border-box' };
  const modalBtnStyle = { flex: 1, padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' };
  const addPlayerBtnStyle = { background: '#444', border: '1px solid #0f0', color: '#0f0', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' };

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
        if (prevLeaderIdRef.current !== null && prevLeaderIdRef.current !== currentLeader.id) {
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
      setLogs(list.reverse());
    });
    return () => { unsubscribePlayers(); unsubscribeMatches(); unsubscribeLogs(); };
  }, [roomId, logs]);

  const addLog = (message, type) => push(ref(database, `rooms/${roomId}/logs`), { message, type, timestamp: Date.now() });

  const executeAdjustment = () => {
    const password = prompt("Saisissez le mot de passe");
    if (password === 'root') {
      const { player, type, field, matchId, matchNames, p1Name, p2Name, w1, w2 } = modalAction;
      if (matchId) {
        const p1 = players.find(p => p.name === p1Name);
        const p2 = players.find(p => p.name === p2Name);
        if (matchOption === 'delete') {
          remove(ref(database, `rooms/${roomId}/matches/${matchId}`));
          if (p1) update(ref(database, `rooms/${roomId}/players/${p1.id}`), { wins: Math.max(0, (p1.wins || 0) - w1), losses: Math.max(0, (p1.losses || 0) - w2) });
          if (p2) update(ref(database, `rooms/${roomId}/players/${p2.id}`), { wins: Math.max(0, (p2.wins || 0) - w2), losses: Math.max(0, (p2.losses || 0) - w1) });
          addLog(`Suppression partie "${matchNames}"`, 'remove');
        } else {
          set(ref(database, `rooms/${roomId}/matches/${matchId}`), { p1: p1Name, p2: p2Name, w1: 0, w2: 0, count: 0 });
          addLog(`Réinitialisation partie "${matchNames}"`, 'remove');
        }
      } else {
        const targetPlayer = players.find(p => p.id === targetPlayerId);
        if (!targetPlayer) return;
        const change = type === 'plus' ? 1 : -1;
        update(ref(database, `rooms/${roomId}/players/${player.id}`), { [field]: Math.max(0, (player[field] || 0) + change) });
        update(ref(database, `rooms/${roomId}/players/${targetPlayerId}`), { [field === 'wins' ? 'losses' : 'wins']: Math.max(0, (targetPlayer[field === 'wins' ? 'losses' : 'wins'] || 0) + change) });
        addLog(`${change > 0 ? '+' : ''}${change} ${field === 'wins' ? 'Victoire' : 'Défaite'} "${player.name}"`, change > 0 ? 'manual_plus' : 'manual_minus');
      }
    }
    setTargetPlayerId('');
    setIsModalOpen(false);
  };

  const addPlayer = () => {
    const trimmedName = newPlayerName.trim();
    if (!trimmedName || trimmedName.length > 12) { alert("Nom invalide."); return; }
    if (players.some(p => p.name.toLowerCase() === trimmedName.toLowerCase())) { alert("Déjà présent."); return; }
    push(ref(database, `rooms/${roomId}/players`), { name: trimmedName, wins: 0, losses: 0 });
    addLog(`${trimmedName} a rejoint la salle`, 'add');
    setNewPlayerName('');
    setIsAddPlayerModalOpen(false);
  };

  const declareMatch = () => {
    if (!winner || !loser || winner === loser) return;
    const wPlayer = players.find(p => p.id === winner);
    const lPlayer = players.find(p => p.id === loser);
    update(ref(database, `rooms/${roomId}/players/${winner}`), { wins: (wPlayer.wins || 0) + 1 });
    update(ref(database, `rooms/${roomId}/players/${loser}`), { losses: (lPlayer.losses || 0) + 1 });
    const matchId = [wPlayer.name, lPlayer.name].sort().join('_vs_');
    const existing = matches[matchId] || { p1: wPlayer.name, p2: lPlayer.name, w1: 0, w2: 0, count: 0 };
    const isW1 = wPlayer.name === existing.p1;
    set(ref(database, `rooms/${roomId}/matches/${matchId}`), { p1: existing.p1, p2: existing.p2, w1: isW1 ? existing.w1 + 1 : existing.w1, w2: !isW1 ? existing.w2 + 1 : existing.w2, count: existing.count + 1 });
    addLog(`MATCH:${wPlayer.name}|${lPlayer.name}`, 'match');
    setMatchPopup({ winner: wPlayer.name, loser: lPlayer.name });
    setTimeout(() => setMatchPopup(null), 3000);
    setWinner(''); setLoser('');
  };

  const resetAction = (type, path) => {
    if (prompt(`Mot de passe pour vider ${type} ?`) === 'root') {
      if (type === 'classement') players.forEach(p => update(ref(database, `rooms/${roomId}/players/${p.id}`), { wins: 0, losses: 0 }));
      else set(ref(database, `rooms/${roomId}/${path}`), null);
      addLog(`Réinitialisation de ${type} effectuée`, 'reset');
    }
  };

  const removePlayer = (playerId, playerName) => {
    if (prompt("Mot de passe suppression") === 'root') {
      remove(ref(database, `rooms/${roomId}/players/${playerId}`));
      addLog(`${playerName} a été supprimé`, 'remove');
    }
  };

  return (
    <div className="card">
      {/* Modale Nouveau Joueur */}
      {isAddPlayerModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#333', padding: '20px', borderRadius: '8px', color: '#fff', textAlign: 'center', minWidth: '320px', maxWidth: '90%' }}>
            <h3 style={{ marginBottom: '15px' }}>Nouveau Joueur</h3>
            <input value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Nom du joueur" style={selectStyle} />
            <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={addPlayer} style={{...modalBtnStyle, background: '#0f0', color: '#000', fontWeight: 'bold'}}>Ajouter</button>
                <button onClick={() => setIsAddPlayerModalOpen(false)} style={{...modalBtnStyle, background: '#666', color: '#fff'}}>Retour</button>
            </div>
          </div>
        </div>
      )}

      {/* Modale d'ajustement */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#333', padding: '20px', borderRadius: '8px', color: '#fff', textAlign: 'center', minWidth: '320px' }}>
            {modalAction?.matchId ? (
                <>
                  <p>Action sur "{modalAction.matchNames}"</p>
                  <select value={matchOption} onChange={(e) => setMatchOption(e.target.value)} style={selectStyle}>
                    <option value="delete">Supprimer la rencontre</option>
                    <option value="reset">Réinitialiser la rencontre</option>
                  </select>
                </>
            ) : (
                <select value={targetPlayerId} onChange={(e) => setTargetPlayerId(e.target.value)} style={selectStyle}>
                    <option value="">Choisir un joueur</option>
                    {players.filter(p => p.id !== modalAction?.player?.id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            )}
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button onClick={executeAdjustment} style={{...modalBtnStyle, background: '#007bff', color: '#fff'}}>Valider</button>
                <button onClick={() => setIsModalOpen(false)} style={{...modalBtnStyle, background: '#666', color: '#fff'}}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      <button onClick={onLeave} style={{ marginBottom: '10px' }}>← Retour</button>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>Salle : {roomId}</h2>
        <button onClick={() => setIsAddPlayerModalOpen(true)} style={addPlayerBtnStyle}>👤 +</button>
      </div>
      
      <div style={{ background: '#333', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
        <select value={winner} onChange={(e) => setWinner(e.target.value)} style={selectStyle}>
          <option value="">👑 Vainqueur</option>
          {players.map(p => <option key={p.id} value={p.id}>👑 {p.name}</option>)}
        </select>
        <select value={loser} onChange={(e) => setLoser(e.target.value)} style={selectStyle}>
          <option value="">🎱 Perdant</option>
          {players.map(p => <option key={p.id} value={p.id}>🎱 {p.name}</option>)}
        </select>
        <button onClick={declareMatch} style={{ width: '100%', padding: '10px', background: '#0f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Déclarer Match</button>
      </div>

      <h3>Classement :</h3>
      <table style={{ width: '100%', color: '#fff' }}>
        <thead><tr><th>Joueur</th><th>V</th><th>D</th><th></th></tr></thead>
        <tbody>
          {players.map(p => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.wins || 0}</td>
              <td>{p.losses || 0}</td>
              <td><button onClick={() => removePlayer(p.id, p.name)} style={btnAction}>🗑️</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
