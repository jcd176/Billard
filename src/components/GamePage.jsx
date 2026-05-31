import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../services/firebase';
import { declareWinner, addLog } from '../services/gameService';

export default function GamePage({ roomId, onLeave }) {
  const [data, setData] = useState(null);
  const [winner, setWinner] = useState('');
  const [loser, setLoser] = useState('');

  useEffect(() => {
    if (!roomId) return;
    return onValue(ref(database, `rooms/${roomId}`), (s) => setData(s.val()));
  }, [roomId]);

  const recordMatch = () => {
    if (winner && loser && winner !== loser) {
      declareWinner(roomId, winner, winner, false, data.scores);
      addLog(roomId, "Match", `${winner} bat ${loser}`);
      setWinner(''); setLoser('');
    }
  };

  if (!data) return <div className="text-white text-center mt-20">Chargement...</div>;
  const players = Object.keys(data.scores || {});

  return (
    <div className="p-4 bg-[#0d5136] min-h-screen text-white pb-24">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[#dfb743] font-serif text-2xl">{data.name}</h2>
        <button onClick={onLeave} className="text-2xl text-[#dfb743] hover:text-white">⏻</button>
      </div>

      {/* Module Enregistrer un match */}
      <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#dfb743]/30 mb-8 shadow-xl">
        <h3 className="text-[#dfb743] font-bold text-lg mb-4">Enregistrer un match</h3>
        <select onChange={(e) => setWinner(e.target.value)} value={winner} className="w-full bg-[#333] p-3 rounded mb-3 border border-white/10">
            <option value="">Vainqueur 🏆</option>
            {players.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select onChange={(e) => setLoser(e.target.value)} value={loser} className="w-full bg-[#333] p-3 rounded mb-4 border border-white/10">
            <option value="">Perdant ❌</option>
            {players.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <button onClick={recordMatch} className="w-full bg-[#10b981] text-white font-bold p-4 rounded-lg hover:bg-[#059669] transition shadow-lg">
          Valider le match
        </button>
      </div>
    </div>
  );
}
