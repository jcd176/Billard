import React, { useState, useEffect } from 'react';
import { ref, onValue, remove, push, update, set } from 'firebase/database';
import { database } from '../services/firebase';

export default function GamePage({ roomId, onLeave }) {
  const [players, setPlayers] = useState([]);
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

    const logsRef = ref(database, `rooms/${roomId}/logs`);
    const unsubscribeLogs = onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, log]) => ({ id, ...log })) : [];
      setLogs(list.reverse().slice(0, 10)); 
    });

    return () => { unsubscribePlayers(); unsubscribeLogs(); };
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
    
    addLog(`MATCH:${wPlayer.name}|${lPlayer.name}`, 'match');
    setWinner(''); setLoser('');
  };

  const resetLogs = () => {
    if (prompt("Mot de passe pour vider l'historique ?") === 'root') {
      set(ref(database, `rooms/${roomId}/logs`), null);
      addLog("Remise à zéro de l'historique !", 'reset');
    } else {
      alert("Mot de passe incorrect !");
    }
  };

  const resetCounters = () => {
    if (prompt("Mot de passe pour vider les compteurs ?") === 'root') {
      players.forEach(p => {
        update(ref(database, `rooms/${roomId}/players/${p.id}`), { wins: 0, losses: 0 });
      });
      addLog("Remise à zéro des compteurs !", 'reset');
    } else {
      alert("Mot de passe incorrect !");
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
      alert("Mot de passe incorrect !");
      addLog(`Tentative de suppression de ${playerName} échouée`, 'failed_remove');
    }
  };

  return (
    <div className="card">
      <button onClick={onLeave} style={{marginBottom: '10px'}}>← Retour</button>
      <h2>Salle : {roomId}</h2>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '5px' }}>
        <input value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Nom du joueur" />
        <button onClick={addPlayer} className="btn-primary">Ajouter</button>
      </div>

      <div style={{ background: '#333', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
        <select value={winner} onChange={(e) => setWinner(e.target.value)} style={{width: '100%', marginBottom: '5px'}}>
          <option value="">👑 Vainqueur</option>
          {players.map(p => <option key={p.id} value={p.id}>👑 {p.name}</option>)}
        </select>
        <select value={loser} onChange={(e) => setLoser(e.target.value)} style={{width: '100%', marginBottom: '10px'}}>
          <option value="">🎱 Perdant</option>
          {players.map(p => <option key={p.id} value={p.id}>🎱 {p.name}</option>)}
        </select>
        <button onClick={declareMatch} className="btn-primary" style={{width: '100%'}}>Déclarer Match</button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Classement :</h3>
        <button onClick={resetCounters} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>↻</button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #444' }}>
            <th style={{ textAlign: 'left' }}>Joueur</th>
            <th>Vict</th>
            <th>Déf</th>
            <th>%Vict</th>
            <th></th> {/* En-tête vide */}
          </tr>
        </thead>
        <tbody>
          {players.map((p, index) => {
            const total = (p.wins || 0) + (p.losses || 0);
            const winRate = total > 0 ? Math.round(((p.wins || 0) / total) * 100) : 0;
            return (
              <tr key={p.id} style={{ borderBottom: '1px solid #222' }}>
                <td style={{ padding: '8px' }}>
                  {index === 0 && <span style={{marginRight: '5px'}}>👑</span>}
                  {p.name}
                </td>
                <td>
                  {p.wins || 0}
                  <button onClick={() => adjustScore(p, 'plus', 'wins')} style={{border: 'none', background: 'none', cursor: 'pointer'}}>🟢</button>
                  <button onClick={() => adjustScore(p, 'minus', 'wins')} style={{border: 'none', background: 'none', cursor: 'pointer'}}>🔴</button>
                </td>
                <td>
                  {p.losses || 0}
                  <button onClick={() => adjustScore(p, 'plus', 'losses')} style={{border: 'none', background: 'none', cursor: 'pointer'}}>🟢</button>
                  <button onClick={() => adjustScore(p, 'minus', 'losses')} style={{border: 'none', background: 'none', cursor: 'pointer'}}>🔴</button>
                </td>
                <td style={{textAlign: 'center'}}>{winRate}%</td>
                <td style={{textAlign: 'center'}}>
                  <button onClick={() => removePlayer(p.id, p.name)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '20px' }}>🎱</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
        <h3>Historique :</h3>
        <button onClick={resetLogs} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>↻</button>
      </div>
      <div style={{ background: '#111', padding: '10px', borderRadius: '5px', fontSize: '14px' }}>
        {logs.map((log) => (
          <div key={log.id} style={{ marginBottom: '5px' }}>
            {log.type === 'match' ? (
              <span>
                <span style={{color: '#00FF00'}}>{log.message.split('MATCH:')[1].split('|')[0]} 👑</span>
                <span style={{color: '#FFFFFF'}}> a gagné contre </span>
                <span style={{color: '#FF0000'}}>{log.message.split('|')[1]} 🎱</span>
              </span>
            ) : (
              <span style={{color: log.type === 'add' ? '#00FF00' : (log.type === 'remove' ? '#FF0000' : (log.type === 'failed_remove' ? '#DA70D6' : '#FFD700'))}}>
                {log.message}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
