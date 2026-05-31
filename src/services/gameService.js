import { ref, update, increment, push, set } from 'firebase/database';
import { database } from './firebase';

export const declareWinner = async (roomId, winnerId, isBlackBall, scores) => {
  const updates = {};
  const winPoints = isBlackBall ? 2 : 1; // Bonus bille noire
  
  // Incrément victoires
  updates[`profiles/${winnerId}/wins`] = increment(1);
  updates[`rooms/${roomId}/logs`] = push({ 
    msg: `Victoire de ${winnerId} ${isBlackBall ? '(Bille noire)' : ''}`, 
    time: Date.now() 
  });
  
  // Mise à jour scores
  Object.entries(scores).forEach(([id, s]) => {
    updates[`rooms/${roomId}/scores/${id}`] = 0; // Reset manche
  });
  
  await update(ref(database), updates);
};
