import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../services/firebase';

export default function StatsPage({ roomId }) {
  const [scores, setScores] = useState({});

  useEffect(() => {
    return onValue(ref(database, `rooms/${roomId}/scores`), (s) => setScores(s.val() || {}));
  }, [roomId]);

  const stats = Object.entries(scores).map(([name, data]) => {
    const v = data.v || 0;
    const d = data.d || 0;
    const total = v + d;
    const pct = total > 0 ? Math.round((v / total) * 100) : 0;
    return { name, v, d, pct };
  }).sort((a, b) => b.v - a.v);

  return (
    <div className="p-4 text-white min-h-screen">
      <h2 className="text-[#dfb743] text-2xl font-bold mb-6 font-serif">Classement Général</h2>
      <div className="bg-[#1a1a1a] rounded-xl border border-[#dfb743]/30 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[#00b4d8] border-b border-gray-700 bg-black/40">
              <th className="p-3">#</th>
              <th className="p-3">Joueur</th>
              <th className="p-3 text-center">V</th>
              <th className="p-3 text-center">D</th>
              <th className="p-3 text-center">%</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s, i) => (
              <tr key={s.name} className="border-b border-white/10">
                <td className="p-3 text-gray-400">{i + 1}</td>
                <td className="p-3 font-bold">{s.name}</td>
                <td className="p-3 text-center text-green-400">{s.v}</td>
                <td className="p-3 text-center text-red-400">{s.d}</td>
                <td className="p-3 text-center text-[#dfb743] font-bold">{s.pct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
