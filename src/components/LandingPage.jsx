import React, { useState } from 'react';
import { createRoom } from '../services/gameService';

export default function LandingPage({ onJoinRoom }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = async () => {
    if (!name) return;
    setLoading(true);
    const roomId = await createRoom(name);
    onJoinRoom(roomId);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-white">
      <h1 className="text-4xl font-serif text-[#dfb743] mb-8 uppercase tracking-widest">Partie de Billard</h1>
      <div className="card-dark w-full max-w-sm">
        <input className="w-full p-4 mb-4 rounded-xl bg-black/40 border border-[#dfb743] text-white" placeholder="Nom de la partie..." value={name} onChange={(e) => setName(e.target.value)} />
        <button onClick={handleCreateRoom} disabled={loading} className="btn-emerald">{loading ? "Création..." : "Lancer la partie"}</button>
      </div>
    </div>
  );
}
