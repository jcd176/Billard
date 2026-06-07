import React, { useState } from 'react';

export default function DashboardPage({ user, onSelectGame, onLogout }) {
  const [selectedGame, setSelectedGame] = useState('');

  if (!user) return <div className="card">Chargement...</div>;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button onClick={onLogout} style={{ background: '#ff4d4d', color: '#fff', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '4px' }}>
          Déconnexion
        </button>
      </div>
      
      <h2>Salut {user.displayName} !</h2>
      <p>Choisis ta salle de jeu :</p>
      
      <select 
        value={selectedGame}
        onChange={(e) => setSelectedGame(e.target.value)} 
        className="join-input"
        style={{ width: '100%', padding: '10px', marginBottom: '20px', borderRadius: '4px' }}
      >
        <option value="">-- Sélectionner un sport --</option>
        <option value="billard">🎱 Billard</option>
        <option value="pingpong">🏓 Ping Pong</option>
        <option value="skate">🛹 Skate</option>
        <option value="tennis">🎾 Tennis</option>
        <option value="palets">🎯 Palets</option>
        <option value="petanque">🔘 Pétanque</option>
        <option value="babyfoot">⚽ Baby Foot</option>
      </select>

      <button 
        onClick={() => onSelectGame(selectedGame)} 
        className="btn-primary" 
        disabled={!selectedGame}
        style={{ width: '100%', padding: '12px', border: 'none', borderRadius: '4px' }}
      >
        Accéder à la salle
      </button>
    </div>
  );
}
