import React, { useState, useEffect } from 'react';
import { ref, onValue, remove, push, update } from 'firebase/database';
import { auth, database } from '../services/firebase';

export default function GamePage({ roomId, onLeave }) {
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const user = auth.currentUser;

  useEffect(() => {
    // On écoute bien les joueurs DANS la salle choisie
    const playersRef = ref(database, `rooms/${roomId}/players`);
    return onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, p]) => ({ id, ...p })) : [];
      // Tri automatique par score
      setPlayers(list.sort((a, b) => (b.wins || 0) - (a.wins || 0)));
    });
  }, [roomId]);

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    push(ref(database, `rooms/${roomId}/players`), { 
      name: newPlayerName, 
      wins: 0, 
      losses: 0 
    });
    setNewPlayerName('');
  };

  const adjustScore = (player, type) => {
    update(ref(database, `rooms/${roomId}/players/${player.id}`), {
      wins: type === 'win' ? (player.wins || 0) + 1 : Math.max(0, (player.wins || 0) - 1),
      losses: type === 'loss' ? (player.losses || 0) + 1 : Math.max(0, (player.losses || 0) - 1)
    });
  };

  const resetStats = (player) => {
    const password = prompt("Saisissez le mot de passe pour réinitialiser " + player.name + ":");
    if (password !== 'root') { alert("Mot de passe incorrect !"); return; }
    update(ref(database, `rooms/${roomId}/players/${player.id}`), { wins: 0, losses: 0 });
  };

  const removePlayer = (playerId, playerName) => {
    const password = prompt("Saisissez le mot de passe pour supprimer " + playerName + ":");
    if (password !== 'root') { alert("Mot de passe incorrect !"); return; }
    
    remove(ref(database, `rooms/${roomId}/players/${playerId}`));
    push(ref(database, 'globalLogs'), { 
      action: `a supprimé '${playerName}' de la salle '${roomId}'`, 
      user: user?.displayName || user?.email || "Admin", 
      time: Date.now(), 
      type: 'deleted' 
    });
  };

  return (
    <div className="card">
      <button onClick={onLeave} style={{marginBottom: '10px'}}>← Retour</button>
      <h2>Salle : {roomId}</h2>
      
      {/* Zone d'ajout */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '5px' }}>
        <input 
          placeholder="Nom du joueur" 
          value={newPlayerName} 
          onChange={(e) => setNewPlayerName(e.target.value)} 
        />
        <button onClick={addPlayer}>Ajouter</button>
      </div>

      <h3>Classement des joueurs :</h3>
      
      {/* Liste des joueurs */}
      {players.length > 0 ? (
        players.map((player) => (
          <div key={player.id} style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', 
            background: '#222', padding: '10px', marginBottom: '8px', borderRadius: '4px' 
          }}>
            <span style={{ flex: 1, color: '#fff' }}>{player.name}</span>
            
            <button onClick={() => adjustScore(player, 'win')}>+</button>
            <span style={{width:'60px', textAlign:'center', color: '#fff'}}>{player.wins || 0}V-{player.losses || 0}D</span>
            <button onClick={() => adjustScore(player, 'loss')}>-</button>
            
            <button onClick={() => resetStats(player)} style={{background:'none', border:'none', color:'#fff', fontSize:'20px', cursor:'pointer'}}>⟲</button>
            
            <button 
              onClick={() => removePlayer(player.id, player.name)} 
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '32px' }}
              title="Supprimer joueur"
            >
              🎱
            </button>
          </div>
        ))
      ) : (
        <p style={{color: '#aaa', fontStyle: 'italic'}}>Aucun joueur dans cette salle.</p>
      )}
    </div>
  );
}
