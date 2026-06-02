import React, { useState, useEffect } from 'react';
import { ref, onValue, set, remove, push, update } from 'firebase/database';
import { auth, database } from './services/firebase'; // Corrigé ici
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

  const adjustScore = (name, type) => {
    const player = players.find(p => p.name === name);
    if (!player) return;
    update(ref(database, `players/${name}`), {
      wins: type === 'win' ? player.wins + 1 : Math.max(0, player.wins - 1),
      losses: type === 'loss' ? player.losses + 1 : Math.max(0, player.losses - 1)
    });
  };

  const deletePlayer = (name) => {
    const password = prompt("Saisissez le mot de passe :");
    if (password !== 'root') { alert("Mot de passe incorrect !"); return; }
    remove(ref(database, `players/${name}`));
  };

  const createRoom = (name, isPrincipal) => {
    if (!name) return;
    set(ref(database, `rooms/${name}`), { name, type: isPrincipal ? 'principale' : 'secondaire', createdAt: Date.now() });
    setRoomId(name);
    setView('game');
  };

  const deleteRoom = (roomName, type) => {
    if (window.confirm("Supprimer cette salle ?")) {
      if (type === 'principale') {
        const password = prompt("Mot de passe :");
        if (password !== 'root') { alert("Incorrect !"); return; }
      }
      remove(ref(database, `rooms/${roomName}`));
    }
  };

  if (!user) return <HomePage onUserLogin={setUser} />;

  return (
    <div className="container">
      {view === 'menu' && (
        <div className="card">
          <h2>Salles</h2>
          <button className="btn-primary" onClick={() => setView('create')}>Créer une partie</button>
          
          <h3>Parties disponibles :</h3>
          {Object.entries(rooms).map(([name, data]) => (
            <div key={name} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'center' }}>
              <button className="btn-primary" style={{ background: '#333', flex: 1, textAlign: 'left' }} onClick={() => { setRoomId(name); setView('game'); }}>
                {data.type === 'principale' ? '👑 ' : ''}{name}
              </button>
              <button onClick={() => deleteRoom(name, data.type)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '32px' }}>🎱</button>
            </div>
          ))}
        </div>
      )}
      
      {view === 'create' && (
        <div className="card">
          <h2>Nouvelle salle</h2>
          <input className="join-input" id="newRoomName" placeholder="Nom de la salle" />
          <button className="btn-primary" onClick={() => createRoom(document.getElementById('newRoomName').value, document.getElementById('isPrincipal')?.checked)}>Lancer</button>
          <button onClick={() => setView('menu')} style={{background:'#ff4d4d', color:'#fff', border:'none', padding:'10px', width:'100%'}}>Annuler</button>
        </div>
      )}

      {view === 'game' && roomId && <GamePage roomId={roomId} onLeave={() => setView('menu')} />}
    </div>
  );
}
