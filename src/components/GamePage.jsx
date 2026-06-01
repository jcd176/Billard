import React, { useState, useEffect } from 'react';
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
      update(ref(database, `rooms/${roomId}/scores`), { [name]: { v: 0, d: 0 } });
      addLog(roomId, "Système", `${name} a rejoint la partie`);
    }
  };

  const recordMatch = () => {
    if (winner && loser && winner !== loser) {
      declareWinner(roomId, winner, loser);
      setWinner(''); setLoser('');
    }
  };

  if (!data) return <div className="text-center mt-20">Chargement...</div>;
  const players = Object.keys(data.scores || {});

  return (
    <div className="p-4 min-h-screen pb-24">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[#dfb743] font-serif text-2xl font-bold">{data.name}</h2>
        <button onClick={onLeave} className="text-2xl text-[#dfb743] hover:text-white transition">⏻</button>
      </div>

      <button onClick={addPlayer} className="btn-emerald w-full mb-6">
        + Ajouter un joueur
      </button>

      <div className="card-dark">
        <h3 className="text-[#dfb743] font-bold mb-4">Enregistrer un match</h3>
        <select onChange={(e) => setWinner(e.target.value)} value={winner} className="w-full p-3 mb-3 bg-[#333] text-white rounded border border-white/10">
            <option value="">Vainqueur 🏆</option>
            {players.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select onChange={(e) => setLoser(e.target.value)} value={loser} className="w-full p-3 mb-4 bg-[#333] text-white rounded border border-white/10">
            <option value="">Perdant ❌</option>
            {players.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <button onClick={recordMatch} className="btn-emerald w-full">Valider le match</button>
      </div>
    </div>
  );
}
