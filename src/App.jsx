import React, { useState, useEffect } from 'react';
import { ref, onValue, set, remove, push } from 'firebase/database';
import { auth, database } from './services/firebase';
import HomePage from './components/HomePage';
import GamePage from './components/GamePage';

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('menu'); // 'menu', 'create', 'game'
  const [roomId, setRoomId] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [globalLogs, setGlobalLogs] = useState([]);

  useEffect(() => {
    return auth.onAuthStateChanged(setUser);
  }, []);

  useEffect(() => {
    const roomsRef = ref(database, 'rooms');
    const logsRef = ref(database, 'globalLogs');
    
    // Lecture temps réel des salles
    const unsubscribeRooms = onValue(roomsRef, (s) => setRooms(s.val() ? Object.keys(s.val()) : []));
    // Lecture temps réel de l'historique global
    const unsubscribeLogs = onValue(logsRef, (s) => setGlobalLogs(s.val() ? Object.values(s.val()) : []));
    
    return () => { unsubscribeRooms(); unsubscribeLogs(); };
  }, []);

  const createRoom = (name) => {
    if (!name) return;
    set(ref(database, `rooms/${name}`), { name, createdAt: Date.now() });
    push(ref(database, 'globalLogs'), { 
      action: `a créé la salle '${name}'`, 
      user: user.displayName || user.email, 
      time: Date.now() 
    });
    setRoomId(name);
    setView('game');
  };

  const deleteRoom = (room) => {
    if (window.confirm(`Voulez-vous vraiment supprimer la salle ${room} ?`)) {
      remove(ref(database, `rooms/${room}`));
      push(ref(database, 'globalLogs'), { 
        action: `a supprimé la salle '${room}'`, 
        user: user.displayName || user.email, 
        time: Date.now() 
      });
    }
  };

  const resetGlobalLogs = () => {
    if (window.confirm("Réinitialiser tout l'historique global ?")) {
      set(ref(database, 'globalLogs'), null);
    }
  };

  if (!user) return <HomePage onUserLogin={setUser} />;

  return (
    <div className="container">
      {view === 'menu' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{margin:0}}>Bienvenue, {user.displayName || user.email}</h2>
            <button onClick={() => auth.signOut()} style={{ background: '#555', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
              Se déconnecter
            </button>
          </div>
          
          <button className="btn-primary" onClick={() => setView('create')} style={{ marginBottom: '15px', width: '100%' }}>Créer une partie</button>
          
          <h3>Parties disponibles :</h3>
          {rooms.map(room => (
            <div key={room} style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
              <button className="btn-primary" style={{ background: '#333', flex: 1, textAlign: 'left' }} onClick={() => { setRoomId(room); setView('game'); }}>
                {room}
              </button>
              <button onClick={() => deleteRoom(room)} style={{ background: '#8b0000', color: 'white', border: 'none', borderRadius: '4px', padding: '0 10px' }}>
                Supprimer
              </button>
            </div>
          ))}

          <div style={{ marginTop: '40px', borderTop: '1px solid #444', paddingTop: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{margin:0}}>Historique Global</h3>
              <button onClick={resetGlobalLogs} style={{ background:'none', border:'1px solid #555', color:'#888', fontSize:'10px', padding:'2px 5px', borderRadius:'4px' }}>Réinitialiser</button>
            </div>
            <div style={{ marginTop: '10px', maxHeight: '150px', overflowY: 'auto' }}>
              {globalLogs.slice().reverse().map((l, i) => (
                <div key={i} style={{ fontSize: '11px', color: '#aaa', padding: '4px 0', borderBottom: '1px solid #222' }}>
                  {new Date(l.time).toLocaleDateString()} {new Date(l.time).toLocaleTimeString()} - <strong>{l.user}</strong> {l.action}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === 'create' && (
        <div className="card">
          <h2>Nouvelle salle</h2>
          <input className="join-input" id="newRoomName" placeholder="Nom de la salle" />
          <button className="btn-primary" onClick={() => createRoom(document.getElementById('newRoomName').value)}>Lancer la partie</button>
          <button onClick={() => setView('menu')} style={{ background: 'none', color: '#888', width: '100%', marginTop: '10px', cursor: 'pointer' }}>Annuler</button>
        </div>
      )}

      {view === 'game' && roomId && (
        <GamePage roomId={roomId} onLeave={() => setView('menu')} />
      )}
    </div>
  );
}
