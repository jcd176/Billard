import React, { useState, useEffect } from 'react';
import { auth } from './services/firebase';
import HomePage from './components/HomePage';
import GamePage from './components/GamePage';

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('menu'); // 'menu', 'create', 'game'
  const [roomId, setRoomId] = useState(null);

  useEffect(() => {
    return auth.onAuthStateChanged(setUser);
  }, []);

  if (!user) return <HomePage onUserLogin={setUser} />;

  return (
    <div className="container">
      {view === 'menu' && (
        <div className="card">
          <h2>Bienvenue, {user.displayName}</h2>
          <button className="btn-primary" onClick={() => setView('create')} style={{ marginBottom: '10px' }}>
            Créer une partie
          </button>
          <button className="btn-primary" style={{ background: '#444' }}>
            Rejoindre une partie
          </button>
        </div>
      )}

      {view === 'create' && (
        <div className="card">
          <h2>Nouvelle Partie</h2>
          <input className="join-input" placeholder="Nom de la salle" id="roomName" />
          <button className="btn-primary" onClick={() => { 
            const name = document.getElementById('roomName').value;
            if(name) { setRoomId(name); setView('game'); }
          }}>
            Lancer la partie
          </button>
          <button onClick={() => setView('menu')} style={{ background: 'none', color: '#888', width: '100%', marginTop: '10px' }}>
            Retour
          </button>
        </div>
      )}

      {view === 'game' && roomId && (
        <GamePage roomId={roomId} onLeave={() => { setRoomId(null); setView('menu'); }} />
      )}
    </div>
  );
}
