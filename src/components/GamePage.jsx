import React, { useState, useEffect } from 'react';
import { subscribeToJazennes, subscribeToProfiles, updateLiveScores, declareWinner } from '../services/gameService';

function GamePage() {
  const [game, setGame] = useState(null);
  const [profiles, setProfiles] = useState({});

  useEffect(() => {
    const unsubscribeGame = subscribeToJazennes((data) => setGame(data));
    const unsubscribeProfiles = subscribeToProfiles((data) => setProfiles(data));
    return () => {
      unsubscribeGame();
      unsubscribeProfiles();
    };
  }, []);

  if (!game) return null;

  const handleScoreChange = (playerId, delta) => {
    const currentScores = game.scores || {};
    const newScore = Math.max(0, (currentScores[playerId] || 0) + delta);
    updateLiveScores({
      ...currentScores,
      [playerId]: newScore
    });
  };

  const handleEndRound = (playerId) => {
    const playerName = profiles[playerId]?.name || 'Joueur';
    if (window.confirm(`Confirmer la victoire de ${playerName} pour cette manche ? (Les stats globales seront incrémentées)`)) {
      declareWinner(playerId, game.scores);
    }
  };

  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-white/10 shadow-xl">
      <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
        <h2 className="text-2xl font-serif text-gold">Table de marque en direct</h2>
        <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-1 rounded-full border border-emerald-500/30 font-mono flex items-center gap-1.5 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Synchro Temps Réel
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.keys(profiles).map((id) => {
          const score = game.scores?.[id] || 0;
          const name = profiles[id]?.name || id;
          return (
            <div key={id} className="bg-dark-wood p-5 rounded-xl border border-amber-900/30 flex items-center justify-between shadow-lg group">
              <div>
                <h3 className="text-xl font-bold text-ivory group-hover:text-gold transition-colors">{name}</h3>
                <p className="text-xs text-gold/60 mt-1"><i className="fa-solid fa-star text-[10px] mr-1"></i> Score de la manche</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-1">
                  <button 
                    onClick={() => handleScoreChange(id, 1)}
                    className="w-10 h-8 bg-emerald-700 hover:bg-emerald-600 rounded text-white flex items-center justify-center font-bold shadow transition-transform active:scale-95"
                  >
                    +1
                  </button>
                  <button 
                    onClick={() => handleScoreChange(id, -1)}
                    className="w-10 h-8 bg-red-800 hover:bg-red-700 rounded text-white flex items-center justify-center font-bold shadow transition-transform active:scale-95"
                  >
                    -1
                  </button>
                </div>
                
                <span className="text-4xl font-mono font-bold bg-black/40 px-4 py-2 rounded-lg text-gold border border-white/5 min-w-[60px] text-center shadow-inner">
                  {score}
                </span>

                <button 
                  onClick={() => handleEndRound(id)}
                  title="Gagne la manche"
                  className="p-3 bg-amber-600 hover:bg-gold hover:text-dark-wood rounded-lg text-white font-bold transition-all shadow border border-amber-500/30"
                >
                  <i className="fa-solid fa-trophy"></i>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default GamePage;
