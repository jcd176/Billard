import React, { useState, useEffect } from 'react';
import { ref, onValue, push, remove } from 'firebase/database';
import { database } from '../services/firebase';

export default function RoomListPage({ sport, onBack, onJoin }) {
  const [rooms, setRooms] = useState({});
  const [newRoomName, setNewRoomName] = useState('');

  useEffect(() => {
    const roomsRef = ref(database, `rooms/${sport}`);
    return onValue(roomsRef, (s) => setRooms(s.val() || {}));
  }, [sport]);

  const createRoom = () => {
    if (!newRoomName.trim()) return;
    push(ref(database, `rooms/${sport}`), { name: newRoomName, createdAt: Date.now() });
    setNewRoomName('');
  };

  return (
    <div className="card">
      <button onClick={onBack}>← Retour</button>
      <h2>Salles : {sport}</h2>
      
      <input className="join-input" placeholder="Nom de la salle" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} />
      <button onClick={createRoom} className="btn-primary" style={{width: '100%', marginBottom: '20px'}}>Créer</button>

      {Object.entries(rooms).map(([id, data]) => (
        <div key={id} style={{display: 'flex', gap: '10px', marginBottom: '5px'}}>
          <button onClick={() => onJoin(id)} style={{flex: 1}}>{data.name}</button>
          <button onClick={() => remove(ref(database, `rooms/${sport}/${id}`))}>🗑️</button>
        </div>
      ))}
    </div>
  );
}
