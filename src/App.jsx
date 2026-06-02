import React, { useState, useEffect } from 'react';
import { ref, onValue, set, remove, push } from 'firebase/database';
import { auth, database } from './services/firebase';
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

  const createRoom = (name, isPrincipal) => {
    if (!name) return;
    const type = isPrincipal ? 'principale' : 'secondaire';
    set(ref(database, `rooms/${name}`), { name, type, createdAt: Date.now() });
    push(ref(database, 'globalLogs'), { action: `a créé la salle '${name}'`, user: user.displayName || user.email, time: Date.now(), type: 'created' });
    setRoomId(name);
    setView('game');
  };

  const deleteRoom = (roomName, type) => {
    if (window.confirm(`Voulez-vous vraiment supprimer la salle ${roomName} ?`)) {
      if (type === 'principale') {
        const password = prompt("Saisissez le mot de passe :");
        if (password !== 'root') {
          push(ref(database, 'globalLogs'), { action: `❌ suppression salle '${roomName}' (mauvais mdp)`, user: user.displayName || user.email, time: Date.now(), type: 'error' });
          alert("Mot de passe incorrect !");
          return;
        }
      }
      // Utilisation de la couronne avec barre superposée : 👑\u0338
      const logAction = type === 'principale' ? `a supprimé la salle 👑\u0338 '${roomName}'` : `a supprimé la salle '${roomName}'`;
      remove(ref(database, `rooms/${roomName}`));
      push(ref(database, 'globalLogs'), { action: logAction, user: user.displayName || user.email, time: Date.now(), type: 'deleted' });
    }
  };

  const resetGlobalLogs = () => {
    const password = prompt("Saisissez le mot de passe :");
    if (password !== 'root') {
      push(ref(database, 'globalLogs'), { action: "erreur tentative réinitialisation historique (mauvais mdp)", user: user.displayName || user.email, time: Date.now(), type: 'error' });
      alert("Mot de passe incorrect !");
      return;
    }
    set(ref(database, 'globalLogs'), null);
    push(ref(database, 'globalLogs'), { action: "l'utilisateur a remis les compteurs à zéro !", user: "Système", time: Date.now(), type: 'reset' });
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
            <div key={name} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'center' }}>
              <button className="btn-primary" style={{ background: '#333', flex: 1, textAlign: 'left' }} onClick={() => { setRoomId(name); setView('game'); }}>
                {data.type === 'principale' ? '👑 ' : ''}{name}
              </button>
              <button onClick={() => deleteRoom(name, data.type)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '32px' }} title="Supprimer">
                🎱
              </button>
            </div>
          ))}

          <div style={{ marginTop: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{margin: 0}}>Historique</h3>
                <button onClick={resetGlobalLogs} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '32px', cursor: 'pointer' }} title="Réinitialiser">⟲</button>
            </div>
            
            <div style={{ marginTop: '10px' }}>
              {globalLogs.slice().reverse().map((l, i) => {
                let color = '#aaa';
                if (l.type === 'created') color = '#2ecc71';
                else if (l.type === 'deleted') color = '#e74c3c';
                else if (l.type === 'error') color = '#9b59b6';
                else if (l.type === 'reset') color = '#f1c40f';
                
                return (
                  <div key={i} style={{ fontSize: '11px', color: color, padding: '4px 0', borderBottom: '1px solid #222' }}>
                    {new Date(l.time).toLocaleDateString()} {new Date(l.time).toLocaleTimeString()} - <strong>{l.user}</strong> {l.action}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {view === 'create' && (
        <div className="card">
          <h2>Nouvelle salle</h2>
          <input className="join-input" id="newRoomName" placeholder="Nom de la salle" />
          <div style={{ margin: '15px 0', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input type="checkbox" id="isPrincipal" style={{ transform: 'scale(1.5)' }} />
            <label htmlFor="isPrincipal" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              Salle Principale 👑
            </label>
          </div>
          <button className="btn-primary" onClick={() => createRoom(document.getElementById('newRoomName').value, document.getElementById('isPrincipal').checked)}>Lancer</button>
          
          <button 
            onClick={() => setView('menu')} 
            style={{ 
              background: 'transparent', 
              color: '#ff4d4d', 
              width: '100%', 
              marginTop: '15px', 
              padding: '10px',
              border: '1px solid #ff4d4d',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Annuler
          </button>
        </div>
      )}

      {view === 'game' && roomId && <GamePage roomId={roomId} onLeave={() => setView('menu')} />}
    </div>
  );
}
