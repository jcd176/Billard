import { useState, useEffect, useRef } from 'react';
import { ref, onValue, remove, push, update, set } from 'firebase/database';
import { database } from '../services/firebase';

export default function GamePage({ roomId, sport, onLeave }) { // Ajout de 'sport' en prop pour localiser la donnée
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState({});
  const [logs, setLogs] = useState([]);
  const [roomName, setRoomName] = useState('Chargement...'); 
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

  const whiteIconStyle = { 
    filter: 'brightness(0) invert(1)', 
    fontSize: '14px', 
    display: 'inline-block' 
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    // Correction : Utilisation du sport pour cibler le bon nœud dans Firebase
    const roomRef = ref(database, `rooms/${sport}/${roomId}/name`);
    const unsubscribeRoom = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        setRoomName(snapshot.val());
      } else {
        setRoomName("Match");
      }
    });

    const playersRef = ref(database, `rooms/${roomId}/players`);
    const unsubscribePlayers = onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, p]) => ({ id, ...p })) : [];
      const sorted = list.sort((a, b) => (b.wins || 0) - (a.wins || 0));
      
      if (sorted.length > 0) {
        const currentLeader = sorted[0];
        if (prevLeaderIdRef.current !== null && prevLeaderIdRef.current !== currentLeader.id) {
          const lastLog = logs[0]?.message;
          const msg = `Nouveau leader : ${currentLeader.name} 👑`;
          if (lastLog !== msg) {
              addLog(msg, 'leader');
          }
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

    return () => { unsubscribeRoom(); unsubscribePlayers(); unsubscribeMatches(); unsubscribeLogs(); };
  }, [roomId, sport]); 

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
          if (p1) update(ref(database, `rooms/${roomId}/players/${p1.id}`), { wins: Math.max(0, (p1.wins || 0) - w1), losses: Math.max(0, (p1.losses || 0) - w2) });
          if (p2) update(ref(database, `rooms/${roomId}/players/${p2.id}`), { wins: Math.max(0, (p2.wins || 0) - w2), losses: Math.max(0, (p2.losses || 0) - w1) });
          addLog(`Réinitialisation partie "${matchNames}"`, 'remove');
        }
      } else {
        const targetPlayer = players.find(p => p.id === targetPlayerId);
        if (!targetPlayer) return;
        const change = type === 'plus' ? 1 : -1;
        const mainField = field;
        const otherField = field === 'wins' ? 'losses' : 'wins';
        
        update(ref(database, `rooms/${roomId}/players/${player.id}`), { [mainField]: Math.max(0, (player[mainField] || 0) + change) });
        update(ref(database, `rooms/${roomId}/players/${targetPlayerId}`), { [otherField]: Math.max(0, (targetPlayer[otherField] || 0) + change) });
        
        const matchKey = [player.name, targetPlayer.name].sort().join('_vs_');
        if (matches[matchKey]) {
            const m = matches[matchKey];
            const isP1 = m.p1 === player.name;
            const updateObj = {};
            if (field === 'wins') {
                updateObj[isP1 ? 'w1' : 'w2'] = Math.max(0, (isP1 ? m.w1 : m.w2) + change);
            } else {
                updateObj[isP1 ? 'w2' : 'w1'] = Math.max(0, (isP1 ? m.w2 : m.w1) + change);
            }
            updateObj.count = Math.max(0, (m.count || 0) + change);
            update(ref(database, `rooms/${roomId}/matches/${matchKey}`), updateObj);
        }

        addLog(`${change > 0 ? '+' : ''}${change} ${field === 'wins' ? 'Victoire' : 'Défaite'} "${player.name}" : ${change > 0 ? '+' : ''}${change} ${otherField === 'wins' ? 'Victoire' : 'Défaite'} "${targetPlayer.name}"`, change > 0 ? 'manual_plus' : 'manual_minus');
      }
    } else {
      if (modalAction.matchId) {
        addLog(`Echec ${matchOption === 'delete' ? 'Suppression' : 'Réinitialisation'} partie "${modalAction.matchNames}"`, 'error');
      } else {
        addLog(`Echec modification Classement`, 'error');
      }
    }
    setTargetPlayerId('');
    setIsModalOpen(false);
  };

  const addPlayer = () => {
    const trimmedName = newPlayerName.trim();
    if (!trimmedName) return;
    if (trimmedName.length > 12) { alert("Le nom est trop long."); return; }
    const exists = players.some(p => p.name.toLowerCase() === trimmedName.toLowerCase());
    if (exists) { alert("Ce nom existe déjà."); return; }
    push(ref(database, `rooms/${roomId}/players`), { name: trimmedName, wins: 0, losses: 0 });
    
    addLog(`${trimmedName} a rejoint la salle`, 'add');
    
    setPlayerPopup(trimmedName);
    setTimeout(() => setPlayerPopup(null), 2000);
    
    setNewPlayerName('');
    setIsAddPlayerOpen(false);
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
    set(ref(database, `rooms/${roomId}/matches/${matchId}`), {
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
        players.forEach(p => update(ref(database, `rooms/${roomId}/players/${p.id}`), { wins: 0, losses: 0 }));
      } else { set(ref(database, `rooms/${roomId}/${path}`), null); }
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
  const btnAction = { border: 'none', background: 'none', cursor: 'pointer', padding: '0 4px', fontSize: '18px' };
  const selectStyle = { width: '100%', marginBottom: '10px', padding: '10px', fontSize: '16px', borderRadius: '4px', boxSizing: 'border-box' };
  const modalBtnStyle = { flex: 1, padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' };

  return (
    <div className="card">
      {/* ... (Modal logic remains same) */}
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
                    <p style={{marginBottom: '15px'}}>
                        {modalAction.type === 'plus' && modalAction.field === 'wins' ? "Sélectionner un joueur pour ajouter une défaite." :
                         modalAction.type === 'minus' && modalAction.field === 'wins' ? "Sélectionner un joueur pour retirer une défaite." :
                         modalAction.type === 'plus' && modalAction.field === 'losses' ? "Sélectionner un joueur pour ajouter une Victoire." :
                         "Sélectionner un joueur pour retirer une Victoire."}
                    </p>
                    <select value={targetPlayerId} onChange={(e) => setTargetPlayerId(e.target.value)} style={selectStyle}>
                        <option value="">Choisir un joueur</option>
                        {players.filter(p => p.id !== modalAction.player.id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </>
            )}
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button onClick={executeAdjustment} className="btn-primary" style={{...modalBtnStyle, background: '#007bff', color: '#fff'}} disabled={!modalAction.matchId && !targetPlayerId}>Valider</button>
                <button onClick={() => { setIsModalOpen(false); setTargetPlayerId(''); }} style={{...modalBtnStyle, background: '#666', color: '#fff'}}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      <button onClick={onLeave} style={{ background: '#ff4d4d', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '24px', marginBottom: '10px' }}>↩</button>
      
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '15px' }}>
        <h2 style={{ margin: 0 }}>Match : {roomName}</h2>
        <button onClick={() => setIsAddPlayerOpen(!isAddPlayerOpen)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px', display: 'flex', alignItems: 'center' }}>
          <span style={whiteIconStyle}>➕</span>
          <span style={{...whiteIconStyle, marginLeft: '4px'}}>👤</span>
        </button>
        {/* ... (Rest of component remains same) */}
      </div>
      
      {/* (Reste du code identique...) */}
    </div>
  );
}
