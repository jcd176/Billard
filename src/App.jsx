import React, { useState, useEffect } from 'react';
import { auth } from './services/firebase';
import HomePage from './components/HomePage';
import GamePage from './components/GamePage';

export default function App() {
  const [user, setUser] = useState(null);
  const [roomId, setRoomId] = useState(null); // Gère la partie active

  useEffect(() => {
    return auth.onAuthStateChanged(setUser);
  }, []);

  if (!user) return <HomePage onUserLogin={setUser} />;

  // Si on a un roomId, on affiche la page de jeu
  if (roomId) {
    return <GamePage roomId={roomId} onLeave={() => setRoomId(null)} />;
  }

  // Sinon, on affiche un menu simple pour choisir une partie
  return (
    <div className="container">
      <div className="card">
        <h2>Bienvenue, {user.displayName}</h2>
        <button className="btn-primary" onClick={() => setRoomId('partie-test-1')}>
          Accéder à la partie test
        </button>
      </div>
    </div>
  );
}
