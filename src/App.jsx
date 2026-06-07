import React, { useState, useEffect } from 'react';
import { auth } from './services/firebase';
import HomePage from './components/HomePage';
import DashboardPage from './components/DashboardPage';
import GamePage from './components/GamePage';
// Importez vos futurs fichiers ici (ex: import PingPongPage from './components/PingPongPage';)

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login'); // login -> dashboard -> game
  const [gamePage, setGamePage] = useState(null); // 'billard', 'pingpong', etc.

  useEffect(() => {
    return auth.onAuthStateChanged((u) => {
      setUser(u);
      setView(u ? 'dashboard' : 'login');
    });
  }, []);

  const renderGame = () => {
    switch(gamePage) {
      case 'billard': return <GamePage roomId="BILLARD" onLeave={() => setView('dashboard')} />;
      // Ajoutez les autres cas : case 'pingpong': return <PingPongPage ... />
      default: return <GamePage roomId="BILLARD" onLeave={() => setView('dashboard')} />;
    }
  };

  if (view === 'login') return <HomePage onUserLogin={() => setView('dashboard')} />;
  if (view === 'dashboard') return <DashboardPage onSelectGame={(g) => { setGamePage(g); setView('game'); }} onLogout={() => auth.signOut()} />;
  if (view === 'game') return renderGame();

  return null;
}
