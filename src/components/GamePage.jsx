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
      {matchPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div style={{ background: '#222', padding: '30px', borderRadius: '15px', border: '2px solid #0f0', textAlign: 'center', color: '#fff' }}>
             <div style={{ fontSize: '60px', marginBottom: '10px' }}>🎱</div>
             <h2 style={{ margin: '0', fontSize: '24px' }}>{matchPopup.winner}👑 vs {matchPopup.loser}🎱</h2>
          </div>
        </div>
      )}

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

      <button onClick={onLeave} style={{ marginBottom: '10px' }}>← Retour</button>
      
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <h2 style={{ margin: 0 }}>Salle : {roomId}</h2>
        <button 
          onClick={() => setIsAddPlayerOpen(!isAddPlayerOpen)} 
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px', display: 'flex', alignItems: 'center' }}
        >
          <span style={whiteIconStyle}>➕</span>
          <span style={{...whiteIconStyle, marginLeft: '4px'}}>👤</span>
        </button>

        {playerPopup && (
            <div style={{ position: 'absolute', top: '40px', right: '0', zIndex: 4000, background: 'transparent', padding: '20px', borderRadius: '15px', border: '2px solid #0f0', textAlign: 'center', color: '#fff', width: '250px' }}>
                <div style={{ fontSize: '40px', marginBottom: '5px' }}>🎱</div>
                <div style={{ fontSize: '16px' }}><span style={{ color: '#0f0' }}>{playerPopup}</span> a rejoint la salle</div>
            </div>
        )}

        {isAddPlayerOpen && (
          <div style={{ position: 'absolute', top: '40px', right: '0', background: '#333', padding: '15px', borderRadius: '8px', zIndex: 3000, width: '200px', boxShadow: '0 4px 10px rgba(0,0,0,0.5)', border: '1px solid #555' }}>
            <input 
                value={newPlayerName} 
                onChange={(e) => setNewPlayerName(e.target.value)} 
                placeholder="Nom du joueur" 
                style={{width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px', border: 'none', boxSizing: 'border-box'}} 
            />
            <div style={{ display: 'flex', gap: '5px' }}>
                <button onClick={addPlayer} style={{...modalBtnStyle, background: '#007bff', color: '#fff', fontSize: '14px'}}>Ajouter</button>
                <button onClick={() => setIsAddPlayerOpen(false)} style={{...modalBtnStyle, background: '#666', color: '#fff', fontSize: '14px'}}>Fermer</button>
            </div>
          </div>
        )}
      </div>
      
      <div style={{ background: '#333', padding: '15px', borderRadius: '5px', marginBottom: '20px', marginTop: '15px' }}>
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Classement :</h3>
        <div>
            <button onClick={() => setShowRanking(!showRanking)} style={{...btnReset, fontSize: '14px', marginRight: '10px'}}>{showRanking ? '▲' : '▼'}</button>
            <button onClick={() => resetAction('classement', 'players')} style={btnReset}>↻</button>
        </div>
      </div>
      {showRanking && (
        <table style={{ width: '100%', color: '#fff', borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: '1px solid #444' }}><th>Joueur</th><th>Vict</th><th>Déf</th><th>%</th><th></th></tr></thead>
            <tbody>
            {players.map((p, i) => {
                const total = (p.wins || 0) + (p.losses || 0);
                const winRate = total > 0 ? Math.round(((p.wins || 0) / total) * 100) : 0;
                return (
                <tr key={p.id} style={{ borderBottom: '1px solid #222' }}>
                    <td>{i === 0 && '👑 '}{p.name}</td>
                    <td>{p.wins || 0}
                    <span style={{ display: 'inline-flex', flexDirection: 'column', marginLeft: '8px', verticalAlign: 'middle' }}>
                        <button onClick={() => { setModalAction({player: p, type: 'plus', field: 'wins'}); setIsModalOpen(true); }} style={btnAction}>🟢</button>
                        <button onClick={() => { setModalAction({player: p, type: 'minus', field: 'wins'}); setIsModalOpen(true); }} style={btnAction}>🔴</button>
                    </span>
                    </td>
                    <td>{p.losses || 0}
                    <span style={{ display: 'inline-flex', flexDirection: 'column', marginLeft: '8px', verticalAlign: 'middle' }}>
                        <button onClick={() => { setModalAction({player: p, type: 'plus', field: 'losses'}); setIsModalOpen(true); }} style={btnAction}>🟢</button>
                        <button onClick={() => { setModalAction({player: p, type: 'minus', field: 'losses'}); setIsModalOpen(true); }} style={btnAction}>🔴</button>
                    </span>
                    </td>
                    <td>{winRate}%</td>
                    <td><button onClick={() => removePlayer(p.id, p.name)} style={{...btnAction, fontSize: '28px'}}>🎱</button></td>
                </tr>
                );
            })}
            </tbody>
        </table>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
        <h3>Suivi des rencontres :</h3>
        <div>
            <button onClick={() => setShowMatches(!showMatches)} style={{...btnReset, fontSize: '14px', marginRight: '10px'}}>{showMatches ? '▲' : '▼'}</button>
            <button onClick={() => resetAction('suivi', 'matches')} style={btnReset}>↻</button>
        </div>
      </div>
      {showMatches && (
        <div style={{ background: '#222', padding: '10px', borderRadius: '5px' }}>
            {Object.entries(matches).map(([id, m]) => {
            const leader = m.w1 >= m.w2 ? { name: m.p1, score: m.w1 } : { name: m.p2, score: m.w2 };
            const follower = m.w1 >= m.w2 ? { name: m.p2, score: m.w2 } : { name: m.p1, score: m.w1 };
            return (
                <div key={id} style={{ marginBottom: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>👑 {leader.name} ({leader.score}) vs 🎱 {follower.name} ({follower.score})</span>
                <button onClick={() => { setModalAction({matchId: id, matchNames: `${m.p1} vs ${m.p2}`, p1Name: m.p1, p2Name: m.p2, w1: m.w1, w2: m.w2}); setIsModalOpen(true); }} style={{...btnAction, fontSize: '24px'}}>🎱</button>
                </div>
            );
            })}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
        <h3>Historique :</h3>
        <div>
            <button onClick={() => setShowHistory(!showHistory)} style={{...btnReset, fontSize: '14px', marginRight: '10px'}}>{showHistory ? '▲' : '▼'}</button>
            <button onClick={() => resetAction('historique', 'logs')} style={btnReset}>↻</button>
        </div>
      </div>
      {showHistory && (
        <div style={{ background: '#111', padding: '10px', borderRadius: '5px', fontSize: '14px', maxHeight: '300px', overflowY: 'auto' }}>
            {logs.map(log => (
            <div key={log.id} style={{ marginBottom: '5px' }}>
                <span style={{ color: '#888' }}>{formatDate(log.timestamp)} </span>
                {log.type === 'match' ? (
                <span><span style={{ color: '#0f0' }}>{log.message.split('|')[0].replace('MATCH:', '')}👑</span> vs <span style={{ color: '#f00' }}>{log.message.split('|')[1]}🎱</span></span>
                ) : (
                <span style={{ 
                    color: log.type === 'error' ? '#EE82EE' : 
                        log.type === 'add' ? '#0f0' : 
                        log.type === 'remove' ? '#f00' : 
                        log.type === 'manual_plus' ? '#00BFFF' : 
                        log.type === 'manual_minus' ? '#800000' : '#FFD700' 
                }}>
                    {log.message}
                </span>
                )}
            </div>
            ))}
        </div>
      )}
    </div>
  );
}
