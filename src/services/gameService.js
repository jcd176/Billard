export const declareWinner = async (roomId, winnerName, loserName) => {
  const roomScoresRef = ref(database, `rooms/${roomId}/scores`);
  
  // Lecture instantanée pour mettre à jour les deux joueurs
  onValue(ref(database, `rooms/${roomId}/scores`), (snapshot) => {
    const currentScores = snapshot.val() || {};
    
    // Initialisation si inexistant
    const w = currentScores[winnerName] || { v: 0, d: 0 };
    const l = currentScores[loserName] || { v: 0, d: 0 };

    update(ref(database, `rooms/${roomId}/scores`), {
      [winnerName]: { v: w.v + 1, d: w.d },
      [loserName]: { v: l.v, d: l.d + 1 }
    });
  }, { onlyOnce: true });

  addLog(roomId, winnerName, `bat ${loserName}`);
};
