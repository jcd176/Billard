import { ref, set, update, onValue, push, get, increment } from 'firebase/database';
import { database } from './firebase';

// 1. Initialiser ou récupérer les profils fixes de Jazennes
export const getOrCreateProfiles = async () => {
  const profilesRef = ref(database, 'profiles');
  const snapshot = await get(profilesRef);
  
  if (!snapshot.exists()) {
    // Profils initiaux s'ils n'existent pas encore dans la base
    const initialProfiles = {
      "p_jc": { id: "p_jc", name: "Jc", wins: 0, losses: 0, totalPoints: 0 },
      "p_joyce": { id: "p_joyce", name: "Joyce", wins: 0, losses: 0, totalPoints: 0 },
      "p_paola": { id: "p_paola", name: "Paola", wins: 0, losses: 0, totalPoints: 0 },
      "p_herve": { id: "p_herve", name: "Hervé", wins: 0, losses: 0, totalPoints: 0 }
    };
    await set(profilesRef, initialProfiles);
    return initialProfiles;
  }
  return snapshot.val();
};

// 2. Mettre à jour le nom d'un profil
export const updateProfileName = async (profileId, newName) => {
  try {
    const nameRef = ref(database, `profiles/${profileId}`);
    await update(nameRef, { name: newName });
  } catch (error) {
    console.error('Erreur modification nom profil:', error);
    throw error;
  }
};

// 3. Récupérer ou créer la partie persistante "Jazennes"
export const setupJazennesGame = async () => {
  const gameRef = ref(database, 'games/jazennes');
  const snapshot = await get(gameRef);
  
  if (!snapshot.exists()) {
    const profiles = await getOrCreateProfiles();
    const cleanScores = {};
    Object.keys(profiles).forEach(id => { cleanScores[id] = 0; });

    await set(gameRef, {
      id: "jazennes",
      gameName: "Partie Jazennes",
      status: "active",
      scores: cleanScores,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
};

// 4. Écouter les changements de la partie en temps réel
export const subscribeToJazennes = (callback) => {
  const gameRef = ref(database, 'games/jazennes');
  return onValue(gameRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  });
};

// 5. Écouter les profils globaux en temps réel (pour l'onglet stats)
export const subscribeToProfiles = (callback) => {
  const profilesRef = ref(database, 'profiles');
  return onValue(profilesRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : {});
  });
};

// 6. Enregistrer les scores actuels en temps réel
export const updateLiveScores = async (scores) => {
  const scoresRef = ref(database, 'games/jazennes/scores');
  await set(scoresRef, scores);
  await update(ref(database, 'games/jazennes'), { updatedAt: new Date().toISOString() });
};

// 7. Clôturer une manche : Incrémente les stats globales et remet les scores du match à 0
export const declareWinner = async (winnerId, currentScores) => {
  try {
    const profiles = await getOrCreateProfiles();
    const updates = {};

    // Le vainqueur prend +1 victoire
    updates[`profiles/${winnerId}/wins`] = increment(1);
    
    // Les autres prennent +1 défaite, et on ajoute les points accumulés à tout le monde
    Object.keys(profiles).forEach(id => {
      const pointsMarques = currentScores[id] || 0;
      updates[`profiles/${id}/totalPoints`] = increment(pointsMarques);
      
      if (id !== winnerId) {
        updates[`profiles/${id}/losses`] = increment(1);
      }
      // Réinitialisation du score de la partie en cours
      updates[`games/jazennes/scores/${id}`] = 0;
    });

    updates['games/jazennes/updatedAt'] = new Date().toISOString();
    await update(ref(database), updates);
  } catch (error) {
    console.error('Erreur lors de la validation de la manche:', error);
    throw error;
  }
};
