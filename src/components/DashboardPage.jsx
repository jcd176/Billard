import React from 'react';

export default function DashboardPage({ user, onSelectSport, onLogout }) {
  const sports = [
    { id: 'billard', name: 'Billard', icon: '🎱' },
    { id: 'pingpong', name: 'Ping Pong', icon: '🏓' },
    { id: 'skate', name: 'Skate', icon: '🛹' },
    { id: 'tennis', name: 'Tennis', icon: '🎾' },
    { id: 'palets', name: 'Palets', icon: '🎯' },
    { id: 'petanque', name: 'Pétanque', icon: '🔘' },
    { id: 'babyfoot', name: 'Baby Foot', icon: '⚽' }
  ];

  return (
    <div className="card" style={{ position: 'relative', paddingTop: '60px' }}>
      <button 
        onClick={onLogout} 
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: '#ff4d4d',
          color: 'white',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '14px'
        }}
      >
        Déconnexion
      </button>

      <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>
        Salut {user?.displayName || 'Joueur'} !
      </h2>
      <p style={{ textAlign: 'center', color: '#ccc', marginBottom: '30px' }}>
        Sélectionnez votre sport pour voir les salles
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        {sports.map((sport) => (
          <button 
            key={sport.id} 
            onClick={() => onSelectSport(sport.id)}
            className="btn-primary"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              borderRadius: '12px',
              fontSize: '18px',
              gap: '10px'
            }}
          >
            <span style={{ fontSize: '40px' }}>{sport.icon}</span>
            <span>{sport.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
