import React, { useState, useEffect } from 'react';
import { ref, onValue, remove, push, update, set } from 'firebase/database';
import { database } from '../services/firebase';

export default function GamePage({ roomId, onLeave }) {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState({});
  const [logs, setLogs] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [winner, setWinner] = useState('');
  const [loser, setLoser] = useState('');

  useEffect(() => {
    const playersRef = ref(database, `rooms/${roomId}/players`);
    const unsubscribePlayers = onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, p]) => ({ id, ...p })) : [];
      setPlayers(list.sort((a, b) => (b.wins || 0) - (a.wins || 0)));
    });

    const matchesRef = ref(database, `rooms/${roomId}/matches`);
    const unsubscribeMatches = onValue(matchesRef, (snapshot) => {
      setMatches(snapshot.val() || {});
    });

    const logsRef = ref(database, `rooms/${roomId}/logs`);
    const unsubscribeLogs = onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, log]) => ({ id, ...log })) : [];
      setLogs(list.reverse().slice(0, 10)); 
    });

    return () => { unsubscribePlayers(); unsubscribeMatches(); unsubscribeLogs(); };
  }, [roomId]);

  const addLog = (message, type) => {
    push(ref(database, `rooms/${roomId}/logs`), { message, type, timestamp: Date.now() });
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
    const existing = matches[matchKey] || { p1Name: wPlayer.name, p2Name: lPlayer.name, wins: 0 };
    update(ref(database, `rooms/${roomId}/matches/${matchKey}`), { 
        p1Name: wPlayer.name, p2Name: lPlayer.name, wins: (existing.wins || 0) + 1 
    });
    addLog(`MATCH:${wPlayer.name}|${lPlayer.name}`, 'match');
    setWinner(''); setLoser('');
  };

  const resetLogs = () => {
    if (prompt("Mot de passe pour vider l'historique ?") === 'root') {
      set(ref(database, `rooms/${roomId}/logs`), null);
      addLog("Remise à zéro de l'historique !", 'reset');
    } else {
      addLog("Tentative de réinitialisation de l'historique échouée par utilisateur", 'error');
    }
  };

  const resetCounters = () => {
    if (prompt("Mot de passe pour vider les compteurs ?") === 'root') {
      players.forEach(p => update(ref(database, `rooms/${roomId}/players/${p.id}`), { wins: 0, losses: 0 }));
      set(ref(database, `rooms/${roomId}/matches`), null);
      addLog("Remise à zéro des compteurs et rencontres !", 'reset');
    } else {
      addLog("Tentative de réinitialisation des scores par utilisateur à échouée", 'error');
    }
  };

  const adjustScore = (player, type, field) => {
    const currentVal = player[field] || 0;
    const newVal = type === 'plus' ? currentVal + 1 : Math.max(0, currentVal - 1);
    update(ref(database, `rooms/${roomId}/players/${player.id}`), { [field]: newVal });
  };

  const removePlayer = (playerId, playerName) => {
    if (prompt("Saisissez le mot de passe") === 'root') {
      remove(ref(database, `rooms/${roomId}/players/${playerId}`));
      addLog(`${playerName} a été supprimé`, 'remove');
    } else {
      addLog("Tentative de suppression de joueur par utilisateur à échouée", 'error');
    }
  };

  return (
    <div className="card">
      <button onClick={onLeave} style={{marginBottom: '10px'}}>← Retour</button>
      <h2>Salle : {roomId}</h2>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '5px' }}>
        <input value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Nom du joueur" />
        <button onClick={addPlayer}>Ajouter</button>
      </div>

      <div style={{ background: '#333', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
        <select value={winner} onChange={(e) => setWinner(e.target.value)} style={{width: '100%', marginBottom: '5px'}}><option value="">👑 Vainqueur</option>{players.map(p => <option key={p.id} value={p.id}>👑 {p.name}</option>)}</select>
        <select value={loser} onChange={(e) => setLoser(e.target.value)} style={{width: '100%', marginBottom: '10px'}}><option value="">🎱 Perdant</option>{players.map(p => <option key={p.id} value={p.id}>🎱 {p.name}</option>)}</select>
        <button onClick={declareMatch} style={{width: '100%'}}>Déclarer Match</button>
      </div>

      <h3>Classement : <button onClick={resetCounters} style={{background:'transparent', border:'none', cursor:'pointer'}}>↻</button></h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #444' }}>
            <th style={{ textAlign: 'left', padding: '8px' }}>Joueur</th><th>Vict</th><th>Déf</th><th>%</th><th></th>
          </tr>
        </thead>
        <tbody>
          {players.map((p, index) => (
            <tr key={p.id} style={{ borderBottom: '1px solid #222' }}>
              <td style={{ padding: '8px' }}>{index === 0 && '👑 '}{p.name}</td>
              <td style={{ padding: '8px' }}>{p.wins || 0} <button onClick={() => adjustScore(p, 'plus', 'wins')} style={{border:'none', background:'none', cursor:'pointer'}}>🟢</button><button onClick={() => adjustScore(p, 'minus', 'wins')} style={{border:'none', background:'none', cursor:'pointer'}}>🔴</button></td>
              <td style={{ padding: '8px' }}>{p.losses || 0} <button onClick={() => adjustScore(p, 'plus', 'losses')} style={{border:'none', background:'none', cursor:'pointer'}}>🟢</button><button onClick={() => adjustScore(p, 'minus', 'losses')} style={{border:'none', background:'none', cursor:'pointer'}}>🔴</button></td>
              <td style={{textAlign: 'center'}}>{((p.wins || 0) + (p.losses || 0)) > 0 ? Math.round(((p.wins || 0) / ((p.wins || 0) + (p.losses || 0))) * 100) : 0}%</td>
              <td style={{textAlign: 'center'}}><button onClick={() => removePlayer(p.id, p.name)} style={{background:'transparent', border:'none', cursor:'pointer'}}>🎱</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Suivi des rencontres : <button onClick={resetCounters} style={{background:'transparent', border:'none', cursor:'pointer'}}>↻</button></h3>
      <div style={{ background: '#222', padding: '10px', borderRadius: '5px', marginBottom: '20px' }}>
        {Object.values(matches).map((m, i) => (<div key={i}>{m.p1Name} vs {m.p2Name} : {m.wins} v</div>))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Historique :</h3>
        <button onClick={resetLogs} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>↻</button>
      </div>
      <div style={{ background: '#111', padding: '10px', borderRadius: '5px', fontSize: '14px' }}>
        {logs.map((log) => (
          <div key={log.id} style={{ marginBottom: '5px', color: log.type === 'error' ? '#BA55D3' : (log.type === 'match' ? '#fff' : '#FFD700') }}>
            {log.type === 'match' ? (
              <span><span style={{color: '#00FF00'}}>{log.message.split('MATCH:')[1].split('|')[0]} 👑</span> vs <span style={{color: '#FF0000'}}>{log.message.split('|')[1]} 🎱</span></span>
            ) : log.message}
          </div>
        ))}
      </div>
    </div>
  );
}
