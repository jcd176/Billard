import { ref, set, update, onValue, get, increment, push } from 'firebase/database';
import { database } from './firebase';

// Gestion des salles
export const createRoom = async (roomName) => {
  const newRoomRef = push(ref(database, 'rooms'));
  const roomId = newRoomRef.key;
  await set(newRoomRef, {
    name: roomName,
    createdAt: new Date().toISOString(),
    scores: { p_jc: 0, p_joyce: 0, p_paola: 0, p_herve: 0 }
  });
  return roomId;
};

// Mise à jour des stats (Correction : maintenant fonctionnel)
export const declareWinner = async (roomId, winnerId, currentScores) => {
  const updates = {};
  updates[`profiles/${winnerId}/wins`] = increment(1);
  
  Object.keys(currentScores).forEach(id => {
    updates[`profiles/${id}/totalPoints`] = increment(currentScores[id] || 0);
    if (id !== winnerId) updates[`profiles/${id}/losses`] = increment(1);
    updates[`rooms/${roomId}/scores/${id}`] = 0; // Reset score
  });
  
  await update(ref(database), updates);
};
