import { useState, useEffect } from 'react';
import { ref, onValue, remove, push, update, set } from 'firebase/database';
import { database } from '../services/firebase';

export default function GamePage({ roomId, onLeave }) {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]); // Initialisé en tableau vide
  const [logs, setLogs] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [winner, setWinner] = useState('');
  const [loser, setLoser] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear()).slice(-2)}`;
  };

  useEffect(() => {
    const playersRef = ref(database, `rooms/${roomId}/players`);
    const unsubscribePlayers = onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, p]) => ({ id, ...p })) : [];
      setPlayers(list.sort((a, b) => (b.wins || 0) - (a.wins || 0)));
    });

    const matchesRef = ref(database, `rooms/${roomId}/matches`);
    const unsubscribeMatches = onValue(matchesRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, m]) => ({ id, ...m })) : [];
      setMatches(list);
    });

    const logsRef = ref(database, `rooms/${roomId}/logs`);
    const unsubscribeLogs = onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, log]) => ({ id, ...log })) : [];
      setLogs(list.reverse().slice(0, 10));
    });

    return () => { unsubscribePlayers(); unsubscribeMatches(); unsubscribeLogs(); };
  }, [roomId]);

  const addLog = (message, type) => push(ref(database, `rooms/${roomId}/logs`), { message, type, timestamp: Date.now() });

  const executeAdjustment = () => {
    const password = prompt("Saisissez le mot de passe");
    if (password === 'root') {
      const { player, type, field } = modalAction;
      const change = type === 'plus' ? 1 : -1;
      const newVal = Math.max(0, (player[field] || 0) + change);
      update(ref(database, `rooms/${roomId}/players/${player.id}`), { [field]: newVal });
      addLog(`${change > 0 ? '+' : ''}${change} ${field === 'wins' ? 'Victoire' : 'Défaite'} "${player.name}"`, 'manual');
    } else {
      addLog(`Echec modification Classement`, 'error');
    }
    setIsModalOpen(false);
  };

  const handleMatchAction = (action) => {
    const password = prompt("Saisissez le mot de passe");
    if (password === 'root') {
      if (action === 'delete') {
        remove(ref(database, `rooms/${roomId}/matches/${selectedMatch.id}`));
        addLog(`Match supprimé: ${selectedMatch.p1Name} vs ${selectedMatch.p2Name}`, 'remove');
      }
      setIsMatchModalOpen(false);
    } else {
      addLog(`Échec action sur match`, 'error');
    }
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
    push(ref(database, `rooms/${roomId}/matches`), { p1Name: wPlayer.name, p2Name: lPlayer.name, timestamp: Date.now() });
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

  const btnAction = { border: 'none', background: 'none', cursor: 'pointer', padding: '0 5px', fontSize: '20px' };

  return (
    <div className="card">
      {/* Modals de confirmation */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#333', padding: '20px', borderRadius: '8px', color: '#fff' }}>
            <p>Valider l'ajustement ?</p>
            <button onClick={executeAdjustment}>Valider</button>
            <button onClick={() => setIsModalOpen(false)}>Annuler</button>
          </div>
        </div>
      )}

      {isMatchModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#333', padding: '20px', borderRadius: '8px', color: '#fff' }}>
            <p>Action pour {selectedMatch?.p1Name} vs {selectedMatch?.p2Name}</p>
            <button onClick={() => handleMatchAction('delete')} style={{ color: 'red' }}>Supprimer le match</button>
            <button onClick={() => setIsMatchModalOpen(false)}>Annuler</button>
          </div>
        </div>
      )}

      <button onClick={onLeave}>← Retour</button>
      <h2>Salle : {roomId}</h2>
      
      {/* Saisie Joueur */}
      <div style={{ display: 'flex', gap: '5px', marginBottom: '20px' }}>
        <input value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Nom du joueur" />
        <button onClick={addPlayer}>Ajouter</button>
      </div>

      {/* Déclaration Match */}
      <div style={{ background: '#333', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
        <select value={winner} onChange={(e) => setWinner(e.target.value)}><option value="">Vainqueur</option>{players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <select value={loser} onChange={(e) => setLoser(e.target.value)}><option value="">Perdant</option>{players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <button onClick={declareMatch}>Déclarer Match</button>
      </div>

      {/* Classement */}
      <h3>Classement :</h3>
      <table style={{ width: '100%', color: '#fff' }}>
        <tbody>
          {players.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.wins || 0} <button onClick={() => { setModalAction({player: p, type: 'plus', field: 'wins'}); setIsModalOpen(true); }}>+</button></td>
              <td>{p.losses || 0} <button onClick={() => { setModalAction({player: p, type: 'plus', field: 'losses'}); setIsModalOpen(true); }}>+</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Suivi des rencontres */}
      <h3>Suivi des rencontres :</h3>
      <div style={{ background: '#222', padding: '10px' }}>
        {matches.map((m) => (
          <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{m.p1Name} vs {m.p2Name}</span>
            <button onClick={() => { setSelectedMatch(m); setIsMatchModalOpen(true); }} style={btnAction}>🎱</button>
          </div>
        ))}
      </div>
    </div>
  );
}
