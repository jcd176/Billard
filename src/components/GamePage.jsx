import React, { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { database } from '../services/firebase';
import { declareWinner, updateScore, addLog } from '../services/gameService';

export default function GamePage({ roomId, onLeave }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!roomId) return;
    const unsub = onValue(ref(database, `rooms/${roomId}`), (s) => setData(s.val()));
    return unsub;
  }, [roomId]);

  const addPlayer = () => {
    const name = prompt("Nom du nouveau joueur :");
    if (name) {
      update(ref(database, `rooms/${roomId}/scores`), { [name]: 0 });
      addLog(roomId, "Système", `${name} a rejoint la partie`);
    }
  };

  if (!data) return <div className="text-white text-center mt-20">Chargement...</div>;

  return (
    <div className="min-h-screen bg-[#0d5136] p-4 text-white">
      <div className="flex justify-between items-center mb-8 border-b border-[#dfb743]/30 pb-4">
        <h2 className="text-2xl font-serif text-[#dfb743]">{data.name || "Partie"}</h2>
        <button onClick={onLeave} className="text-2xl" title="Quitter">⏻</button>
      </div>

      <button onClick={addPlayer} className="w-full mb-6 py-2 border border-[#dfb743] text-[#dfb743] rounded-lg hover:bg-[#dfb743] hover:text-black transition">
        + Ajouter un joueur
      </button>

      <div className="grid grid-cols-2 gap-4">
        {data.scores && Object.entries(data.scores).map(([id, score]) => (
          <div key={id} className="bg-[#2c1a13] p-5 rounded-2xl border border-[#dfb743]/20">
            <p className="text-xs uppercase opacity-60 mb-2">{id}</p>
            <div className="text-5xl font-mono mb-4">{score}</div>
            <div className="flex gap-2">
              <button onClick={() => { updateScore(roomId, id, score + 1); addLog(roomId, id, "a marqué"); }} className="flex-1 bg-[#dfb743] text-black font-bold py-2 rounded">+</button>
              <button onClick={() => { declareWinner(roomId, id, id, false, data.scores); addLog(roomId, id, "a gagné"); }} className="flex-1 bg-green-700 py-2 rounded">Win</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
