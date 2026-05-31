import { ref, set, update, push, increment } from 'firebase/database';
import { database } from './firebase';

// Cette fonction manque à l'appel, c'est pour ça que ça bloque
export const createRoom = async (name) => {
  const roomRef = push(ref(database, 'rooms'));
  await set(roomRef, { 
    name, 
    scores: { p1: 0, p2: 0, p3: 0, p4: 0 },
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
    updates[`rooms/${roomId}/scores/${id}`] = 0;
  });
  
  await update(ref(database), updates);
};
// Ajoutez ceci à votre fichier gameService.js existant
export const subscribeToProfiles = (callback) => {
  const profilesRef = ref(database, 'profiles');
  return onValue(profilesRef, (snapshot) => {
    callback(snapshot.val() || {});
  });
};
