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
    const roomRef = ref(database, `${basePath}/name`);
    const unsubscribeRoom = onValue(roomRef, (snapshot) => { if (snapshot.exists()) setRoomName(snapshot.val()); });

    const playersRef = ref(database, `${basePath}/players`);
    const unsubscribePlayers = onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, p]) => ({ id, ...p })) : [];
      const sorted = list.sort((a, b) => (b.wins || 0) - (a.wins || 0));
      if (sorted.length > 0 && prevLeaderIdRef.current !== null && prevLeaderIdRef.current !== sorted[0].id) {
        addLog(`Nouveau leader : ${sorted[0].name} 👑`, 'leader');
      }
      prevLeaderIdRef.current = sorted.length > 0 ? sorted[0].id : null;
      setPlayers(sorted);
    });

    const matchesRef = ref(database, `${basePath}/matches`);
    const unsubscribeMatches = onValue(matchesRef, (snapshot) => setMatches(snapshot.val() || {}));

    const logsRef = ref(database, `${basePath}/logs`);
    const unsubscribeLogs = onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, log]) => ({ id, ...log })) : [];
      setLogs(list.reverse());
    });

    return () => { unsubscribeRoom(); unsubscribePlayers(); unsubscribeMatches(); unsubscribeLogs(); };
  }, [basePath]);

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
        const mainField = field;
        const otherField = field === 'wins' ? 'losses' : 'wins';
        update(ref(database, `${basePath}/players/${player.id}`), { [mainField]: Math.max(0, (player[mainField] || 0) + change) });
        update(ref(database, `${basePath}/players/${targetPlayerId}`), { [otherField]: Math.max(0, (targetPlayer[otherField] || 0) + change) });
        addLog(`${change > 0 ? '+' : ''}${change} ${field === 'wins' ? 'Victoire' : 'Défaite'} "${player.name}" : ${change > 0 ? '+' : ''}${change} ${otherField === 'wins' ? 'Victoire' : 'Défaite'} "${targetPlayer.name}"`, change > 0 ? 'manual_plus' : 'manual_minus');
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
    const wP = players.find(p => p.id === winner);
    const lP = players.find(p => p.id === loser);
    update(ref(database, `${basePath}/players/${winner}`), { wins: (wP.wins || 0) + 1 });
    update(ref(database, `${basePath}/players/${loser}`), { losses: (lP.losses || 0) + 1 });
    const matchId = [wP.name, lP.name].sort().join('_vs_');
    const existing = matches[matchId] || { p1: wP.name, p2: lP.name, w1: 0, w2: 0, count: 0 };
    const isW1 = wP.name === existing.p1;
    set(ref(database, `${basePath}/matches/${matchId}`), { 
      p1: existing.p1, p2: existing.p2, 
      w1: isW1 ? existing.w1 + 1 : existing.w1, 
      w2: !isW1 ? existing.w2 + 1 : existing.w2, 
      count: existing.count + 1 
    });
    addLog(`MATCH:${wP.name}|${lP.name}`, 'match');
    setMatchPopup({ winner: wP.name, loser: lP.name });
    setTimeout(() => setMatchPopup(null), 3000);
    setWinner(''); setLoser('');
  };

  const resetAction = (type, path) => {
    if (prompt(`Vider ${type} ?`) === 'root') {
      if (type === 'classement') players.forEach(p => update(ref(database, `${basePath}/players/${p.id}`), { wins: 0, losses: 0 }));
      else set(ref(database, `${basePath}/${path}`), null);
      addLog(`Réinitialisation ${type}`, 'reset');
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
                <p>Sélectionner un joueur cible.</p>
                <select value={targetPlayerId} onChange={(e) => setTargetPlayerId(e.target.value)} style={selectStyle}>
                  <option value="">Choisir...</option>
                  {players.filter(p => p.id !== modalAction?.player?.id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={executeAdjustment} style={{...modalBtnStyle, background: '#007bff'}}>Valider</button>
              <button onClick={() => setIsModalOpen(false)} style={{...modalBtnStyle, background: '#666'}}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      <button onClick={onLeave} style={{ background: '#ff4d4d', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', color: 'white', marginBottom: '10px' }}>↩</button>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2>{config.icon} {config.name} : {roomName}</h2>
        <button onClick={() => setIsAddPlayerOpen(!isAddPlayerOpen)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><span style={whiteIconStyle}>➕</span></button>
      </div>

      {isAddPlayerOpen && (
        <div style={{ background: '#333', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
          <input value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Nom" style={{width: '100%', marginBottom: '10px', padding: '8px'}} />
          <button onClick={addPlayer} style={{width: '100%', padding: '10px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px'}}>Ajouter</button>
        </div>
      )}

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
          <button onClick={() => removePlayer(p.id, p.name)} style={btnAction}>🗑️</button>
        </div>
      ))}
      
      {/* Ajoutez ici la suite de votre JSX original (Matches et Logs) pour clore le composant */}
    </div>
  );
}
