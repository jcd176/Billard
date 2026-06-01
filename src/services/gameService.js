import { ref, push, set, update, increment, onValue } from 'firebase/database';
import { database } from './firebase';

export const createRoom = async (name) => {
  const roomRef = push(ref(database, 'rooms'));
  // Initialisation avec scores vides
  await set(roomRef, { name, createdAt: Date.now(), scores: {} });
  return roomRef.key;
};

export const addLog = (roomId, userName, action) => {
  const logsRef = ref(database, `rooms/${roomId}/logs`);
  push(logsRef, { user: userName, action: action, time: Date.now() });
};

// Mise à jour de la fonction declareWinner pour gérer V et D
export const declareWinner = async (roomId, winnerName, loserName) => {
  const scoresRef = ref(database, `rooms/${roomId}/scores`);
  
  // Lecture unique pour récupérer les scores actuels
  onValue(scoresRef, (snapshot) => {
    const currentScores = snapshot.val() || {};
    
    // Récupération ou initialisation des données des deux joueurs
    const w = currentScores[winnerName] || { v: 0, d: 0 };
    const l = currentScores[loserName] || { v: 0, d: 0 };

    // Mise à jour des scores dans Firebase
    update(scoresRef, {
      [winnerName]: { v: w.v + 1, d: w.d },
      [loserName]: { v: l.v, d: l.d + 1 }
    });
  }, { onlyOnce: true });

  // Ajout du log dans l'historique
  addLog(roomId, winnerName, `bat ${loserName}`);
};

export const subscribeTo = (path, callback) => {
  const pathRef = ref(database, path);
  return onValue(pathRef, (snapshot) => { 
    callback(snapshot.val()); 
  });
};
