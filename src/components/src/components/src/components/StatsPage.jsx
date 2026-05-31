import React, { useState, useEffect } from 'react';
import { subscribeToProfiles } from '../services/gameService';

function StatsPage() {
  const [profiles, setProfiles] = useState({});

  useEffect(() => {
    const unsubscribe = subscribeToProfiles((data) => setProfiles(data));
    return () => unsubscribe();
  }, []);

  // Classer les joueurs par nombre de victoires (décroissant)
  const sortedPlayers = Object.values(profiles).sort((a, b) => b.wins - a.wins);

  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-white/10 shadow-xl">
      <h2 className="text-2xl font-serif text-gold mb-6 border-b border-white/10 pb-4"><i className="fa-solid fa-chart-line mr-2"></i>Classement général & Statistiques</h2>

      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full text-left border-collapse bg-dark-wood/40">
          <thead>
            <tr className="bg-dark-wood text-gold font-serif border-b border-amber-900/40">
              <th className="p-4 font-bold">Rang</th>
              <th className="p-4 font-bold">Joueur</th>
              <th className="p-4 font-bold text-center">Victoires</th>
              <th className="p-4 font-bold text-center">Défaites</th>
              <th className="p-4 font-bold text-center">Points cumulés</th>
              <th className="p-4 font-bold text-center">Ratio V/D</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sortedPlayers.map((player, index) => {
              const totalGames = player.wins + player.losses;
              const winRatio = totalGames > 0 ? ((player.wins / totalGames) * 100).toFixed(0) : 0;
              
              return (
                <tr key={player.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-mono font-bold text-gold/80 text-lg">
                    {index === 0 ? '🏆 1' : index + 1}
                  </td>
                  <td className="p-4 font-bold text-ivory text-lg">{player.name}</td>
                  <td className="p-4 text-center font-mono font-bold text-emerald-400">{player.wins}</td>
                  <td className="p-4 text-center font-mono text-red-400/80">{player.losses}</td>
                  <td className="p-4 text-center font-mono text-amber-200">{player.totalPoints || 0} pts</td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 bg-black/40 h-2.5 rounded-full overflow-hidden border border-white/5">
                        <div className="bg-gold h-full rounded-full" style={{ width: `${winRatio}%` }}></div>
                      </div>
                      <span className="font-mono text-sm font-bold text-gold">{winRatio}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default StatsPage;
