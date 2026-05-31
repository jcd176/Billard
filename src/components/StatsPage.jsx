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
    <div className="p-4 text-white">
      <h2 className="text-[#dfb743] text-2xl font-bold mb-6">Classement</h2>
      <table className="w-full">
        <thead>
          <tr className="text-[#dfb743] border-b border-[#dfb743]/30">
            <th className="py-2 text-left">Joueur</th>
            <th className="py-2 text-center">Score</th>
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map(([name, score], i) => (
            <tr key={name} className="border-b border-white/10">
              <td className="py-3 font-bold">{i + 1}. {name}</td>
              <td className="py-3 text-center text-[#dfb743] text-xl">{score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
