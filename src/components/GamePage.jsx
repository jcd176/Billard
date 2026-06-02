import React, { useState, useEffect } from 'react';
import { ref, onValue, remove, push } from 'firebase/database';
import { auth, database } from '../services/firebase';

export default function GamePage({ roomId, onLeave }) {
  const [playersInRoom, setPlayersInRoom] = useState([]);
  const user = auth.currentUser;

  useEffect(() => {
    const roomPlayersRef = ref(database, `rooms/${roomId}/players`);
    return onValue(roomPlayersRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, p]) => ({ id, ...p })) : [];
      setPlayersInRoom(list);
    });
  }, [roomId]);

  const removePlayerFromRoom = (playerId, playerName) => {
    // Protection par mot de passe "root" pour la cohérence avec le menu
    const password = prompt("Saisissez le mot de passe pour supprimer le joueur " + playerName + ":");
    if (password !== 'root') {
      alert("Mot de passe incorrect !");
      return;
    }
    
    remove(ref(database, `rooms/${roomId}/players/${playerId}`));
    
    // Ajout dans l'historique global
    push(ref(database, 'globalLogs'), { 
      action: `a supprimé le joueur '${playerName}' de la salle '${roomId}'`, 
      user: user.displayName || user.email, 
      time: Date.now(), 
      type: 'deleted' 
    });
  };

  return (
    <div className="card">
      <button onClick={onLeave} style={{marginBottom: '10px'}}>← Retour</button>
      <h2>Salle : {roomId}</h2>
      
      <h3>Joueurs présents :</h3>
      {playersInRoom.map((player) => (
        <div key={player.id} style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '8px',
          background: '#222',
          borderRadius: '4px',
          marginBottom: '8px' 
        }}>
          <span style={{ fontSize: '18px' }}>{player.name}</span>
          
          {/* Bouton de suppression remplacé par la boule N°8 */}
          <button 
            onClick={() => removePlayerFromRoom(player.id, player.name)} 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              cursor: 'pointer', 
              fontSize: '32px',
              padding: '0'
            }}
            title="Supprimer joueur"
          >
            🎱
          </button>
        </div>
      ))}
    </div>
  );
}
