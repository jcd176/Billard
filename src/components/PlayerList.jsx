import React from 'react';
import { removePlayer } from '@/services/gameService';
import './PlayerList.css';

export default function PlayerList({ game, gameId }) {
  const handleRemovePlayer = async (playerId) => {
    if (confirm('Supprimer ce joueur ?')) {
      try {
        await removePlayer(gameId, playerId);
      } catch (error) {
        alert('Erreur suppression: ' + error.message);
      }
    }
  };

  const players = game.players || {};

  if (Object.keys(players).length === 0) {
    return <p className="no-players">Aucun joueur dans la partie</p>;
  }

  return (
    <div className="player-list">
      {Object.entries(players).map(([playerId, player]) => (
        <div key={playerId} className="player-item">
          <div className="player-details">
            <div className="player-avatar">{player.name.charAt(0).toUpperCase()}</div>
            <div className="player-info">
              <div className="player-name">{player.name}</div>
              <div className="player-status">Actif</div>
            </div>
          </div>
          <button onClick={() => handleRemovePlayer(playerId)} className="btn-remove" title="Supprimer joueur">×</button>
        </div>
      ))}
    </div>
  );
}