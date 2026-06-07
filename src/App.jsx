import React, { useState, useEffect } from 'react';
import { auth } from './services/firebase';
import HomePage from './components/HomePage';
import DashboardPage from './components/DashboardPage';
import RoomListPage from './components/RoomListPage';
import GamePage from './components/GamePage'; 

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login'); // 'login' | 'dashboard' | 'room-list' | 'game'
  const [selectedSport, setSelectedSport] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState(null);

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
            onSelectSport={(sport) => { 
              setSelectedSport(sport); 
              setView('room-list'); 
            }} 
            onLogout={() => auth.signOut()} 
          />
        );

      case 'room-list':
        return (
          <RoomListPage 
            sport={selectedSport} 
            onBack={() => setView('dashboard')}
            onJoin={(roomId) => { 
              setSelectedRoomId(roomId); 
              setView('game'); 
            }}
          />
        );

      case 'game':
        return (
          <GamePage 
            roomId={selectedRoomId} 
            sport={selectedSport}
            onLeave={() => setView('room-list')} 
          />
        );

      default:
        return <HomePage onUserLogin={() => setView('dashboard')} />;
    }
  };

  return <div className="container">{renderCurrentView()}</div>;
}
