import React, { useState, useEffect } from 'react';
import { ref, onValue, set, remove } from 'firebase/database';
import { auth, database } from './services/firebase';
import HomePage from './components/HomePage';
import GamePage from './components/GamePage';

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('menu'); // 'menu', 'create', 'game'
  const [roomId, setRoomId] = useState(null);
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    return auth.onAuthStateChanged(setUser);
  }, []);

  useEffect(() => {
    const roomsRef = ref(database, 'rooms');
    return onValue(roomsRef, (snapshot) => {
      const data = snapshot.val();
      setRooms(data ? Object.keys(data) : []);
    });
  }, []);

  if (!user) return <HomePage onUserLogin={setUser} />;

  const createRoom = (name) => {
    if (!name) return;
    set(ref(database, `rooms/${name}`), { name, createdAt: Date.now(), scores: {} });
    setRoomId(name);
    setView('game');
  };

  return (
    <div className="container">
      {view === 'menu' && (
        <div className="card">
          <h2>Bienvenue, {user.displayName}</h2>
          <button className="btn-primary" onClick={() => setView('create')} style={{ marginBottom: '15px' }}>Créer une partie</button>
          <h3>Parties disponibles :</h3>
          {rooms.map(room => (
            <div key={room} style={{ display: 'flex', gap: '10px', marginBottom: '5px' }}>
              <button className="btn-primary" style={{ background: '#333', flex: 1 }} onClick={() => { setRoomId(room); setView('game'); }}>
                {room}
              </button>
              <button onClick={() => remove(ref(database, `rooms/${room}`))} style={{ background: 'none', color: '#ff4d4d', border: '1px solid #555', borderRadius: '4px' }}>×</button>
            </div>
          ))}
        </div>
      )}

      {view === 'create' && (
        <div className="card">
          <h2>Nouvelle salle</h2>
          <input className="join-input" placeholder="Ex: Billard Club" id="newRoomName" />
          <button className="btn-primary" onClick={() => createRoom(document.getElementById('newRoomName').value)}>Lancer la partie</button>
          <button onClick={() => setView('menu')} style={{ background: 'none', color: '#888', width: '100%', marginTop: '10px' }}>Retour</button>
        </div>
      )}

      {view === 'game' && roomId && (
        <GamePage roomId={roomId} onLeave={() => { setRoomId(null); setView('menu'); }} />
      )}
    </div>
  );
}
