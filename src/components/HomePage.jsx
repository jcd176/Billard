import React, { useState } from 'react';
import { signInAnon, signInWithGoogle } from '@/services/auth';
import { createGame } from '@/services/gameService';
import { updateProfile } from 'firebase/auth';

export default function HomePage({ onUserLogin, onGameSelect, user }) {
  const [loading, setLoading] = useState(false);
  const [gameMode, setGameMode] = useState(null);
  const [guestPseudo, setGuestPseudo] = useState('');
  const [localPlayers, setLocalPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [gameName, setGameName] = useState('Partie de Billard');

  const handleAnonLogin = async (e) => {
    e.preventDefault();
    if (!guestPseudo.trim()) return alert('Choisissez un pseudo');
    setLoading(true);
    try {
      const currentUser = await signInAnon();
      await updateProfile(currentUser, { displayName: guestPseudo.trim() });
      onUserLogin(currentUser);
    } catch (error) { alert('Erreur: ' + error.message); }
    setLoading(false);
  };

  const handleCreateGame = async () => {
    if (localPlayers.length === 0) return alert('Ajoutez un joueur');
    setLoading(true);
    try {
      const playersObject = {};
      localPlayers.forEach((name, index) => playersObject[`p_${index}`] = { name, score: 0 });
      const gameId = await createGame({ gameName, players: playersObject, status: 'active' });
      onGameSelect(gameId);
    } catch (error) { alert('Erreur: ' + error.message); }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto' }}>
      {!user ? (
        <div className="card">
          <h2>Connexion</h2>
          <form onSubmit={handleAnonLogin}>
            <input className="join-input" value={guestPseudo} onChange={(e) => setGuestPseudo(e.target.value)} placeholder="Pseudo invité" />
            <button type="submit" className="btn-billard-primary">Continuer</button>
          </form>
        </div>
      ) : (
        <div className="card">
          <h2>Gestion de la Session</h2>
          {!gameMode ? (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setGameMode('new')} className="btn-billard-primary">Créer</button>
            </div>
          ) : (
            <div>
              <input className="join-input" value={gameName} onChange={(e) => setGameName(e.target.value)} placeholder="Nom" />
              <button onClick={handleCreateGame} className="btn-billard-primary">Lancer la partie</button>
              <button onClick={() => setGameMode(null)} className="btn-billard-secondary" style={{ marginTop: '10px' }}>Retour</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
