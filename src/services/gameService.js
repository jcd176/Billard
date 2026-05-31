import { ref, set, update, push, increment } from 'firebase/database';
import { database } from './firebase';

export const createRoom = async (name) => {
  const roomRef = push(ref(database, 'rooms'));
  await set(roomRef, { 
    name, 
    scores: { p_jc: 0, p_joyce: 0, p_paola: 0, p_herve: 0 },
    status: 'active' 
  });
  return roomRef.key;
};

export const updateScore = (roomId, playerId, points) => {
  update(ref(database, `rooms/${roomId}/scores`), { [playerId]: points });
};

export const declareWinner = async (roomId, winnerId, currentScores) => {
  const updates = {};
  updates[`profiles/${winnerId}/wins`] = increment(1);
  Object.entries(currentScores).forEach(([id, score]) => {
    updates[`profiles/${id}/totalPoints`] = increment(score);
    if (id !== winnerId) updates[`profiles/${id}/losses`] = increment(1);
    updates[`rooms/${roomId}/scores/${id}`] = 0; // Reset score manche
  });
  await update(ref(database), updates);
};
