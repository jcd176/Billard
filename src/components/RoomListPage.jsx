import React, { useState, useEffect } from 'react';
import { ref, onValue, push, remove, update } from 'firebase/database';
import { database } from '../services/firebase';

export default function RoomListPage({ sport, onBack, onJoin }) {
  const [rooms, setRooms] = useState({});
  const [newRoomName, setNewRoomName] = useState('');

  const sportIcons = {
    'Billard': '🎱',
    'Ping Pong': '🏓',
    'Skate': '🛹',
    'Tennis': '🎾',
    'Palets': '🥏',
    'Pétanque': '🔘',
    'Baby Foot': '⚽'
  };

  useEffect(() => {
    const roomsRef = ref(database, `rooms/${sport}`);
    return onValue(roomsRef, (s) => setRooms(s.val() || {}));
  }, [sport]);

  const createRoom = () => {
    if (!newRoomName.trim()) return;
    push(ref(database, `rooms/${sport}`), { name: newRoomName, createdAt: Date.now(), isMain: false });
    setNewRoomName('');
  };

  const handleDelete = (id, isMain) => {
    if (isMain) {
      const password = prompt("Saisissez le mot de passe :");
      if (password !== 'root') return alert("Mot de passe incorrect.");
    }
    remove(ref(database, `rooms/${sport}/${id}`));
  };

  const toggleMain = (id, currentStatus) => {
    update(ref(database, `rooms/${sport}/${id}`), { isMain: !currentStatus });
  };

  return (
    <div className="card" style={{ position: 'relative', paddingTop: '80px' }}>
      {/* Bouton retour identique au Dashboard */}
      <button 
        onClick={onBack} 
        style={{
          position: 'absolute', top: '20px', left: '20px', width: '45px', height: '45px',
          borderRadius: '50%', background: '#ff4d4d', color: '#fff', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          fontSize: '28px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
        }}
      >
        ↩
      </button>

      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Salles : {sport}</h2>
      
      <input className="join-input" placeholder="Nom de la salle" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} />
      <button onClick={createRoom} className="btn-primary" style={{width: '100%', marginBottom: '40px'}}>Créer</button>

      {Object.entries(rooms).map(([id, data]) => (
        <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
          {/* Checkbox Couronne */}
          <input 
            type="checkbox" 
            checked={data.isMain || false} 
            onChange={() => toggleMain(id, data.isMain)}
            style={{ cursor: 'pointer' }}
          />
          <span>👑</span>

          {/* Bouton nom de la partie */}
          <button onClick={() => onJoin(id)} style={{ flex: 1, textAlign: 'left', padding: '10px' }}>
            {data.name}
          </button>
          
          {/* Bouton suppression avec icône spécifique au sport */}
          <button onClick={() => handleDelete(id, data.isMain)}>
            {sportIcons[sport] || '🗑️'}
          </button>
        </div>
      ))}
    </div>
  );
}
