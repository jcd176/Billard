import React, { useState } from 'react';

export default function DashboardPage({ onSelectSport, onLogout }) {
  const [selected, setSelected] = useState('');
  
  // Couleur utilisée pour le texte Score Game et le bouton
  const themeColor = '#00d0ff'; 

  const sports = [
    { id: 'billard', name: 'Billard', icon: '🎱' },
    { id: 'pingpong', name: 'Ping Pong', icon: '🏓' },
    { id: 'skate', name: 'Skate', icon: '🛹' },
    { id: 'tennis', name: 'Tennis', icon: '🎾' },
    { id: 'palets', name: 'Palets', icon: '🥏' },
    { id: 'petanque', name: 'Pétanque', icon: '🔘' },
    { id: 'babyfoot', name: 'Baby Foot', icon: '⚽' }
  ];

  return (
    <div className="card" style={{ position: 'relative', paddingTop: '80px' }}>
      {/* Bouton déconnexion rond, rouge avec flèche blanche agrandie */}
      <button 
        onClick={onLogout} 
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          width: '45px',
          height: '45px',
          borderRadius: '50%',
          background: '#ff4d4d',
          color: '#fff',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '28px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
        }}
        title="Déconnexion"
      >
        ↩
      </button>

      {/* Titre Score Game avec la couleur du bouton */}
      <h2 style={{ 
        textAlign: 'center', 
        marginBottom: '30px', 
        fontSize: '2.5rem', 
        fontWeight: 'bold',
        color: themeColor 
      }}>
        Score Game
      </h2>

      <div style={{ marginBottom: '20px' }}>
        <p style={{ textAlign: 'center', marginBottom: '10px' }}>Sélectionnez votre sport :</p>
        
        <select 
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="join-input"
          style={{ width: '100%', padding: '12px', borderRadius: '6px', fontSize: '16px', marginBottom: '20px' }}
        >
          <option value="">-- Choisir un sport --</option>
          {sports.map((sport) => (
            <option key={sport.id} value={sport.id}>
              {sport.icon} {sport.name}
            </option>
          ))}
        </select>

        {/* Bouton utilisant la classe btn-primary standard (la couleur du bouton n'est plus écrasée par du style inline) */}
        <button 
          onClick={() => selected && onSelectSport(selected)} 
          disabled={!selected}
          className="btn-primary"
          style={{ width: '100%', padding: '12px', borderRadius: '6px' }}
        >
          Valider le sport
        </button>
      </div>
    </div>
  );
}
