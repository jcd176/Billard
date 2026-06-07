import React, { useState, useEffect } from 'react';
import { ref, onValue, push, remove } from 'firebase/database';
import { database } from '../services/firebase';

export default function RoomListPage({ sport, onBack, onJoin }) {
  const [rooms, setRooms] = useState({});
  const [newRoomName, setNewRoomName] = useState('');
  const [isMain, setIsMain] = useState(false);

  // Correspondance des icônes
  const sportIcons = {
    'billard': '🎱', 'pingpong': '🏓', 'skate': '🛹',
    'tennis': '🎾', 'palets': '🥏', 'petanque': '🔘', 'babyfoot': '⚽'
  };

  // Correspondance des labels d'en-tête selon le sport
  const sportLabels = {
    'billard': 'Salle',
    'pingpong': 'Match',
    'skate': 'Session',
    'tennis': 'Match',
    'palets': 'Partie',
    'petanque': 'Partie',
    'babyfoot': 'Partie'
  };

  useEffect(() => {
    // Les parties ne sont bien récupérées que pour le sport sélectionné
    const roomsRef = ref(database, `rooms/${sport}`);
    return onValue(roomsRef, (s) => setRooms(s.val() || {}));
  }, [sport]);

  const handleCheckboxChange = (e) => {
    const checked = e.target.checked;
    if (checked) {
      alert("Un mot de passe sera demandé pour sa suppression.\nContactez l'administrateur.");
    }
    setIsMain(checked);
  };

  const createRoom = () => {
    if (!newRoomName.trim()) return;
    push(ref(database, `rooms/${sport}`), { 
      name: newRoomName, 
      createdAt: Date.now(), 
      isMain: isMain 
    });
    setNewRoomName('');
    setIsMain(false);
  };

  const handleDelete = (id, data) => {
    const confirmed = window.confirm(`Voulez-vous supprimer la partie "${data.name}" ?`);
    if (!confirmed) return;
    if (data.isMain) {
      const password = prompt("Saisissez le mot de passe :");
      if (password !== 'root') return alert("Mot de passe incorrect.");
    }
    remove(ref(database, `rooms/${sport}/${id}`));
  };

  return (
    <div className="card" style={{ position: 'relative', paddingTop: '80px' }}>
      <button 
        onClick={onBack} 
        style={{
          position: 'absolute', top: '20px', left: '20px', width: '45px', height: '45px',
          borderRadius: '50%', background: '#ff4d4d', color: '#fff', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          fontSize: '28px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
        }}
      >
        ↩
      </button>

      {/* Affichage dynamique du titre selon le sport */}
      <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#fff', textTransform: 'capitalize' }}>
        {sport.replace('pingpong', 'Ping Pong').replace('babyfoot', 'Baby Foot')} : {sportLabels[sport] || 'Salle'}
      </h2>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <input 
          className="join-input" 
          placeholder={`Nom de la ${sportLabels[sport] || 'salle'}`} 
          value={newRoomName} 
          onChange={(e) => setNewRoomName(e.target.value)} 
          style={{ flex: 1 }}
        />
        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', color: '#fff' }}>
          <input type="checkbox" checked={isMain} onChange={handleCheckboxChange} />
          👑
        </label>
      </div>
      
      <button onClick={createRoom} className="btn-primary" style={{width: '100%', marginBottom: '40px'}}>Créer</button>

      {Object.entries(rooms).map(([id, data]) => (
        <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
          {data.isMain && <span>👑</span>}
          
          <button 
            onClick={() => onJoin(id)} 
            style={{ 
              flex: 1, textAlign: 'left', background: 'transparent', 
              border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#fff' 
            }}
          >
            {data.name}
          </button>
          
          <button 
            onClick={() => handleDelete(id, data)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
          >
            {sportIcons[sport] || '🗑️'}
          </button>
        </div>
      ))}
    </div>
  );
}
