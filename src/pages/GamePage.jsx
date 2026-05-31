import React, { useEffect, useState } from 'react';
import { subscribeToGame, addPlayer, resetGame } from '@/services/gameService';
import ScoreBoard from '@/components/ScoreBoard';
import PlayerList from '@/components/PlayerList';
import './GamePage.css';

export default function GamePage({ gameId, onExit }) {
  const [game, setGame] = useState(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToGame(gameId, (gameData) => {
      setGame(gameData);
    });

    return () => unsubscribe();
  }, [gameId]);

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) {
      alert('Entrez un nom de joueur');
      return;
    }
    setLoading(true);
    try {
      await addPlayer(gameId, { name: newPlayerName, score: 0 });
      setNewPlayerName('');
    } catch (error) {
      alert('Erreur ajout joueur: ' + error.message);
    }
    setLoading(false);
  };

  const handleResetGame = async () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser la partie ?')) {
      try {
        await resetGame(gameId);
      } catch (error) {
        alert('Erreur réinitialisation: ' + error.message);
      }
    }
  };

  if (!game) return <div className="game-loading"><h1>🎱 Chargement de la partie...</h1></div>;

  return (
    <div className="game-container">
      <div className="game-header">
        <h1>{game.gameName || 'Partie de Billard'}</h1>
        <button onClick={onExit} className="btn-billard-secondary exit-button">← Quitter</button>
      </div>
      <div className="game-content">
        <div className="score-section"><ScoreBoard game={game} gameId={gameId} /></div>
        <div className="players-section">
          <h2>Joueurs</h2>
          <PlayerList game={game} gameId={gameId} />
          {game.players && Object.keys(game.players).length < game.maxPlayers && (
            <div className="add-player-form">
              <input type="text" placeholder="Nom du joueur" value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} className="player-input" />
              <button onClick={handleAddPlayer} disabled={loading} className="btn-billard-primary add-player-button">
                {loading ? 'Ajout...' : 'Ajouter joueur'}
              </button>
            </div>
          )}
        </div>
        <div className="actions-section">
          <button onClick={handleResetGame} className="btn-billard-danger reset-button">🔄 Réinitialiser les scores</button>
        </div>
      </div>
    </div>
  );
}