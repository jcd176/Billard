import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../services/firebase';

export default function StatsPage({ roomId }) {
  const [scores, setScores] = useState({});

  useEffect(() => {
    if (!roomId) return;
    return onValue(ref(database, `rooms/${roomId}/scores`), (s) => setScores(s.val() || {}));
  }, [roomId]);

  const stats = Object.entries(scores).map(([name, data]) => {
    const v = data.v || 0, d = data.d || 0;
    const total = v + d;
    return { name, v, d, pct: total > 0 ? Math.round((v / total) * 100) : 0 };
  }).sort((a, b) => b.v - a.v);

  return (
    <div className="p-4 pb-24 text-white">
      <h2 className="text-[#00b4d8] text-xl font-bold mb-4 font-serif">Classement Général</h2>
      <div className="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-[#00b4d8] border-b border-white/10 bg-black/20">
              <th className="p-3">#</th><th className="p-3">Joueur</th><th className="p-3 text-center">V</th><th className="p-3 text-center">D</th><th className="p-3 text-center">%</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s, i) => (
              <tr key={s.name} className="border-b border-white/5 hover:bg-white/5 transition">
                <td className="p-3 text-gray-500">{i + 1}</td>
                <td className="p-3 font-bold">{s.name}</td>
                <td className="p-3 text-center text-[#2a9d8f]">{s.v}</td>
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
