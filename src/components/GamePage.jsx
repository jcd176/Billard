import { useState, useEffect, useRef } from 'react';
import { ref, onValue, remove, push, update, set } from 'firebase/database';
import { database } from '../services/firebase';
import { SPORT_CONFIG } from './sportConfig';
 
export default function GamePage({ sport, roomId, onLeave }) {
  const basePath = `rooms/${sport}/${roomId}`;
  const config = SPORT_CONFIG[sport] || { name: 'Jeu', icon: '🎮', label: 'Match' };
  
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState({});
  const [logs, setLogs] = useState([]);
  const [roomName, setRoomName] = useState(roomId);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [winner, setWinner] = useState('');
  const [loser, setLoser] = useState('');
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
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear()).slice(-2)}`;
  };
 
  useEffect(() => {
    const unsubscribeRoom = onValue(ref(database, `${basePath}/name`), (s) => { if (s.exists()) setRoomName(s.val()); });
    const unsubscribePlayers = onValue(ref(database, `${basePath}/players`), (s) => {
      const data = s.val();
      const list = data ? Object.entries(data).map(([id, p]) => ({ id, ...p })) : [];
      const sorted = list.sort((a, b) => (b.wins || 0) - (a.wins || 0));
      if (sorted.length > 0 && prevLeaderIdRef.current !== null && prevLeaderIdRef.current !== sorted[0].id) {
        addLog(`Nouveau leader : ${sorted[0].name} 👑`, 'leader');
      }
      prevLeaderIdRef.current = sorted.length > 0 ? sorted[0].id : null;
      setPlayers(sorted);
    });
    const unsubscribeMatches = onValue(ref(database, `${basePath}/matches`), (s) => setMatches(s.val() || {}));
    const unsubscribeLogs = onValue(ref(database, `${basePath}/logs`), (s) => {
      const data = s.val();
      setLogs(data ? Object.entries(data).map(([id, log]) => ({ id, ...log })).reverse() : []);
    });
    return () => { unsubscribeRoom(); unsubscribePlayers(); unsubscribeMatches(); unsubscribeLogs(); };
  }, [basePath, logs]);
 
  const addLog = (message, type) => push(ref(database, `${basePath}/logs`), { message, type, timestamp: Date.now() });
 
  const executeAdjustment = () => {
    const password = prompt("Saisissez le mot de passe");
    if (password === 'root') {
      const { player, type, field, matchId, matchNames, p1Name, p2Name, w1, w2 } = modalAction;
      if (matchId) {
        const p1 = players.find(p => p.name === p1Name);
        const p2 = players.find(p => p.name === p2Name);
        if (matchOption === 'delete') {
          remove(ref(database, `${basePath}/matches/${matchId}`));
          if (p1) update(ref(database, `${basePath}/players/${p1.id}`), { wins: Math.max(0, (p1.wins || 0) - w1), losses: Math.max(0, (p1.losses || 0) - w2) });
          if (p2) update(ref(database, `${basePath}/players/${p2.id}`), { wins: Math.max(0, (p2.wins || 0) - w2), losses: Math.max(0, (p2.losses || 0) - w1) });
          addLog(`Suppression partie "${matchNames}"`, 'remove');
        } else {
          set(ref(database, `${basePath}/matches/${matchId}`), { p1: p1Name, p2: p2Name, w1: 0, w2: 0, count: 0 });
          if (p1) update(ref(database, `${basePath}/players/${p1.id}`), { wins: Math.max(0, (p1.wins || 0) - w1), losses: Math.max(0, (p1.losses || 0) - w2) });
          if (p2) update(ref(database, `${basePath}/players/${p2.id}`), { wins: Math.max(0, (p2.wins || 0) - w2), losses: Math.max(0, (p2.losses || 0) - w1) });
          addLog(`Réinitialisation partie "${matchNames}"`, 'remove');
        }
      } else {
        const targetPlayer = players.find(p => p.id === targetPlayerId);
        if (!targetPlayer) return;
        const change = type === 'plus' ? 1 : -1;
        update(ref(database, `${basePath}/players/${player.id}`), { [field]: Math.max(0, (player[field] || 0) + change) });
        update(ref(database, `${basePath}/players/${targetPlayerId}`), { [field === 'wins' ? 'losses' : 'wins']: Math.max(0, (targetPlayer[field === 'wins' ? 'losses' : 'wins'] || 0) + change) });
        addLog(`${change > 0 ? '+' : ''}${change} ${field === 'wins' ? 'Victoire' : 'Défaite'} "${player.name}"`, change > 0 ? 'manual_plus' : 'manual_minus');
      }
    } else {
      addLog(modalAction.matchId ? "Echec modification partie" : "Echec modification Classement", 'error');
    }
    setTargetPlayerId(''); setIsModalOpen(false);
  };

  const addPlayer = () => {
    const trimmedName = newPlayerName.trim();
    if (!trimmedName || trimmedName.length > 12 || players.some(p => p.name.toLowerCase() === trimmedName.toLowerCase())) return;
    push(ref(database, `${basePath}/players`), { name: trimmedName, wins: 0, losses: 0 });
    addLog(`${trimmedName} a rejoint`, 'add');
    setPlayerPopup(trimmedName);
    setTimeout(() => setPlayerPopup(null), 2000);
    setNewPlayerName(''); setIsAddPlayerOpen(false);
  };

const declareMatch = () => {
    if (!winner || !loser || winner === loser) return;
    const wPlayer = players.find(p => p.id === winner);
    const lPlayer = players.find(p => p.id === loser);
    update(ref(database, `${basePath}/players/${winner}`), { wins: (wPlayer.wins || 0) + 1 });
    update(ref(database, `${basePath}/players/${loser}`), { losses: (lPlayer.losses || 0) + 1 });
    const matchId = [wPlayer.name, lPlayer.name].sort().join('_vs_');
    const existing = matches[matchId] || { p1: wPlayer.name, p2: lPlayer.name, w1: 0, w2: 0, count: 0 };
    const isW1 = wPlayer.name === existing.p1;
    set(ref(database, `${basePath}/matches/${matchId}`), {
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
        players.forEach(p => update(ref(database, `${basePath}/players/${p.id}`), { wins: 0, losses: 0 }));
      } else { set(ref(database, `${basePath}/${path}`), null); }
      addLog(`Réinitialisation de ${type} effectuée`, 'reset');
    } else { addLog(`Échec réinitialisation ${type}`, 'error'); }
  };

  const removePlayer = (playerId, playerName) => {
    if (prompt("Mot de passe suppression") === 'root') {
      remove(ref(database, `${basePath}/players/${playerId}`));
      addLog(`${playerName} a été supprimé`, 'remove');
    } else { addLog(`Suppression de "${playerName}" en échec`, 'error'); }
  };

  const btnReset = { background: 'transparent', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' };
  const btnAction = { border: 'none', background: 'none', cursor: 'pointer', padding: '0 4px', fontSize: '18px' };
  const selectStyle = { width: '100%', marginBottom: '10px', padding: '10px', fontSize: '16px', borderRadius: '4px', boxSizing: 'border-box' };
  const modalBtnStyle = { flex: 1, padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' };

  return (
    <div className="card">
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
              <>
                <p style={{marginBottom: '15px'}}>Sélectionner un joueur.</p>
                <select value={targetPlayerId} onChange={(e) => setTargetPlayerId(e.target.value)} style={selectStyle}>
                  <option value="">Choisir un joueur</option>
                  {players.filter(p => p.id !== modalAction?.player?.id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </>
            )}
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button onClick={executeAdjustment} className="btn-primary" style={{...modalBtnStyle, background: '#007bff', color: '#fff'}} disabled={!modalAction?.matchId && !targetPlayerId}>Valider</button>
              <button onClick={() => { setIsModalOpen(false); setTargetPlayerId(''); }} style={{...modalBtnStyle, background: '#666', color: '#fff'}}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      <button onClick={onLeave} style={{ background: '#ff4d4d', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '24px', marginBottom: '10px' }}>↩</button>
      
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '15px' }}>
        <h2 style={{ margin: 0 }}>{config.icon} {config.name} : {roomName}</h2>
        <button onClick={() => setIsAddPlayerOpen(!isAddPlayerOpen)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px', display: 'flex', alignItems: 'center' }}>
          <span style={whiteIconStyle}>➕</span>
        </button>
      </div>

      {isAddPlayerOpen && (
        <div style={{ position: 'absolute', top: '40px', right: '0', background: '#333', padding: '15px', borderRadius: '8px', zIndex: 3000, width: '200px', border: '1px solid #555' }}>
          <input value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Nom du joueur" style={{width: '100%', padding: '8px', marginBottom: '10px'}} />
          <button onClick={addPlayer} style={{...modalBtnStyle, background: '#007bff', color: '#fff'}}>Ajouter</button>
        </div>
      )}

      <div style={{ background: '#333', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
        <select value={winner} onChange={(e) => setWinner(e.target.value)} style={selectStyle}>
          <option value="">👑 Vainqueur</option>
          {players.filter(p => p.id !== loser).map(p => <option key={p.id} value={p.id}>👑 {p.name}</option>)}
        </select>
        <select value={loser} onChange={(e) => setLoser(e.target.value)} style={selectStyle}>
          <option value="">🎱 Perdant</option>
          {players.filter(p => p.id !== winner).map(p => <option key={p.id} value={p.id}>🎱 {p.name}</option>)}
        </select>
        <button onClick={declareMatch} style={{ width: '100%', padding: '10px' }}>Déclarer {config.label}</button>
      </div>

      <h3>Classement :</h3>
      <table style={{ width: '100%', color: '#fff', borderCollapse: 'collapse' }}>
        <thead><tr style={{ borderBottom: '1px solid #444' }}><th>Joueur</th><th>Vict</th><th>Déf</th><th>%</th><th></th></tr></thead>
        <tbody>
          {players.map((p, i) => {
            const total = (p.wins || 0) + (p.losses || 0);
            const winRate = total > 0 ? Math.round(((p.wins || 0) / total) * 100) : 0;
            return (
              <tr key={p.id} style={{ borderBottom: '1px solid #222' }}>
                <td>{i === 0 && '👑 '}{p.name}</td>
                <td>{p.wins || 0} <button onClick={() => { setModalAction({player: p, type: 'plus', field: 'wins'}); setIsModalOpen(true); }} style={btnAction}>🟢</button></td>
                <td>{p.losses || 0} <button onClick={() => { setModalAction({player: p, type: 'plus', field: 'losses'}); setIsModalOpen(true); }} style={btnAction}>🟢</button></td>
                <td>{winRate}%</td>
                <td><button onClick={() => removePlayer(p.id, p.name)} style={btnAction}>🎱</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
