import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../services/firebase';

export default function GamePage({ roomId, onLeave }) {
  // 1. Initialisation : Si roomName est vide, il affichera "Chargement..."
  const [roomName, setRoomName] = useState('Chargement...');
  
  // ... vos autres états (players, matches, etc.) ...
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState({});
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (!roomId) return;

    // 2. Le chemin exact selon vos captures d'écran :
    // "rooms" -> "pingpong" -> "ID de la salle" -> "name"
    const nameRef = ref(database, `rooms/pingpong/${roomId}/name`);
    
    const unsubscribe = onValue(nameRef, (snapshot) => {
      if (snapshot.exists()) {
        setRoomName(snapshot.val());
      } else {
        setRoomName("Nom non trouvé");
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  // Note : Assurez-vous que vos autres refs pour 'players', 'matches', 'logs' 
  // pointent vers `rooms/pingpong/${roomId}/...` si c'est là qu'ils sont stockés.

  return (
    <div className="card">
      <button onClick={onLeave}>Retour</button>
      
      {/* Affichage du nom récupéré */}
      <h2>Match : {roomName}</h2>
      
      {/* ... reste de votre interface ... */}
    </div>
  );
}
