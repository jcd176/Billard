import React, { useState, useEffect } from 'react';
import { ref, onValue, remove, push } from 'firebase/database';
import { auth, database } from '../services/firebase';

export default function GamePage({ roomId, onLeave }) {
  const [playersInRoom, setPlayersInRoom] = useState([]);
  const user = auth.currentUser;

  useEffect(() => {
    // On pointe directement vers la liste des joueurs de la salle
    const roomPlayersRef = ref(database, `rooms/${roomId}/players`);
    
    return onValue(roomPlayersRef, (snapshot) => {
      const data = snapshot.val();
      // On transforme l'objet en tableau pour pouvoir faire le .map()
      const list = data ? Object.entries(data).map(([id, p]) => ({ 
        id, 
        name: typeof p === 'string' ? p : p.name 
      })) : [];
      setPlayersInRoom(list);
    });
  }, [roomId]);

  const removePlayerFromRoom = (playerId, playerName) => {
    const password = prompt("Saisissez le mot de passe pour supprimer " + playerName + ":");
    if (password !== 'root') {
      alert("Mot de passe incorrect !");
      return;
    }
    
    remove(ref(database, `rooms/${roomId}/players/${playerId}`));
    
    push(ref(database, 'globalLogs'), { 
      action: `a supprimé le joueur '${playerName}' de la salle '${roomId}'`, 
      user: user?.displayName || user?.email || "Admin", 
      time: Date.now(), 
      type: 'deleted' 
    });
  };

  return (
    <div className="card">
      <button onClick={onLeave} style={{marginBottom: '10px'}}>← Retour</button>
      <h2>Salle : {roomId}</h2>
      
      <h3>Joueurs présents :</h3>
      {playersInRoom.length > 0 ? (
        playersInRoom.map((player) => (
          <div key={player.id} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '10px',
            background: '#333',
            borderRadius: '8px',
            marginBottom: '8px',
            color: 'white'
          }}>
            <span style={{ fontSize: '18px' }}>{player.name}</span>
            
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
        ))
      ) : (
        <p style={{color: '#888'}}>Aucun joueur dans cette salle pour le moment.</p>
      )}
    </div>
  );
}
