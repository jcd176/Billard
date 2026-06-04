import { useState, useEffect, useRef } from 'react';
import { ref, onValue, remove, push, update, set } from 'firebase/database';
import { database } from '../services/firebase';

export default function GamePage({ roomId, onLeave }) {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState({});
  const [logs, setLogs] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [winner, setWinner] = useState('');
  const [loser, setLoser] = useState('');
  
  // États pour la nouvelle PopUp de modification
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null); // { player, actionType, field }

  const prevLeaderIdRef = useRef(null);
  const lastLeaderAnnouncementRef = useRef(0);

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    const playersRef = ref(database, `rooms/${roomId}/players`);
    const unsubscribePlayers = onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, p]) => ({ id, ...p })) : [];
      const sorted = list.sort((a, b) => (b.wins || 0) - (a.wins || 0));
      setPlayers(sorted);
    });

    const matchesRef = ref(database, `rooms/${roomId}/matches`);
    const unsubscribeMatches = onValue(matchesRef, (snapshot) => setMatches(snapshot.val() || {}));

    const logsRef = ref(database, `rooms/${roomId}/logs`);
    const unsubscribeLogs = onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, log]) => ({ id, ...log })) : [];
      setLogs(list.reverse().slice(0, 10));
    });

    return () => { unsubscribePlayers(); unsubscribeMatches(); unsubscribeLogs(); };
  }, [roomId]);

  const addLog = (message, type) => push(ref(database, `rooms/${roomId}/logs`), { message, type, timestamp: Date.now() });

  const confirmAdjustScore = (targetId) => {
    const password = prompt("Saisissez le mot de passe");
    if (password === 'root') {
      const { player, actionType, field } = modalData;
      const targetPlayer = players.find(p => p.id === targetId);
      const val = actionType === 'plus' ? 1 : -1;
      
      update(ref(database, `rooms/${roomId}/players/${player.id}`), { [field]: Math.max(0, (player[field] || 0) + val) });
      update(ref(database, `rooms/${roomId}/players/${targetPlayer.id}`), { [field]: Math.max(0, (targetPlayer[field] || 0) - val) });
      
      addLog(`${val > 0 ? '+' : ''}${val} ${field === 'wins' ? 'Victoire' : 'Défaite'} "${player.name}" et ${val < 0 ? '+' : ''}${-val} ${field === 'wins' ? 'Victoire' : 'Défaite'} "${targetPlayer.name}"`, 'manual');
    } else {
      addLog(`Modification du Classement en échec`, 'error');
    }
    setIsModalOpen(false);
  };

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    push(ref(database, `rooms/${roomId}/players`), { name: newPlayerName, wins: 0, losses: 0 });
    addLog(`${newPlayerName} a rejoint la salle`, 'add');
    setNewPlayerName('');
  };

  const declareMatch = () => {
    if (!winner || !loser || winner === loser) return;
    const wPlayer = players.find(p => p.id === winner);
    const lPlayer = players.find(p => p.id === loser);
    update(ref(database, `rooms/${roomId}/players/${winner}`), { wins: (wPlayer.wins || 0) + 1 });
    update(ref(database, `rooms/${roomId}/players/${loser}`), { losses: (lPlayer.losses || 0) + 1 });
    addLog(`MATCH:${wPlayer.name}|${lPlayer.name}`, 'match');
    setWinner(''); setLoser('');
  };

  const resetAction = (type, path) => {
    if (prompt(`Mot de passe pour vider ${type} ?`) === 'root') {
      set(ref(database, `rooms/${roomId}/${path}`), null);
      addLog(`Réinitialisation de ${type} effectuée`, 'reset');
    } else { addLog(`Échec réinitialisation ${type}`, 'error'); }
  };

  const removePlayer = (playerId, playerName) => {
    if (prompt("Mot de passe suppression") === 'root') {
      remove(ref(database, `rooms/${roomId}/players/${playerId}`));
      addLog(`${playerName} a été supprimé`, 'remove');
    } else { addLog(`Suppression de "${playerName}" en échec`, 'error'); }
  };

  // Styles
  const btnReset = { background: 'transparent', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' };
  const btnAction = { border: 'none', background: 'none', cursor: 'pointer', padding: 0, fontSize: '20px' };

  return (
    <div className="card">
      {/* MODAL PERSONNALISÉE */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#333', padding: '20px', borderRadius: '8px', color: '#fff', width: '300px' }}>
            <h3>Transférer point</h3>
            <p>Sélectionner le joueur cible :</p>
            <select id="targetSelect" style={{ width: '100%', padding: '10px', marginBottom: '15px' }}>
              {players.filter(p => p.id !== modalData.player.id).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => confirmAdjustScore(document.getElementById('targetSelect').value)} className="btn-primary">Valider</button>
              <button onClick={() => setIsModalOpen(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      <button onClick={onLeave} style={{ marginBottom: '10px' }}>← Retour</button>
      <h2>Salle : {roomId}</h2>
      
      {/* ... (Code existant pour Ajouter Joueur et Déclarer Match reste identique) ... */}
      
      <table style={{ width: '100%', color: '#fff', borderCollapse: 'collapse' }}>
        <thead><tr><th>Joueur</th><th>Vict</th><th>Déf</th><th></th></tr></thead>
        <tbody>
          {players.map((p, i) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.wins || 0} 
                <button onClick={() => { setModalData({player: p, actionType: 'plus', field: 'wins'}); setIsModalOpen(true); }} style={btnAction}>🟢</button>
                <button onClick={() => { setModalData({player: p, actionType: 'minus', field: 'wins'}); setIsModalOpen(true); }} style={btnAction}>🔴</button>
              </td>
              <td>{p.losses || 0} 
                <button onClick={() => { setModalData({player: p, actionType: 'plus', field: 'losses'}); setIsModalOpen(true); }} style={btnAction}>🟢</button>
                <button onClick={() => { setModalData({player: p, actionType: 'minus', field: 'losses'}); setIsModalOpen(true); }} style={btnAction}>🔴</button>
              </td>
              <td><button onClick={() => removePlayer(p.id, p.name)} style={{ ...btnAction, fontSize: '28px' }}>🎱</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* ... (Reste du code pour Historique et Suivi identique) ... */}
    </div>
  );
}
