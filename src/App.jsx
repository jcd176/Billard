import React, { useState, useEffect } from 'react';
import { ref, onValue, set, remove, push, update } from 'firebase/database';
import { auth, database } from './services/firebase';
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
    push(ref(database, 'globalLogs'), { action: `a supprimé le joueur '${name}'`, user: user.displayName || user.email, time: Date.now(), type: 'deleted' });
  };

  const resetPlayerStats = (name) => {
    const password = prompt("Saisissez le mot de passe :");
    if (password !== 'root') { alert("Mot de passe incorrect !"); return; }
    set(ref(database, `players/${name}`), { wins: 0, losses: 0 });
    push(ref(database, 'globalLogs'), { action: `l'utilisateur a remis les compteurs à zéro ! (${name})`, user: user.displayName || user.email, time: Date.now(), type: 'reset' });
  };

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
      const logAction = type === 'principale' ? `a supprimé la salle 👑̷ '${roomName}'` : `a supprimé la salle '${roomName}'`;
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
          <h2>Salles</h2>
          {players.map((p, i) => (
            <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{flex: 1}}>{i === 0 ? '👑 ' : ''}{p.name}</span>
              <button onClick={() => adjustScore(p.name, 'win')}>+</button>
              <span style={{width:'60px', textAlign:'center'}}>{p.wins}V-{p.losses}D</span>
              <button onClick={() => adjustScore(p.name, 'loss')}>-</button>
              <button onClick={() => resetPlayerStats(p.name)} style={{background:'none', border:'none', color:'#fff', fontSize:'24px', cursor:'pointer'}}>⟲</button>
              <button onClick={() => deletePlayer(p.name)} style={{background:'none', border:'none', fontSize:'32px', cursor:'pointer'}} title="Supprimer joueur">🎱</button>
            </div>
          ))}

          <button className="btn-primary" onClick={() => setView('create')} style={{ margin: '20px 0', width: '100%' }}>Créer une partie</button>
          
          <h3>Parties disponibles :</h3>
          {Object.entries(rooms).map(([name, data]) => (
            <div key={name} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'center' }}>
              <button className="btn-primary" style={{ background: '#333', flex: 1, textAlign: 'left' }} onClick={() => { setRoomId(name); setView('game'); }}>
                {data.type === 'principale' ? '👑 ' : ''}{name}
              </button>
              <button onClick={() => deleteRoom(name, data.type)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '32px' }}>🎱</button>
            </div>
          ))}

          <div style={{ marginTop: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{margin: 0}}>Historique</h3>
                <button onClick={resetGlobalLogs} style={{ background: 'none', border: 'none', color:'#fff', fontSize: '32px', cursor: 'pointer' }}>⟲</button>
            </div>
            {globalLogs.slice().reverse().map((l, i) => {
              let color = l.type === 'created' ? '#2ecc71' : l.type === 'deleted' ? '#e74c3c' : l.type === 'error' ? '#9b59b6' : '#f1c40f';
              return (
                <div key={i} style={{ fontSize: '11px', color: color, padding: '4px 0' }}>
                  {new Date(l.time).toLocaleTimeString()} - <strong>{l.user}</strong> {l.action}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {view === 'create' && (
        <div className="card">
          <h2>Nouvelle salle</h2>
          <input className="join-input" id="newRoomName" placeholder="Nom de la salle" />
          <div style={{ margin: '15px 0', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input type="checkbox" id="isPrincipal" style={{ transform: 'scale(1.5)' }} />
            <label htmlFor="isPrincipal">Salle Principale 👑</label>
          </div>
          <button className="btn-primary" onClick={() => createRoom(document.getElementById('newRoomName').value, document.getElementById('isPrincipal').checked)}>Lancer</button>
          <button onClick={() => setView('menu')} style={{marginTop:'10px', background:'#ff4d4d', color:'#fff', border:'none', padding:'10px', width:'100%', cursor:'pointer'}}>Annuler</button>
        </div>
      )}

      {view === 'game' && roomId && <GamePage roomId={roomId} onLeave={() => setView('menu')} />}
    </div>
  );
}
