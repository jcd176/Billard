import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import LoginPage from './components/LoginPage';
import LandingPage from './components/LandingPage';
import GamePage from './components/GamePage';
import StatsPage from './components/StatsPage';
import LogsPage from './components/LogsPage';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roomId, setRoomId] = useState(null);
  const [tab, setTab] = useState('jeu');

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      const localUser = localStorage.getItem('localUser');
      if (currentUser) setUser(currentUser);
      else if (localUser) setUser({ displayName: localUser });
      else setUser(null);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return <div className="text-white text-center mt-20">Chargement...</div>;
  if (!user) return <LoginPage />;
  if (!roomId) return <LandingPage onJoinRoom={setRoomId} />;

  return (
    <div className="min-h-screen pb-24 bg-[#0d5136]">
      <div className="pb-10">
        {tab === 'jeu' && <GamePage roomId={roomId} onLeave={() => setRoomId(null)} />}
        {tab === 'stats' && <StatsPage roomId={roomId} />}
        {tab === 'logs' && <LogsPage roomId={roomId} />}
      </div>

      <nav className="fixed bottom-0 w-full bg-black/90 border-t border-[#dfb743] flex justify-center gap-8 p-4 z-50">
        {['jeu', 'stats', 'logs'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`capitalize font-bold ${tab === t ? 'text-[#dfb743]' : 'text-white'}`}>
            {t}
          </button>
        ))}
      </nav>
    </div>
  );
}
