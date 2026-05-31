import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import GamePage from './components/GamePage';
import StatsPage from './components/StatsPage';
import ProfilesPage from './components/ProfilesPage';

export default function App() {
  const [user, setUser] = useState(null); // Gestion simple de session
  const [activeTab, setActiveTab] = useState('match');
  const [roomId, setRoomId] = useState(null);

  if (!user) return <LandingPage onLogin={setUser} />;

  return (
    <div className="min-h-screen bg-billiard-green p-4">
      <main className="max-w-2xl mx-auto">
        {activeTab === 'match' && <GamePage roomId={roomId} />}
        {activeTab === 'stats' && <StatsPage />}
        {activeTab === 'profiles' && <ProfilesPage />}
      </main>

      {/* Barre de navigation fixe */}
      <nav className="fixed bottom-0 left-0 right-0 bg-dark-wood p-4 flex justify-around border-t-2 border-gold">
        <button onClick={() => setActiveTab('match')} className="text-gold">Match</button>
        <button onClick={() => setActiveTab('stats')} className="text-gold">Stats</button>
        <button onClick={() => setActiveTab('profiles')} className="text-gold">Profils</button>
      </nav>
    </div>
  );
}
