import React, { useState, useEffect } from 'react';
import { auth } from './services/firebase';
import HomePage from './components/HomePage';
// Importez vos autres pages si elles existent
// import GamePage from './components/GamePage'; 

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gameId, setGameId] = useState(null); // Gère si on est en jeu

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return <div className="text-white text-center mt-20">Chargement...</div>;

  return (
    <div className="container">
      {!user ? (
        // Si pas connecté, on montre la page de login/home
        <HomePage onUserLogin={setUser} />
      ) : !gameId ? (
        // Si connecté mais pas en partie, on montre le sélecteur de partie
        <div className="card">
          <h2>Bienvenue, {user.displayName}</h2>
          <p style={{ color: '#aaa' }}>Que voulez-vous faire ?</p>
          <button 
            className="btn-primary" 
            onClick={() => alert("Interface de création à venir")}
          >
            Créer une nouvelle partie
          </button>
        </div>
      ) : (
        // Si gameId existe, on affiche le composant de jeu
        <div className="card">
          <h2>Partie en cours : {gameId}</h2>
          {/* <GamePage gameId={gameId} /> */}
        </div>
      )}
    </div>
  );
}
