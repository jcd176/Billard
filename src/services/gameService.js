import { ref, push, set, update, increment, onValue } from 'firebase/database';
import { database } from './firebase';

// 1. Création d'une salle
export const createRoom = async (name) => {
  const roomRef = push(ref(database, 'rooms'));
  await set(roomRef, { name, createdAt: Date.now(), scores: {} });
  return roomRef.key;
};

// 2. Enregistrement d'un log (Historique)
export const addLog = (roomId, userName, action) => {
  const logsRef = ref(database, `rooms/${roomId}/logs`);
  push(logsRef, {
    user: userName,
    action: action,
    time: Date.now()
  });
};

// 3. Déclaration d'un vainqueur avec enregistrement automatique du log
export const declareWinner = async (roomId, winnerId, winnerName, isBlackBall, scores) => {
  const updates = {};
  
  // Incrémenter les victoires
  updates[`profiles/${winnerId}/wins`] = increment(1);
  
  // Mise à jour de la base
  await update(ref(database), updates);
  
  // Enregistrer l'action dans les logs
  const action = isBlackBall ? "a gagné avec la bille noire !" : "a remporté la manche.";
  addLog(roomId, winnerName, action);
};

// 4. Souscription aux données (pour le temps réel)
export const subscribeTo = (path, callback) => {
  const pathRef = ref(database, path);
  return onValue(pathRef, (snapshot) => {
    callback(snapshot.val());
  });
};
