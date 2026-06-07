import React, { useState, useEffect } from 'react';
import { auth } from './services/firebase';
import HomePage from './components/HomePage';
import DashboardPage from './components/DashboardPage';
import GamePage from './components/GamePage';
// Ajoutez vos imports pour les autres pages ici
// import PingPongPage from './components/PingPongPage';

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login'); // 'login', 'dashboard', 'game'
  const [activeGame, setActiveGame] = useState(null);

  useEffect(() => {
    return auth.onAuthStateChanged((u) => {
      if (u) {
        setUser(u);
        setView('dashboard');
      } else {
        setUser(null);
        setView('login');
      }
    });
  }, []);

  const renderCurrentView = () => {
    switch (view) {
      case 'login':
        return <HomePage onUserLogin={() => setView('dashboard')} />;
      case 'dashboard':
        return (
          <DashboardPage 
            user={user} 
            onSelectGame={(game) => { setActiveGame(game); setView('game'); }} 
            onLogout={() => auth.signOut()} 
          />
        );
      case 'game':
        return (
          <GamePage 
            roomId={activeGame?.toUpperCase() || 'SALLE'} 
            onLeave={() => setView('dashboard')} 
          />
        );
      default:
        return <HomePage onUserLogin={() => setView('dashboard')} />;
    }
  };

  return <div className="container">{renderCurrentView()}</div>;
}
