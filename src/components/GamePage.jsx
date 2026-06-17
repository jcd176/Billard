import React, { useState, useEffect, useRef } from 'react';
import { ref, onValue, remove, push, update, set } from 'firebase/database';
import { database } from '../services/firebase';
import { SPORT_CONFIG } from './sportConfig';

export default function GamePage({ sport, roomId, onLeave }) {
  const config = SPORT_CONFIG[sport] || { name: 'Jeu', icon: '🎮', label: 'Match' };
  const basePath = `rooms/${sport}/${roomId}`;

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
  const btnReset = { background: 'transparent', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' };
  const btnAction = { border: 'none', background: 'none', cursor: 'pointer', padding: '0 4px', fontSize: '18px' };
  const selectStyle = { width: '100%', marginBottom: '10px', padding: '10px', fontSize: '16px', borderRadius: '4px', boxSizing: 'border-box' };
  const modalBtnStyle = { flex: 1, padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear()).slice(-2)}`;
  };

  useEffect(() => {
    const unsubscribeRoom = onValue(ref(database, `${basePath}/name`), (snap) => { if (snap.exists()) setRoomName(snap.val()); });
    const unsubscribePlayers = onValue(ref(database, `${basePath}/players`), (snap) => {
      const data = snap.val();
      const list = data ? Object.entries(data).map(([id, p]) => ({ id, ...p })) : [];
      const sorted = list.sort((a, b) => (b.wins || 0) - (a.wins || 0));
      if (sorted.length > 0 && prevLeaderIdRef.current !== null && prevLeaderIdRef.current !== sorted[0].id) {
        addLog(`Nouveau leader : ${sorted[0].name} 👑`, 'leader');
      }
      prevLeaderIdRef.current = sorted.length > 0 ? sorted[0].id : null;
      setPlayers(sorted);
    });
    const unsubscribeMatches = onValue(ref(database, `${basePath}/matches`), (snap) => setMatches(snap.val() || {}));
    const unsubscribeLogs = onValue(ref(database, `${basePath}/logs`), (snap) => {
      const data = snap.val();
      setLogs(data ? Object.entries(data).map(([id, log]) => ({ id, ...log })).reverse() : []);
    });
    return () => { unsubscribeRoom(); unsubscribePlayers(); unsubscribeMatches(); unsubscribeLogs(); };
  }, [basePath]);

  const addLog = (message, type) => push(ref(database, `${basePath}/logs`), { message, type, timestamp: Date.now() });

  const executeAdjustment = () => {
    if (prompt("Mot de passe") !== 'root') return;
    const { player, type, field, matchId, matchNames, p1Name, p2Name, w1, w2 } = modalAction;
    if (matchId) {
      if (matchOption === 'delete') {
        remove(ref(database, `${basePath}/matches/${matchId}`));
        addLog(`Suppression "${matchNames}"`, 'remove');
      } else {
        set(ref(database, `${basePath}/matches/${matchId}`), { p1: p1Name, p2: p2Name, w1: 0, w2: 0, count: 0 });
        addLog(`Réinitialisation "${matchNames}"`, 'remove');
      }
    } else {
      const targetPlayer = players.find(p => p.id === targetPlayerId);
      const change = type === 'plus' ? 1 : -1;
      update(ref(database, `${basePath}/players/${player.id}`), { [field]: Math.max(0, (player[field] || 0) + change) });
      update(ref(database, `${basePath}/players/${targetPlayerId}`), { [field === 'wins' ? 'losses' : 'wins']: Math.max(0, (targetPlayer[field === 'wins' ? 'losses' : 'wins'] || 0) + change) });
      addLog(`${change > 0 ? '+' : ''}${change} ${field} "${player.name}"`, 'manual');
    }
    setIsModalOpen(false);
  };

  const addPlayer = () => {
    const trimmedName = newPlayerName.trim();
    if (!trimmedName || players.some(p => p.name.toLowerCase() === trimmedName.toLowerCase())) return;
    push(ref(database, `${basePath}/players`), { name: trimmedName, wins: 0, losses: 0 });
    addLog(`${trimmedName} a rejoint`, 'add');
    setNewPlayerName(''); setIsAddPlayerOpen(false);
  };

  const declareMatch = () => {
    if (!winner || !loser || winner === loser) return;
    const wP = players.find(p => p.id === winner);
    const lP = players.find(p => p.id === loser);
    update(ref(database, `${basePath}/players/${winner}`), { wins: (wP.wins || 0) + 1 });
    update(ref(database, `${basePath}/players/${loser}`), { losses: (lP.losses || 0) + 1 });
    addLog(`MATCH:${wP.name}|${lP.name}`, 'match');
    setWinner(''); setLoser('');
  };

  const resetAction = (type, path) => {
    if (prompt(`Vider ${type} ?`) === 'root') {
      if (type === 'classement') players.forEach(p => update(ref(database, `${basePath}/players/${p.id}`), { wins: 0, losses: 0 }));
      else set(ref(database, `${basePath}/${path}`), null);
    }
  };

  const removePlayer = (id, name) => {
    if (prompt("Confirmer suppression") === 'root') {
      remove(ref(database, `${basePath}/players/${id}`));
      addLog(`${name} supprimé`, 'remove');
    }
  };

  return (
    <div className="card">
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#333', padding: '20px', borderRadius: '8px', color: '#fff', textAlign: 'center' }}>
            {modalAction?.matchId ? (
              <select value={matchOption} onChange={(e) => setMatchOption(e.target.value)} style={selectStyle}>
                <option value="delete">Supprimer</option>
                <option value="reset">Réinitialiser</option>
              </select>
            ) : (
              <select value={targetPlayerId} onChange={(e) => setTargetPlayerId(e.target.value)} style={selectStyle}>
                <option value="">Choisir un joueur</option>
                {players.filter(p => p.id !== modalAction?.player?.id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={executeAdjustment} style={modalBtnStyle}>Valider</button>
              <button onClick={() => setIsModalOpen(false)} style={modalBtnStyle}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      <button onClick={onLeave} style={{ background: '#ff4d4d', border: 'none', borderRadius: '50%', width: '40px', height: '40px', color: 'white' }}>↩</button>
      <h2>{config.icon} {config.name} : {roomName}</h2>

      <div style={{ background: '#333', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
        <select value={winner} onChange={(e) => setWinner(e.target.value)} style={selectStyle}>
          <option value="">👑 Vainqueur</option>
          {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={loser} onChange={(e) => setLoser(e.target.value)} style={selectStyle}>
          <option value="">🎱 Perdant</option>
          {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button onClick={declareMatch} style={{ width: '100%', padding: '10px' }}>Déclarer {config.label}</button>
      </div>

      <h3>Classement</h3>
      {players.map((p, i) => (
        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #444' }}>
          <span>{i === 0 && '👑 '}{p.name}</span>
          <span>{p.wins || 0}V - {p.losses || 0}D</span>
          <button onClick={() => { setModalAction({player: p, type: 'plus', field: 'wins'}); setIsModalOpen(true); }} style={btnAction}>⚙️</button>
        </div>
      ))}

      <h3>Suivi des rencontres</h3>
      {Object.entries(matches).map(([id, m]) => (
        <div key={id} style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{m.p1} vs {m.p2}</span>
          <button onClick={() => { setModalAction({matchId: id, matchNames: `${m.p1} vs ${m.p2}`, p1Name: m.p1, p2Name: m.p2, w1: m.w1, w2: m.w2}); setIsModalOpen(true); }} style={btnAction}>🎱</button>
        </div>
      ))}

      <h3>Historique</h3>
      {logs.map(log => <div key={log.id}>{formatDate(log.timestamp)} - {log.message}</div>)}
    </div>
  );
}
