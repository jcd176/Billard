import React, { useState, useEffect } from 'react';
import { ref, onValue, push, remove } from 'firebase/database';
import { database } from '../services/firebase';

export default function DashboardPage({ user, onSelectGame, onLogout }) {
  const [rooms, setRooms] = useState({});
  const [newRoomName, setNewRoomName] = useState('');

  // Charger les salles existantes depuis Firebase
  useEffect(() => {
    const roomsRef = ref(database, 'rooms');
    return onValue(roomsRef, (s) => setRooms(s.val() || {}));
  }, []);

  const createRoom = () => {
    if (!newRoomName) return;
    push(ref(database, 'rooms'), { 
      name: newRoomName, 
      createdAt: Date.now(),
      createdBy: user.displayName 
    });
    setNewRoomName('');
  };

  const deleteRoom = (id) => {
    if (window.confirm("Supprimer cette salle ?")) {
      remove(ref(database, `rooms/${id}`));
    }
  };

  return (
    <div className="card">
      <button onClick={onLogout} style={{marginBottom: '10px'}}>← Déconnexion</button>
      <h2>Bonjour {user.displayName}</h2>

      {/* Zone de création */}
      <div style={{marginBottom: '20px'}}>
        <input 
          placeholder="Nom de la nouvelle salle" 
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
          className="join-input"
        />
        <button onClick={createRoom} className="btn-primary" style={{width: '100%', marginTop: '5px'}}>
          Créer la salle
        </button>
      </div>

      <h3>Parties en cours :</h3>
      {Object.entries(rooms).map(([id, data]) => (
        <div key={id} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <button className="btn-primary" style={{ flex: 1 }} onClick={() => onSelectGame(data.name)}>
            {data.name}
          </button>
          <button onClick={() => deleteRoom(id)} style={{ background: '#ff4d4d', color: '#fff', border: 'none', padding: '5px' }}>X</button>
        </div>
      ))}
    </div>
  );
}
