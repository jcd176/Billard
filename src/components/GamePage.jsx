import React, { useState, useEffect } from 'react';
import { ref, onValue, remove, push, update } from 'firebase/database';
import { auth, database } from '../services/firebase';

export default function GamePage({ roomId, onLeave }) {
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const user = auth.currentUser;

  useEffect(() => {
    const playersRef = ref(database, `rooms/${roomId}/players`);
    return onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, p]) => ({ id, ...p })) : [];
      // Tri par victoires si nécessaire
      setPlayers(list.sort((a, b) => (b.wins || 0) - (a.wins || 0)));
    });
  }, [roomId]);

  const addPlayer = () => {
    if (!newPlayerName) return;
    push(ref(database, `rooms/${roomId}/players`), { name: newPlayerName, wins: 0, losses: 0 });
    setNewPlayerName('');
  };

  const removePlayer = (playerId, playerName) => {
    const password = prompt("Saisissez le mot de passe pour supprimer " + playerName + ":");
    if (password !== 'root') { alert("Mot de passe incorrect !"); return; }
    
    remove(ref(database, `rooms/${roomId}/players/${playerId}`));
    push(ref(database, 'globalLogs'), { 
      action: `a supprimé '${playerName}' de la salle '${roomId}'`, 
      user: user?.email || "Admin", 
      time: Date.now(), 
      type: 'deleted' 
    });
  };

  return (
    <div className="card">
      <button onClick={onLeave} style={{marginBottom: '10px'}}>← Retour</button>
      <h2>Salle : {roomId}</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <input 
          placeholder="Nom du joueur" 
          value={newPlayerName} 
          onChange={(e) => setNewPlayerName(e.target.value)} 
        />
        <button onClick={addPlayer}>Ajouter</button>
      </div>

      <h3>Classement des joueurs :</h3>
      {players.map((player) => (
        <div key={player.id} style={{ 
          display: 'flex', alignItems: 'center', gap: '10px', 
          background: '#222', padding: '10px', marginBottom: '5px', borderRadius: '4px' 
        }}>
          <span style={{ flex: 1 }}>{player.name} ({player.wins || 0}V - {player.losses || 0}D)</span>
          
          {/* Le bouton N°8 remplace l'ancienne croix */}
          <button 
            onClick={() => removePlayer(player.id, player.name)} 
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '32px' }}
            title="Supprimer joueur"
          >
            🎱
          </button>
        </div>
      ))}
    </div>
  );
}
