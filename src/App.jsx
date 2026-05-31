import '@/styles/index.css';
import React, { useEffect, useState } from 'react';
import { getCurrentUser } from '@/services/auth';
import HomePage from '@/pages/HomePage';
import GamePage from '@/pages/GamePage';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentGame, setCurrentGame] = useState(null);

  useEffect(() => {
    const initializeUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Erreur initialisation utilisateur:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-billard-green">
        <div className="text-white text-center">
          <h1 className="text-4xl font-bold mb-4">🎱 Billard Scores</h1>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <HomePage onUserLogin={setUser} />;
  }

  return currentGame ? (
    <GamePage gameId={currentGame} onExit={() => setCurrentGame(null)} />
  ) : (
    <HomePage onGameSelect={setCurrentGame} user={user} />
  );
}

export default App;