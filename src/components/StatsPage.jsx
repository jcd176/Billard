import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../services/firebase';

export default function StatsPage({ roomId }) {
  const [scores, setScores] = useState({});

  useEffect(() => {
    return onValue(ref(database, `rooms/${roomId}/scores`), (s) => setScores(s.val() || {}));
  }, [roomId]);

  const stats = Object.entries(scores).map(([name, data]) => {
    const total = (data.v || 0) + (data.d || 0);
    const pct = total > 0 ? Math.round(((data.v || 0) / total) * 100) : 0;
    return { name, v: data.v || 0, d: data.d || 0, pct };
  }).sort((a, b) => b.v - a.v);

  return (
    <div className="p-4 bg-[#0d5136] min-h-screen text-white">
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
              <tr key={s.name} className="border-b border-white/5">
                <td className="p-3 font-mono text-gray-400">{i + 1}</td>
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
