import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../services/firebase';
import { declareWinner, updateScore } from '../services/gameService';

export default function GamePage({ roomId, onLeave }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    const unsub = onValue(ref(database, `rooms/${roomId}`), (s) => setData(s.val()));
    return unsub;
  }, [roomId]);

  if (!data) return <div className="text-white text-center mt-20">Chargement...</div>;

  return (
    <div className="min-h-screen bg-[#0d5136] p-4 text-white">
      <div className="flex justify-between items-center mb-8 border-b border-[#dfb743]/30 pb-4">
        <h2 className="text-2xl font-serif text-[#dfb743]">{data.name}</h2>
        <button onClick={onLeave} className="text-sm bg-black/30 px-3 py-1 rounded-full">Quitter</button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {Object.entries(data.scores).map(([id, score]) => (
          <div key={id} className="bg-[#2c1a13] p-5 rounded-2xl border border-[#dfb743]/20">
            <p className="text-xs uppercase opacity-60 mb-2">{id}</p>
            <div className="text-5xl font-mono mb-4">{score}</div>
            <div className="flex gap-2">
              <button onClick={() => updateScore(roomId, id, score + 1)} className="flex-1 bg-[#dfb743] text-black font-bold py-2 rounded">+</button>
              <button onClick={() => declareWinner(roomId, id, data.scores)} className="flex-1 bg-green-700 py-2 rounded">Win</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
