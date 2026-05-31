import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../services/firebase';

export default function StatsPage({ roomId }) {
  const [scores, setScores] = useState({});

  useEffect(() => {
    onValue(ref(database, `rooms/${roomId}/scores`), (s) => setScores(s.val() || {}));
  }, [roomId]);

  const sortedPlayers = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  return (
    <div className="p-4 text-white min-h-screen bg-[#0d5136]">
      <h2 className="text-[#dfb743] text-2xl font-bold mb-6 font-serif">Classement Général</h2>
      <div className="bg-[#1a1a1a] rounded-xl border border-[#dfb743]/30 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-[#dfb743] border-b border-[#dfb743]/30 bg-black/40">
              <th className="py-3 px-4 text-left">#</th>
              <th className="py-3 px-4 text-left">Joueur</th>
              <th className="py-3 px-4 text-center">Score</th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map(([name, score], i) => (
              <tr key={name} className="border-b border-white/10">
                <td className="py-4 px-4">{i + 1}</td>
                <td className="py-4 px-4 font-bold">{name}</td>
                <td className="py-4 px-4 text-center text-[#dfb743] font-mono text-xl">{score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
