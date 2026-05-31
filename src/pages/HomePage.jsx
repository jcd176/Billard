import React, { useState } from 'react';
import { signInAnon, signInWithGoogle } from '@/services/auth';
import { createGame } from '@/services/gameService';
import './HomePage.css';

export default function HomePage({ onUserLogin, onGameSelect, user }) {
  const [loading, setLoading] = useState(false);
  const [gameMode, setGameMode] = useState(null);
  
  // Nouveaux états pour la gestion des joueurs à l'accueil
  const [localPlayers, setLocalPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [gameName, setGameName] = useState('Partie de Billard');

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

  // Ajoute un joueur dans la liste locale temporaire
  const handleAddLocalPlayer = (e) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    
    // On évite les doublons de noms
    if (localPlayers.includes(newPlayerName.trim())) {
      alert('Ce nom de joueur existe déjà');
      return;
    }

    setLocalPlayers([...localPlayers, newPlayerName.trim()]);
    setNewPlayerName('');
  };

  // Retire un joueur de la liste locale avant de lancer
  const handleRemoveLocalPlayer = (indexToRemove) => {
    setLocalPlayers(localPlayers.filter((_, index) => index !== indexToRemove));
  };

  const handleCreateGame = async () => {
    if (localPlayers.length === 0) {
      alert('Veuillez ajouter au moins un joueur pour lancer la partie.');
      return;
    }

    setLoading(true);
    try {
      // Transformation du tableau de noms en un objet structuré pour Firebase Realtime Database
      // Exemple : { "p1": { name: "John", score: 0 }, "p2": { name: "Alice", score: 0 } }
      const playersObject = {};
      localPlayers.forEach((name, index) => {
        playersObject[`p_${Date.now()}_${index}`] = {
          name: name,
          score: 0
        };
      });

      const gameId = await createGame({
        gameName: gameName.trim() || 'Partie de Billard',
        players: playersObject,
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
            
            {/* Configuration du nom de la partie */}
            <div className="form-group mb-4">
              <input 
                type="text" 
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                placeholder="Nom de la partie (ex: Tournoi Salon)" 
                className="join-input"
              />
            </div>

            {/* Saisie des joueurs */}
            <form onSubmit={handleAddLocalPlayer} className="add-player-home-form" style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <input 
                type="text" 
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Nom du joueur" 
                className="join-input"
                style={{ marginBottom: 0 }}
              />
              <button type="submit" className="btn-billard-primary" style={{ padding: '0 20px' }}>+</button>
            </form>

            {/* Liste des joueurs ajoutés */}
            {localPlayers.length > 0 && (
              <div className="local-players-list" style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', marginBottom: '15px', textAlign: 'left' }}>
                <p style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>Joueurs sur la ligne de départ :</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {localPlayers.map((name, index) => (
                    <span key={index} style={{ background: '#fff', color: '#333', padding: '4px 10px', borderRadius: '15px', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      {name}
                      <button type="button" onClick={() => handleRemoveLocalPlayer(index)} style={{ border: 'none', background: 'none', color: '#ff4d4d', cursor: 'pointer', fontWeight: 'bold', padding: 0 }}>×</button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button 
              onClick={handleCreateGame} 
              disabled={loading || localPlayers.length === 0} 
              className="btn-billard-primary create-button"
            >
              {loading ? 'Création...' : `Lancer la partie (${localPlayers.length} joueur${localPlayers.length > 1 ? 's' : ''})`}
            </button>
            <button onClick={() => { setGameMode(null); setLocalPlayers([]); }} className="btn-billard-secondary back-button">Retour</button>
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
