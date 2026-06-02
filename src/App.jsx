import React, { useState, useEffect } from 'react';
import { ref, onValue, set, remove, push, update } from 'firebase/database';
import { auth, database } from './services/firebase';
import { signOut } from 'firebase/auth';
import HomePage from './components/HomePage';
import GamePage from './components/GamePage';

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('menu');
  const [roomId, setRoomId] = useState(null);
  const [rooms, setRooms] = useState({});
  const [globalLogs, setGlobalLogs] = useState([]);

  useEffect(() => {
    return auth.onAuthStateChanged(setUser);
  }, []);

  useEffect(() => {
    const roomsRef = ref(database, 'rooms');
    const logsRef = ref(database, 'globalLogs');
    const uR = onValue(roomsRef, (s) => setRooms(s.val() || {}));
    const uL = onValue(logsRef, (s) => setGlobalLogs(s.val() ? Object.values(s.val()) : []));
    return () => { uR(); uL(); };
  }, []);

  const handleLogout = () => { signOut(auth); };

  const createRoom = (name, isPrincipal) => {
    if (!name) return;
    set(ref(database, `rooms/${name}`), { name, type: isPrincipal ? 'principale' : 'secondaire', createdAt: Date.now() });
    push(ref(database, 'globalLogs'), { action: `a créé la salle '${name}'`, user: user.email, time: Date.now(), type: 'created' });
    setRoomId(name);
    setView('game');
  };

  const deleteRoom = (roomName, type) => {
    if (window.confirm(`Supprimer la salle ${roomName} ?`)) {
      if (type === 'principale') {
        const password = prompt("Saisissez le mot de passe");
        if (password !== 'root') {
          push(ref(database, 'globalLogs'), { action: `erreur suppression salle 👑 '${roomName}' (mauvais mdp)`, user: user.email, time: Date.now(), type: 'error' });
          alert("Mot de passe incorrect !");
          return;
        }
      }
      const logAction = type === 'principale' ? `a supprimé la salle 👑 '${roomName}'` : `a supprimé la salle '${roomName}'`;
      remove(ref(database, `rooms/${roomName}`));
      push(ref(database, 'globalLogs'), { action: logAction, user: user.email, time: Date.now(), type: 'deleted' });
    }
  };

  if (!user) return <HomePage onUserLogin={setUser} />;

  return (
    <div className="container">
      {view === 'menu' && (
        <div className="card">
          <h2>Salles</h2>
          <button onClick={handleLogout} style={{background: '#ff4d4d', color: '#fff', border: 'none', padding: '5px 10px', marginBottom: '10px', cursor: 'pointer'}}>Déconnexion</button>
          
          <button className="btn-primary" onClick={() => setView('create')} style={{width: '100%', padding: '10px', marginBottom: '20px'}}>Créer une partie</button>
          
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
          {globalLogs.slice().reverse().map((l, i) => {
            const color = l.type === 'created' ? '#2ecc71' : l.type === 'deleted' ? '#e74c3c' : l.type === 'error' ? '#9b59b6' : '#f1c40f';
            return (
              <div key={i} style={{ fontSize: '11px', color: color, padding: '2px 0' }}>
                {new Date(l.time).toLocaleTimeString()} - <strong>{l.user}</strong> {l.action}
              </div>
            );
          })}
        </div>
      )}
      
      {view === 'create' && (
        <div className="card" style={{ maxWidth: '400px', margin: '0 auto', boxSizing: 'border-box' }}>
          <h2>Nouvelle salle</h2>
          <input 
            id="newRoomName" 
            placeholder="Nom de la salle" 
            style={{ width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box' }} 
          />
          <div style={{color: 'white', marginBottom:'10px', textAlign: 'left'}}>
             <input type="checkbox" id="isPrincipal" style={{marginRight: '8px'}} /> Salle Principale 👑
          </div>
          <button 
            className="btn-primary" 
            style={{width: '100%', padding: '10px'}}
            onClick={() => createRoom(document.getElementById('newRoomName').value, document.getElementById('isPrincipal').checked)}
          >
            Lancer
          </button>
          <button onClick={() => setView('menu')} style={{marginTop:'10px', width:'100%', padding:'10px'}}>Annuler</button>
        </div>
      )}

      {view === 'game' && roomId && <GamePage roomId={roomId} onLeave={() => setView('menu')} />}
    </div>
  );
}
