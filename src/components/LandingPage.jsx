import React, { useState } from 'react';
import { createRoom } from '../services/gameService';

export default function LandingPage({ onJoinRoom }) {
  const [name, setName] = useState('');

  const handleCreate = async () => {
    if (!name) return;
    const id = await createRoom(name);
    onJoinRoom(id);
  };

  return (
    <div className="min-h-screen bg-billiard-green flex flex-col items-center justify-center p-6 text-center">
      <div className="billiard-ball mb-8 animate-bounce shadow-2xl"></div>
      <h1 className="text-5xl font-serif text-gold mb-10 drop-shadow-md">Jazennes Billard Club</h1>
      <div className="bg-dark-wood p-8 rounded-3xl border-4 border-gold shadow-2xl w-full max-w-sm">
        <input 
          className="w-full p-4 mb-4 rounded-xl bg-black/30 border border-gold text-white"
          placeholder="Nom de la salle..."
          onChange={(e) => setName(e.target.value)}
        />
        <button onClick={handleCreate} className="w-full bg-gold text-dark-wood font-bold py-3 rounded-xl hover:scale-105 transition-transform">
          Créer la partie
        </button>
      </div>
    </div>
  );
}
