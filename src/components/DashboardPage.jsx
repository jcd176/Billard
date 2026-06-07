import React from 'react';

export default function DashboardPage({ user, onSelectSport, onLogout }) {
  const sports = ['billard', 'pingpong', 'skate', 'tennis', 'palets', 'petanque', 'babyfoot'];

  return (
    <div className="card">
      <button onClick={onLogout} style={{float: 'right'}}>Déconnexion</button>
      <h2>Salut {user?.displayName || 'Joueur'}</h2>
      <p>Choisis ton sport :</p>
      
      {sports.map(sport => (
        <button 
          key={sport} 
          onClick={() => onSelectSport(sport)} 
          className="btn-primary" 
          style={{display: 'block', width: '100%', marginBottom: '10px', textTransform: 'capitalize'}}
        >
          {sport}
        </button>
      ))}
    </div>
  );
}
