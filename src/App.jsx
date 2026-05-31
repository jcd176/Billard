import React, { useState, useEffect } from 'react';
import { setupJazennesGame } from './services/gameService';
import GamePage from './components/GamePage';
import StatsPage from './components/StatsPage';
import ProfilesPage from './components/ProfilesPage';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('match');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialise la structure Firebase de la table Jazennes au démarrage
    setupJazennesGame().then(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      /* CORRECTION : Remplacement de "min-height-screen" par "min-h-screen" (norme Tailwind) */
      <div className="flex items-center justify-center min-h-screen bg-billiard-green">
        <div className="billiard-ball text-white animate-bounce flex items-center justify-center text-2xl font-bold">8</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-billiard-green wood-frame p-4 md:p-8 text-ivory">
      <header className="max-w-4xl mx-auto mb-6 text-center">
        <h1 className="text-4xl md:text-5xl font-serif text-gold font-bold tracking-wide drop-shadow-lg flex items-center justify-center gap-3">
          <span className="inline-block bg-black text-white rounded-full w-10 h-10 text-xl flex items-center justify-center border-2 border-white shadow">8</span>
          Jazennes Billard Club
        </h1>
        
        {/* BARRE D'ONGLETS SANS LATENCE */}
        <nav className="flex justify-center gap-2 mt-6 bg-dark-wood p-1.5 rounded-xl shadow-inner max-w-md mx-auto border border-amber-900/40">
          <button 
            onClick={() => setActiveTab('match')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${activeTab === 'match' ? 'bg-gold text-dark-wood shadow font-bold scale-105' : 'text-ivory/70 hover:text-ivory hover:bg-white/5'}`}
          >
            <i className="fa-solid fa-gamepad mr-2"></i>Match
          </button>
          <button 
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${activeTab === 'stats' ? 'bg-gold text-dark-wood shadow font-bold scale-105' : 'text-ivory/70 hover:text-ivory hover:bg-white/5'}`}
          >
            <i className="fa-solid fa-chart-simple mr-2"></i>Stats
          </button>
          <button 
            onClick={() => setActiveTab('profiles')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${activeTab === 'profiles' ? 'bg-gold text-dark-wood shadow font-bold scale-105' : 'text-ivory/70 hover:text-ivory hover:bg-white/5'}`}
          >
            <i className="fa-solid fa-users-gear mr-2"></i>Profils
          </button>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto transition-all duration-300">
        {activeTab === 'match' && <GamePage />}
        {activeTab === 'stats' && <StatsPage />}
        {activeTab === 'profiles' && <ProfilesPage />}
      </main>
    </div>
  );
}

export default App;
