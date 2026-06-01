export default function GamePage({ roomId, onLeave }) {
  // ... (votre code useEffect et state reste identique)

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[#dfb743] font-serif text-2xl">Jazennes</h2>
        <button onClick={onLeave} className="text-2xl text-white hover:text-red-500">⏻</button>
      </div>

      <button onClick={addPlayer} className="w-full mb-6 py-3 border-2 border-[#2a9d8f] text-[#2a9d8f] rounded-lg font-bold hover:bg-[#2a9d8f] hover:text-white">
        + Ajouter un joueur
      </button>

      <div className="card-dark">
        <h3 className="text-[#dfb743] font-bold mb-4">Enregistrer un match</h3>
        {/* Vos selects... */}
        <button onClick={recordMatch} className="btn-teal w-full">Valider le match</button>
      </div>
    </div>
  );
}import React, { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
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

  const addPlayer = () => {
    const name = prompt("Nom du nouveau joueur :");
    if (name) {
      update(ref(database, `rooms/${roomId}/scores`), { [name]: 0 });
      addLog(roomId, "Système", `${name} a rejoint la partie`);
    }
  };

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

      <button onClick={addPlayer} className="w-full mb-6 py-3 border border-[#dfb743] text-[#dfb743] rounded-lg hover:bg-[#dfb743] hover:text-black transition font-bold">
        + Ajouter un joueur
      </button>

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
        <button onClick={recordMatch} className="w-full bg-[#20b2aa] text-white font-bold p-4 rounded-lg hover:bg-[#1a938a] transition shadow-lg">
          Valider le match
        </button>
      </div>
    </div>
  );
}
