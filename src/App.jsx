import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import LoginPage from './components/LoginPage';
import LandingPage from './components/LandingPage';
import GamePage from './components/GamePage';
import StatsPage from './components/StatsPage';
import ProfilesPage from './components/ProfilesPage';
import LogsPage from './components/LogsPage';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roomId, setRoomId] = useState(null);
  const [tab, setTab] = useState('jeu');

  useEffect(() => {
    const auth = getAuth();
    // Écoute de l'état de connexion Firebase
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // Gestion utilisateur Google ou Local
      const localUser = localStorage.getItem('localUser');
      if (currentUser) {
        setUser(currentUser);
      } else if (localUser) {
        setUser({ displayName: localUser });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return <div className="text-white text-center mt-20">Chargement...</div>;

  // 1. Page de connexion si non connecté
  if (!user) return <LoginPage />;

  // 2. Page d'accueil pour choisir/créer une salle si connecté mais sans salle
  if (!roomId) return <LandingPage onJoinRoom={setRoomId} />;

  // 3. Application principale avec navigation par onglets
  return (
    <div className="min-h-screen pb-20 bg-[#0d5136]">
      <div className="pb-10">
        {tab === 'jeu' && <GamePage roomId={roomId} onLeave={() => setRoomId(null)} />}
        {tab === 'stats' && <StatsPage roomId={roomId} />}
        {tab === 'profils' && <ProfilesPage />}
        {tab === 'logs' && <LogsPage roomId={roomId} />}
      </div>

      <nav className="fixed bottom-0 w-full bg-black/90 border-t border-gold flex justify-around p-3 z-50">
        {['jeu', 'stats', 'profils', 'logs'].map(t => (
          <button 
            key={t} 
            onClick={() => setTab(t)} 
            className={`capitalize ${tab === t ? 'text-gold font-bold' : 'text-white'}`}
          >
            {t}
          </button>
        ))}
      </nav>
    </div>
  );
}
