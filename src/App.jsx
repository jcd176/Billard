import React, { useState, useEffect } from 'react';
import { ref, onValue, set } from 'firebase/database'; // Import set
import { auth, database } from './services/firebase';
import HomePage from './components/HomePage';
import GamePage from './components/GamePage';

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('menu');
  const [roomId, setRoomId] = useState(null);
  const [rooms, setRooms] = useState([]); // Pour stocker la liste des salles

  useEffect(() => {
    return auth.onAuthStateChanged(setUser);
  }, []);

  // Écouter la liste des salles en temps réel
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
    // On initialise la salle dans Firebase
    set(ref(database, `rooms/${name}`), { name, scores: {} });
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
            <button key={room} className="btn-primary" style={{ background: '#333', marginBottom: '5px' }} 
                    onClick={() => { setRoomId(room); setView('game'); }}>
              {room}
            </button>
          ))}
        </div>
      )}

      {view === 'create' && (
        <div className="card">
          <h2>Nom de la nouvelle salle</h2>
          <input className="join-input" placeholder="Ex: Billard Club 1" id="newRoomName" />
          <button className="btn-primary" onClick={() => createRoom(document.getElementById('newRoomName').value)}>
            Créer et rejoindre
          </button>
          <button onClick={() => setView('menu')} style={{ background: 'none', color: '#888', width: '100%', marginTop: '10px' }}>Retour</button>
        </div>
      )}

      {view === 'game' && roomId && (
        <GamePage roomId={roomId} onLeave={() => { setRoomId(null); setView('menu'); }} />
      )}
    </div>
  );
}
