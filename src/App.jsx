import React, { useState, useEffect } from 'react';
import { ref, onValue, set, remove, push } from 'firebase/database';
import { auth, database } from './services/firebase';
import HomePage from './components/HomePage';
import GamePage from './components/GamePage';

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('menu');
  const [roomId, setRoomId] = useState(null);
  const [rooms, setRooms] = useState({}); // Changé en objet pour stocker le type
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

  const createRoom = (name, type) => {
    if (!name) return;
    set(ref(database, `rooms/${name}`), { name, type, createdAt: Date.now() });
    push(ref(database, 'globalLogs'), { action: `a créé la salle '${name}' (${type})`, user: user.displayName || user.email, time: Date.now(), type: 'created' });
    setRoomId(name);
    setView('game');
  };

  const deleteRoom = (roomName, type) => {
    if (window.confirm(`Voulez-vous vraiment supprimer la salle ${roomName} ?`)) {
      if (type === 'principale') {
        const password = prompt("Salle principale : entrez le mot de passe 'root' pour valider :");
        if (password !== 'root') { alert("Mot de passe incorrect !"); return; }
      }
      remove(ref(database, `rooms/${roomName}`));
      push(ref(database, 'globalLogs'), { action: `a supprimé la salle '${roomName}'`, user: user.displayName || user.email, time: Date.now(), type: 'deleted' });
    }
  };

  if (!user) return <HomePage onUserLogin={setUser} />;

  return (
    <div className="container">
      {view === 'menu' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{margin:0}}>Bienvenue, {user.displayName || user.email}</h2>
            <button onClick={() => auth.signOut()} style={{ background: '#555', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px' }}>Se déconnecter</button>
          </div>
          <button className="btn-primary" onClick={() => setView('create')} style={{ marginBottom: '15px', width: '100%' }}>Créer une partie</button>
          
          <h3>Parties disponibles :</h3>
          {Object.entries(rooms).map(([name, data]) => (
            <div key={name} style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
              <button className="btn-primary" style={{ background: '#333', flex: 1, textAlign: 'left' }} onClick={() => { setRoomId(name); setView('game'); }}>
                {name} ({data.type})
              </button>
              <button onClick={() => deleteRoom(name, data.type)} style={{ background: 'transparent', border: '1px solid #555', borderRadius: '4px', padding: '0 10px', cursor: 'pointer' }}>🗑️</button>
            </div>
          ))}

          <div style={{ marginTop: '40px' }}>
            <h3>Historique Global</h3>
            {globalLogs.slice().reverse().map((l, i) => (
              <div key={i} style={{ fontSize: '11px', color: l.type === 'created' ? '#2ecc71' : '#e74c3c', padding: '4px 0' }}>
                {new Date(l.time).toLocaleDateString()} {new Date(l.time).toLocaleTimeString()} - {l.user} {l.action}
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'create' && (
        <div className="card">
          <h2>Nouvelle salle</h2>
          <input className="join-input" id="newRoomName" placeholder="Nom de la salle" />
          <select id="roomType" className="join-input" style={{marginBottom: '10px'}}>
            <option value="secondaire">Salle Secondaire</option>
            <option value="principale">Salle Principale</option>
          </select>
          <button className="btn-primary" onClick={() => createRoom(document.getElementById('newRoomName').value, document.getElementById('roomType').value)}>Lancer</button>
          <button onClick={() => setView('menu')} style={{ background: 'none', color: '#888', width: '100%', marginTop: '10px' }}>Annuler</button>
        </div>
      )}

      {view === 'game' && roomId && <GamePage roomId={roomId} onLeave={() => setView('menu')} />}
    </div>
  );
}
