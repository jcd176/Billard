import { ref, push, set, update, get } from 'firebase/database';
import { database } from './firebase';

export const createRoom = async (name) => {
  // Ici on utilise le nom comme ID pour simplifier la gestion
  const roomRef = ref(database, `rooms/${name}`);
  await set(roomRef, { name, createdAt: Date.now(), scores: {} });
  return name;
};

export const addLog = (roomId, userName, action) => {
  const logsRef = ref(database, `rooms/${roomId}/logs`);
  push(logsRef, { user: userName, action: action, time: Date.now() });
};

export const declareWinner = async (roomId, winnerName, loserName) => {
  const scoresRef = ref(database, `rooms/${roomId}/scores`);
  
  // Utilisation de 'get' pour lire une seule fois de manière fiable
  const snapshot = await get(scoresRef);
  const currentScores = snapshot.val() || {};
  
  const w = currentScores[winnerName] || { v: 0, d: 0 };
  const l = currentScores[loserName] || { v: 0, d: 0 };

  // Mise à jour atomique des scores
  await update(scoresRef, {
    [winnerName]: { v: (w.v || 0) + 1, d: w.d },
    [loserName]: { v: l.v, d: (l.d || 0) + 1 }
  });
};
