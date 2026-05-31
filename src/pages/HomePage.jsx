import React, { useState } from 'react';
import { signInAnon, signInWithGoogle } from '@/services/auth';
import { createGame } from '@/services/gameService';
import './HomePage.css';

export default function HomePage({ onUserLogin, onGameSelect, user }) {
  const [loading, setLoading] = useState(false);
  const [gameMode, setGameMode] = useState(null);

  const handleAnonLogin = async () => {
    setLoading(true);
    try {
      const currentUser = await signInAnon();
      onUserLogin(currentUser);
    } catch (error) {
      alert('Erreur de connexion: ' + error.message);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const currentUser = await signInWithGoogle();
      onUserLogin(currentUser);
    } catch (error) {
      alert('Erreur de connexion: ' + error.message);
    }
    setLoading(false);
  };

  const handleCreateGame = async () => {
    setLoading(true);
    try {
      const gameId = await createGame({
        gameName: 'Partie de Billard',
        players: [],
        scores: {},
        maxPlayers: 20,
        status: 'active',
      });
      onGameSelect(gameId);
    } catch (error) {
      alert('Erreur création partie: ' + error.message);
    }
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="home-container felt-background">
        <div className="home-content">
          <div className="logo-section">
            <h1 className="logo-text">🎱</h1>
            <h2 className="title">Billard Scores</h2>
            <p className="subtitle">Gérez vos parties en temps réel</p>
          </div>
          <div className="login-section">
            <button onClick={handleAnonLogin} disabled={loading} className="btn-billard-secondary mb-4 w-full text-lg py-3">
              {loading ? 'Connexion...' : 'Continuer en tant qu\'invité'}
            </button>
            <div className="divider"><span>ou</span></div>
            <button onClick={handleGoogleLogin} disabled={loading} className="btn-billard-primary w-full text-lg py-3">
              {loading ? 'Connexion...' : 'Se connecter avec Google'}
            </button>
          </div>
          <p className="disclaimer">Aucune inscription requise • Vos scores synchronisés • Jusqu'à 20 joueurs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container felt-background">
      <div className="home-content">
        <h1 className="logo-text">🎱</h1>
        <h2 className="title">Billard Scores</h2>
        {!gameMode ? (
          <div className="game-mode-selection">
            <button onClick={() => setGameMode('new')} className="btn-billard-primary mode-button">
              <span className="text-2xl">➕</span>
              <span>Créer une partie</span>
            </button>
            <button onClick={() => setGameMode('join')} className="btn-billard-secondary mode-button">
              <span className="text-2xl">🔗</span>
              <span>Rejoindre une partie</span>
            </button>
          </div>
        ) : gameMode === 'new' ? (
          <div className="create-game-section">
            <h3 className="section-title">Nouvelle partie</h3>
            <button onClick={handleCreateGame} disabled={loading} className="btn-billard-primary create-button">
              {loading ? 'Création...' : 'Créer une partie'}
            </button>
            <button onClick={() => setGameMode(null)} className="btn-billard-secondary back-button">Retour</button>
          </div>
        ) : (
          <div className="join-game-section">
            <h3 className="section-title">Rejoindre une partie</h3>
            <input type="text" placeholder="Code ou ID de la partie" className="join-input" />
            <button className="btn-billard-primary join-button">Rejoindre</button>
            <button onClick={() => setGameMode(null)} className="btn-billard-secondary back-button">Retour</button>
          </div>
        )}
      </div>
    </div>
  );
}