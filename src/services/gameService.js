import { ref, push, update, get } from 'firebase/database';
import { database } from './firebase';

// Pour les logs, on envoie le nom du joueur concerné (userName)
export const addLog = (roomId, userName, action) => {
  const logsRef = ref(database, `rooms/${roomId}/logs`);
  push(logsRef, { user: userName, action: action, time: Date.now() });
};

export const declareWinner = async (roomId, winnerName, loserName) => {
  const scoresRef = ref(database, `rooms/${roomId}/scores`);
  const snapshot = await get(scoresRef);
  const currentScores = snapshot.val() || {};
  
  const w = currentScores[winnerName] || { v: 0, d: 0 };
  const l = currentScores[loserName] || { v: 0, d: 0 };

  await update(scoresRef, {
    [winnerName]: { v: w.v + 1, d: w.d },
    [loserName]: { v: l.v, d: l.d + 1 }
  });

  // On envoie le log du match ici
  addLog(roomId, winnerName, `bat ${loserName}`);
};
