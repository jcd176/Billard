import React, { useState, useEffect } from 'react';
import { auth } from './services/firebase';
import HomePage from './components/HomePage';

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    return auth.onAuthStateChanged(setUser);
  }, []);

  return (
    <div>
      {!user ? (
        <HomePage onUserLogin={setUser} />
      ) : (
        <div className="container">
            <div className="card">
                <h2>Bienvenue, {user.displayName}</h2>
                {/* Ici votre logique de jeu */}
            </div>
        </div>
      )}
    </div>
  );
}
