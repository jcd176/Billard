import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import GamePage from './components/GamePage';
import StatsPage from './components/StatsPage';
import ProfilesPage from './components/ProfilesPage';
import LogsPage from './components/LogsPage';

export default function App() {
  const [user, setUser] = useState(null); // Authentification
  const [roomId, setRoomId] = useState(null); // Gestion partie
  const [tab, setTab] = useState('jeu');

  if (!user) return <div className="p-10 text-center"><h1 className="text-gold text-3xl">Connexion...</h1></div>;
  if (!roomId) return <LandingPage onJoin={setRoomId} />;

  return (
    <div className="min-h-screen pb-20">
      {tab === 'jeu' && <GamePage roomId={roomId} />}
      {tab === 'stats' && <StatsPage roomId={roomId} />}
      {tab === 'profils' && <ProfilesPage />}
      {tab === 'logs' && <LogsPage roomId={roomId} />}

      <nav className="fixed bottom-0 w-full bg-black/90 border-t border-gold flex justify-around p-3">
        {['jeu', 'stats', 'profils', 'logs'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`capitalize ${tab === t ? 'text-gold font-bold' : 'text-white'}`}>
            {t}
          </button>
        ))}
      </nav>
    </div>
  );
}
