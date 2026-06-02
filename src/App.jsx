import React, { useState, useEffect } from 'react';
import { ref, onValue, set, remove, push, update } from 'firebase/database';
import { auth, database } from './services/firebase'; 
import { signOut } from 'firebase/auth'; // Ajout pour la déconnexion
import HomePage from './components/HomePage';
import GamePage from './components/GamePage';

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('menu');
  const [roomId, setRoomId] = useState(null);
  const [rooms, setRooms] = useState({});
  const [players, setPlayers] = useState([]);
  const [globalLogs, setGlobalLogs] = useState([]);

  useEffect(() => {
    return auth.onAuthStateChanged(setUser);
  }, []);

  useEffect(() => {
    const roomsRef = ref(database, 'rooms');
    const logsRef = ref(database, 'globalLogs');
    const playersRef = ref(database, 'players');
    
    const uR = onValue(roomsRef, (s) => setRooms(s.val() || {}));
    const uL = onValue(logsRef, (s) => setGlobalLogs(s.val() ? Object.values(s.val()) : []));
    const uP = onValue(playersRef, (s) => {
      const data = s.val() ? Object.entries(s.val()).map(([name, stats]) => ({ name, ...stats })) : [];
      setPlayers(data.sort((a, b) => b.wins - a.wins));
    });
    return () => { uR(); uL(); uP(); };
  }, []);

  const handleLogout = () => { signOut(auth); };

  const deleteRoom = (roomName, type) => {
    if (window.confirm("Supprimer cette salle ?")) {
      if (type === 'principale') {
        const password = prompt("Mot de passe :");
        if (password !== 'root') { alert("Incorrect !"); return; }
      }
      remove(ref(database, `rooms/${roomName}`));
      push(ref(database, 'globalLogs'), { action: `a supprimé la salle '${roomName}'`, user: user.email, time: Date.now() });
    }
  };

  if (!user) return <HomePage onUserLogin={setUser} />;

  return (
    <div className="container">
      {view === 'menu' && (
        <div className="card">
          <h2>Salles</h2>
          <button onClick={handleLogout} style={{background: '#ff4d4d', color: '#fff', border: 'none', padding: '5px 10px', marginBottom: '10px'}}>Déconnexion</button>
          <button className="btn-primary" onClick={() => setView('create')}>Créer une partie</button>
          
          <h3>Parties disponibles :</h3>
          {Object.entries(rooms).map(([name, data]) => (
            <div key={name} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'center' }}>
              <button className="btn-primary" style={{ flex: 1, textAlign: 'left' }} onClick={() => { setRoomId(name); setView('game'); }}>
                {data.type === 'principale' ? '👑 ' : ''}{name}
              </button>
              <button onClick={() => deleteRoom(name, data.type)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '32px' }}>🎱</button>
            </div>
          ))}

          <h3>Historique</h3>
          {globalLogs.slice().reverse().map((l, i) => (
            <div key={i} style={{ fontSize: '11px', color: '#f1c40f' }}>{new Date(l.time).toLocaleTimeString()} - {l.action}</div>
          ))}
        </div>
      )}
      
      {view === 'game' && roomId && <GamePage roomId={roomId} onLeave={() => setView('menu')} />}
    </div>
  );
}
