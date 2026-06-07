import React, { useState, useEffect } from 'react';
import { ref, onValue, push, remove } from 'firebase/database';
import { database } from '../services/firebase';

export default function RoomListPage({ sport, onBack, onJoin }) {
  const [rooms, setRooms] = useState({});
  const [newRoomName, setNewRoomName] = useState('');

  useEffect(() => {
    // On ne récupère que les salles liées au sport sélectionné
    const roomsRef = ref(database, `rooms/${sport}`);
    return onValue(roomsRef, (s) => setRooms(s.val() || {}));
  }, [sport]);

  const createRoom = () => {
    if (!newRoomName) return;
    push(ref(database, `rooms/${sport}`), { name: newRoomName, createdAt: Date.now() });
    setNewRoomName('');
  };

  return (
    <div className="card">
      <button onClick={onBack}>← Retour aux sports</button>
      <h2>Salles de {sport}</h2>
      
      <input placeholder="Nom de la partie" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} className="join-input" />
      <button onClick={createRoom} className="btn-primary" style={{width: '100%'}}>Créer une partie</button>

      <h3>Rejoindre :</h3>
      {Object.entries(rooms).map(([id, data]) => (
        <button key={id} onClick={() => onJoin(id)} className="btn-primary" style={{display:'block', width:'100%', marginBottom:'5px'}}>
          {data.name}
        </button>
      ))}
    </div>
  );
}
