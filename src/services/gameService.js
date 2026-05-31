import { ref, set, update, push, increment, onValue } from 'firebase/database';
import { database } from './firebase';

// Crée une salle de billard dynamique
export const createRoom = async (name) => {
  const roomRef = push(ref(database, 'rooms'));
  await set(roomRef, { 
    name, 
    scores: { p1: 0, p2: 0, p3: 0, p4: 0 },
    players: { p1: "Jc", p2: "Joyce", p3: "Paola", p4: "Hervé" }
  });
  return roomRef.key;
};

// Met à jour un score précis
export const updateScore = (roomId, playerId, points) => {
  update(ref(database, `rooms/${roomId}/scores`), { [playerId]: points });
};

// Clôture la manche, met à jour les stats et reset les scores
export const declareWinner = async (roomId, winnerId, currentScores) => {
  const updates = {};
  updates[`profiles/${winnerId}/wins`] = increment(1);
  Object.entries(currentScores).forEach(([id, score]) => {
    updates[`profiles/${id}/totalPoints`] = increment(score);
    if (id !== winnerId) updates[`profiles/${id}/losses`] = increment(1);
    updates[`rooms/${roomId}/scores/${id}`] = 0;
  });
  await update(ref(database), updates);
};
