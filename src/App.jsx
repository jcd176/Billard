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
    // Écoute en temps réel de l'état de connexion
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Afficher un écran de chargement pendant la vérification Firebase
  if (loading) return <div className="text-white text-center mt-20">Chargement...</div>;

  // 1. Si pas d'utilisateur, on affiche la page de connexion
  if (!user) return <LoginPage />;

  // 2. Si utilisateur connecté mais pas de salle choisie
  if (!roomId) return <LandingPage onJoin={setRoomId} />;

  // 3. Application principale une fois connecté et dans une salle
  return (
    <div className="min-h-screen pb-20 bg-[#0d5136]">
      {tab === 'jeu' && <GamePage roomId={roomId} onLeave={() => setRoomId(null)} />}
      {tab === 'stats' && <StatsPage roomId={roomId} />}
      {tab === 'profils' && <ProfilesPage />}
      {tab === 'logs' && <LogsPage roomId={roomId} />}

      <nav className="fixed bottom-0 w-full bg-black/90 border-t border-gold flex justify-around p-3">
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
