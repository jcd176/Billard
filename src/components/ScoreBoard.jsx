import React from 'react';
import { updateScores } from '@/services/gameService';
import './ScoreBoard.css';

export default function ScoreBoard({ game, gameId }) {
  const handleScoreChange = async (playerId, change) => {
    const currentScore = game.scores?.[playerId] || 0;
    const newScore = Math.max(0, currentScore + change);
    try {
      await updateScores(gameId, { [playerId]: newScore });
    } catch (error) {
      alert('Erreur mise à jour score: ' + error.message);
    }
  };

  const players = game.players || {};
  const scores = game.scores || {};
  const sortedPlayerIds = Object.keys(players).sort((a, b) => (scores[b] || 0) - (scores[a] || 0));

  return (
    <div className="score-board">
      <h2>Tableau des scores</h2>
      {sortedPlayerIds.length === 0 ? (
        <p className="no-players">Aucun joueur pour l'instant</p>
      ) : (
        <div className="scores-list">
          {sortedPlayerIds.map((playerId, index) => {
            const player = players[playerId];
            const score = scores[playerId] || 0;
            return (
              <div key={playerId} className="score-row">
                <div className="score-rank">{index + 1}</div>
                <div className="score-info">
                  <div className="player-name">{player.name}</div>
                  <div className="player-joined">depuis {new Date(player.joinedAt).toLocaleTimeString()}</div>
                </div>
                <div className="score-display">{score}</div>
                <div className="score-controls">
                  <button onClick={() => handleScoreChange(playerId, -1)} className="btn-score minus">−</button>
                  <button onClick={() => handleScoreChange(playerId, 1)} className="btn-score plus">+</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}