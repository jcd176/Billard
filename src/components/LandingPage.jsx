import React, { useState } from 'react';
import { createRoom } from '../services/gameService';

export default function LandingPage({ onJoinRoom }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = async () => {
    if (!name) return;
    setLoading(true);
    try {
      const roomId = await createRoom(name);
      onJoinRoom(roomId); // C'est ici qu'on transmet l'ID à App.jsx
    } catch (error) {
      console.error("Erreur création salle:", error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d5136] flex flex-col items-center justify-center p-6 text-white font-sans">
      <img src="https://upload.wikimedia.org/wikipedia/commons/f/f0/Billiard_ball_8.svg" 
           alt="Bille 8" className="w-32 h-32 mb-8 drop-shadow-2xl animate-fade-in" />
      
      <h1 className="text-4xl font-serif text-[#dfb743] mb-8 uppercase tracking-widest">Partie de Billard</h1>
      
      <div className="bg-[#2c1a13] p-8 rounded-3xl border border-[#dfb743]/30 shadow-2xl w-full max-w-sm">
        <input 
          className="w-full p-4 mb-4 rounded-xl bg-black/40 border border-[#dfb743] text-white placeholder-white/30"
          placeholder="Nom de la partie..."
          onChange={(e) => setName(e.target.value)}
        />
        <button 
          onClick={handleCreateRoom}
          disabled={loading}
          className="w-full bg-[#dfb743] text-[#2c1a13] font-bold py-4 rounded-xl hover:bg-white transition-all disabled:opacity-50"
        >
          {loading ? "Création..." : "Lancer la partie"}
        </button>
      </div>
    </div>
  );
}
