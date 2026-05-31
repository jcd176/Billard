import { ref, push, set, update, increment, onValue } from 'firebase/database';
import { database } from './firebase';

export const createRoom = async (name) => {
  const roomRef = push(ref(database, 'rooms'));
  await set(roomRef, { name, createdAt: Date.now(), scores: {} });
  return roomRef.key;
};

export const declareWinner = async (roomId, winnerId, isBlackBall, scores) => {
  const updates = {};
  updates[`profiles/${winnerId}/wins`] = increment(1);
  // Ajoutez ici la logique de mise à jour des scores selon vos besoins
  await update(ref(database), updates);
};
