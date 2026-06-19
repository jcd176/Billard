import React, { useState, useEffect } from 'react';
import { auth } from './services/firebase';
import HomePage from './components/HomePage';
import DashboardPage from './components/DashboardPage';
import RoomListPage from './components/RoomListPage';
import GamePage from './components/GamePage';
import SkatePage from './components/SkatePage';

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [selectedSport, setSelectedSport] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  useEffect(() => {
    return auth.onAuthStateChanged((u) => {
      setUser(u);
      setView(u ? 'dashboard' : 'login');
    });
  }, []);

  const renderView = () => {
    if (view === 'login') return <HomePage onUserLogin={() => setView('dashboard')} />;
    
    if (view === 'dashboard') return (
      <DashboardPage 
        user={user} 
        onSelectSport={(s) => { setSelectedSport(s); setView('room-list'); }} 
        onLogout={() => auth.signOut()} 
      />
    );
    
    if (view === 'room-list') return (
      <RoomListPage 
        sport={selectedSport} 
        onBack={() => setView('dashboard')} 
        onJoin={(id) => { setSelectedRoomId(id); setView('game'); }} 
      />
    );
    
    if (view === 'game') {
      if (selectedSport === 'skate') {
        return <SkatePage roomId={selectedRoomId} onLeave={() => setView('room-list')} />;
      }
      return (
        <GamePage 
          roomId={selectedRoomId} 
          sport={selectedSport} 
          onLeave={() => setView('room-list')} 
        />
      );
    }
  };

  return <div className="container">{renderView()}</div>;
}
