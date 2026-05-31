import { ref, update, increment } from 'firebase/database';
import { database } from './firebase';

export const declareWinner = async (roomId, winnerId, allScores) => {
  const updates = {};
  // 1. Incrémenter victoire
  updates[`profiles/${winnerId}/wins`] = increment(1);
  // 2. Mettre à jour les points de chaque joueur
  Object.entries(allScores).forEach(([id, points]) => {
    updates[`profiles/${id}/totalPoints`] = increment(points);
    updates[`rooms/${roomId}/scores/${id}`] = 0; // Reset manche
  });
  await update(ref(database), updates);
};
