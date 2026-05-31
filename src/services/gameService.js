import { ref, push, set, update, increment, onValue } from 'firebase/database';
import { database } from './firebase';

export const createRoom = async (name) => {
  const roomRef = push(ref(database, 'rooms'));
  await set(roomRef, { name, createdAt: Date.now(), scores: {} });
  return roomRef.key;
};

export const addLog = (roomId, userName, action) => {
  const logsRef = ref(database, `rooms/${roomId}/logs`);
  push(logsRef, { user: userName, action: action, time: Date.now() });
};

// AJOUTEZ CETTE FONCTION :
export const updateScore = async (roomId, playerId, newScore) => {
  const scoreRef = ref(database, `rooms/${roomId}/scores/${playerId}`);
  await set(scoreRef, newScore);
};

export const declareWinner = async (roomId, winnerId, winnerName, isBlackBall, scores) => {
  const updates = {};
  updates[`profiles/${winnerId}/wins`] = increment(1);
  await update(ref(database), updates);
  const action = isBlackBall ? "a gagné avec la bille noire !" : "a remporté la manche.";
  addLog(roomId, winnerName, action);
};

export const subscribeTo = (path, callback) => {
  const pathRef = ref(database, path);
  return onValue(pathRef, (snapshot) => { callback(snapshot.val()); });
};
