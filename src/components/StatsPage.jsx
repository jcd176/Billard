import React, { useState, useEffect } from 'react';
import { subscribeToProfiles } from '../services/gameService';

function StatsPage() {
  const [stats, setStats] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToProfiles((data) => {
      const formatted = Object.entries(data).map(([id, p]) => ({
        id,
        name: p.name || "Joueur",
        wins: p.wins || 0,
        losses: p.losses || 0,
        points: p.totalPoints || 0
      }));
      setStats(formatted.sort((a, b) => b.wins - a.wins));
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="p-6 bg-billiard-green min-h-screen">
      <h2 className="text-3xl font-serif text-gold mb-6 text-center">Classement Général</h2>
      <div className="bg-dark-wood p-6 rounded-2xl border border-gold shadow-2xl">
        {stats.map((p) => (
          <div key={p.id} className="flex justify-between items-center py-3 border-b border-gold/20 text-white">
            <span className="font-bold text-lg">{p.name}</span>
            <span className="text-gold">{p.wins} V / {p.losses} D</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StatsPage;
// Ajoutez cette fonction à la fin de src/services/gameService.js
export const subscribeToProfiles = (callback) => {
  return subscribeTo('profiles', callback);
};
