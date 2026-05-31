import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../services/firebase';
import { declareWinner } from '../services/gameService';

export default function GamePage({ roomId, onLeave }) {
  const [roomData, setRoomData] = useState(null);

  useEffect(() => {
    // On écoute la salle spécifique passée en props
    const roomRef = ref(database, `rooms/${roomId}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      setRoomData(snapshot.val());
    });
    return () => unsubscribe();
  }, [roomId]);

  if (!roomData) return <div className="text-white">Chargement de la salle...</div>;

  const handleEndRound = (winnerId) => {
    declareWinner(roomId, winnerId, roomData.scores);
  };

  return (
    <div className="min-h-screen bg-billiard-green p-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-serif text-gold underline">{roomData.name}</h2>
        <button onClick={onLeave} className="bg-red-900 text-white px-4 py-2 rounded-lg">Quitter</button>
      </div>
      
      <div className="grid gap-4">
        {Object.entries(roomData.scores || {}).map(([id, score]) => (
          <div key={id} className="bg-dark-wood p-6 rounded-2xl border-2 border-gold flex justify-between items-center text-white">
            <span className="text-xl font-bold">{id}</span>
            <span className="text-4xl font-mono">{score}</span>
            <button onClick={() => handleEndRound(id)} className="bg-gold text-black font-bold px-4 py-2 rounded-lg">
              Vainqueur
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
