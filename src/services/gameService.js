import { ref, set, update, onValue, remove, push, get } from 'firebase/database';
import { database } from './firebase';

export const createGame = async (gameData) => {
  try {
    const gamesRef = ref(database, 'games');
    const newGameRef = push(gamesRef);
    const gameId = newGameRef.key;
    
    // Sécurisation stricte de l'objet des joueurs pour éviter les rejets Realtime Database
    const initialPlayers = gameData.players && Object.keys(gameData.players).length > 0 
      ? gameData.players 
      : { initialized: true };

    await set(newGameRef, {
      id: gameId,
      gameName: gameData.gameName || 'Partie de Billard',
      status: gameData.status || 'active',
      maxPlayers: gameData.maxPlayers || 20,
      players: initialPlayers,
      scores: gameData.scores || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    return gameId;
  } catch (error) {
    console.error('Erreur création partie:', error);
    throw error;
  }
};

export const subscribeToGame = (gameId, callback) => {
  const gameRef = ref(database, `games/${gameId}`);
  return onValue(gameRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  });
};

export const updateScores = async (gameId, scores) => {
  try {
    const scoresRef = ref(database, `games/${gameId}/scores`);
    await update(scoresRef, scores);
  } catch (error) {
    console.error('Erreur mise à jour scores:', error);
    throw error;
  }
};

export const addPlayer = async (gameId, playerData) => {
  try {
    const playersRef = ref(database, `games/${gameId}/players`);
    const newPlayerRef = push(playersRef);
    await set(newPlayerRef, {
      ...playerData,
      joinedAt: new Date().toISOString(),
    });
    return newPlayerRef.key;
  } catch (error) {
    console.error('Erreur ajout joueur:', error);
    throw error;
  }
};

export const removePlayer = async (gameId, playerId) => {
  try {
    const playerRef = ref(database, `games/${gameId}/players/${playerId}`);
    await remove(playerRef);
  } catch (error) {
    console.error('Erreur suppression joueur:', error);
    throw error;
  }
};

export const resetGame = async (gameId) => {
  try {
    const gameRef = ref(database, `games/${gameId}`);
    const snapshot = await get(gameRef);
    
    if (snapshot.exists()) {
      const game = snapshot.val();
      const resetScores = {};
      Object.keys(game.scores || {}).forEach(playerId => {
        resetScores[playerId] = 0;
      });
      
      await update(gameRef, {
        scores: resetScores,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Erreur réinitialisation partie:', error);
    throw error;
  }
};
