import React, { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { database } from '../services/firebase';
import { declareWinner, addLog } from '../services/gameService';

export default function GamePage({ roomId, onLeave }) {
  const [data, setData] = useState(null);
  const [winner, setWinner] = useState('');
  const [loser, setLoser] = useState('');

  // Chargement des données... (Logique existante)

  return (
    <div className="p-4 min-h-screen pb-24 bg-[#0d5136]">
      {/* Header avec Power à droite */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[#dfb743] font-serif text-2xl">{data?.name}</h2>
        <button onClick={onLeave} className="text-2xl text-[#dfb743]">⏻</button>
      </div>

      <button onClick={addPlayer} className="btn-emerald w-full mb-6">
        + Ajouter un joueur
      </button>

      {/* Zone Enregistrer un match */}
      <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/10">
        <h3 className="text-[#dfb743] font-bold mb-4">Enregistrer un match</h3>
        <select onChange={(e) => setWinner(e.target.value)} className="w-full p-3 mb-3 bg-[#333] text-white rounded">
          <option value="">Vainqueur 🏆</option>
          {/* Mapping joueurs */}
        </select>
        <select onChange={(e) => setLoser(e.target.value)} className="w-full p-3 mb-4 bg-[#333] text-white rounded">
          <option value="">Perdant ❌</option>
          {/* Mapping joueurs */}
        </select>
        <button onClick={recordMatch} className="btn-emerald w-full">Valider le match</button>
      </div>
    </div>
  );
}
