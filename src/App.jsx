import React, { useState, useEffect } from 'react';
import { auth } from './services/firebase';
import HomePage from './components/HomePage';

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    return auth.onAuthStateChanged(setUser);
  }, []);

  return (
    <div className="container" style={{ margin: '0 auto' }}>
      {!user ? (
        <HomePage onUserLogin={setUser} />
      ) : (
        <div>
          {/* Votre contenu de jeu ici avec les classNames="card" */}
          <div className="card">
            <h2>Bienvenue {user.displayName}</h2>
          </div>
        </div>
      )}
    </div>
  );
}
