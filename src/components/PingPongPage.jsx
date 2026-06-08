import { useState, useEffect, useRef } from 'react';
import { ref, onValue, remove, push, update, set } from 'firebase/database';
import { database } from '../services/firebase';

export default function GamePage({ roomId, onLeave }) {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState({});
  const [logs, setLogs] = useState([]);
  const [roomName, setRoomName] = useState(""); // Initialisé vide
  const [newPlayerName, setNewPlayerName] = useState('');
  const [winner, setWinner] = useState('');
  const [loser, setLoser] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [liveMatch, setLiveMatch] = useState(null); // Gère la rencontre sélectionnée
  const [modalAction, setModalAction] = useState(null);
  const [targetPlayerId, setTargetPlayerId] = useState('');
  const [matchOption, setMatchOption] = useState('delete');
  const [matchPopup, setMatchPopup] = useState(null);
  const [playerPopup, setPlayerPopup] = useState(null);

  const [showRanking, setShowRanking] = useState(true);
  const [showMatches, setShowMatches] = useState(true);
  const [showHistory, setShowHistory] = useState(true);

  const prevLeaderIdRef = useRef(null);

  const whiteIconStyle = { filter: 'brightness(0) invert(1)', fontSize: '14px', display: 'inline-block' };

  useEffect(() => {
    // Correction chemin BDD: rooms/pingpong/{roomId}/name
    const roomRef = ref(database, `rooms/pingpong/${roomId}/name`);
    const unsubscribeRoom = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) setRoomName(snapshot.val());
    });

    const playersRef = ref(database, `rooms/${roomId}/players`);
    const unsubscribePlayers = onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, p]) => ({ id, ...p })) : [];
      const sorted = list.sort((a, b) => (b.wins || 0) - (a.wins || 0));
      setPlayers(sorted);
      
      if (sorted.length > 0) {
        const currentLeader = sorted[0];
        if (prevLeaderIdRef.current !== null && prevLeaderIdRef.current !== currentLeader.id) {
          addLog(`Nouveau leader : ${currentLeader.name} 👑`, 'leader');
        }
        prevLeaderIdRef.current = currentLeader.id;
      }
    });

    const matchesRef = ref(database, `rooms/${roomId}/matches`);
    const unsubscribeMatches = onValue(matchesRef, (snapshot) => setMatches(snapshot.val() || {}));

    const logsRef = ref(database, `rooms/${roomId}/logs`);
    const unsubscribeLogs = onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, log]) => ({ id, ...log })) : [];
      setLogs(list.reverse());
    });

    return () => { unsubscribeRoom(); unsubscribePlayers(); unsubscribeMatches(); unsubscribeLogs(); };
  }, [roomId]);

  const addLog = (message, type) => push(ref(database, `rooms/${roomId}/logs`), { message, type, timestamp: Date.now() });

  // ... (Fonctions existantes: executeAdjustment, addPlayer, declareMatch, resetAction, removePlayer restent identiques)
  // Assurez-vous que les icones dans ces fonctions (si présentes) utilisent aussi 🏓

  return (
    <div className="card">
      {/* Modale Paramètres */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#333', padding: '20px', borderRadius: '8px', color: '#fff', textAlign: 'center', minWidth: '320px' }}>
            {modalAction?.matchId ? (
              <>
                <p>Action sur "{modalAction.matchNames}"</p>
                <select value={matchOption} onChange={(e) => setMatchOption(e.target.value)} style={{ width: '100%', marginBottom: '10px', padding: '10px' }}>
                  <option value="delete">Supprimer la rencontre</option>
                  <option value="reset">Réinitialiser la rencontre</option>
                </select>
              </>
            ) : (
              <select value={targetPlayerId} onChange={(e) => setTargetPlayerId(e.target.value)} style={{ width: '100%', marginBottom: '10px', padding: '10px' }}>
                <option value="">Choisir un joueur</option>
                {players.filter(p => p.id !== modalAction.player.id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
            <button onClick={executeAdjustment} style={{ marginRight: '10px' }}>Valider</button>
            <button onClick={() => setIsModalOpen(false)}>Annuler</button>
          </div>
        </div>
      )}

      {/* Modale Score Live */}
      {liveMatch && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div style={{ background: '#222', padding: '30px', borderRadius: '15px', color: '#fff', textAlign: 'center' }}>
            <h2>{liveMatch.p1} ({liveMatch.w1}) vs {liveMatch.p2} ({liveMatch.w2})</h2>
            <p>🏓 THEME PING PONG 🏓</p>
            <button style={{ width: '100%', padding: '15px', fontSize: '18px', background: '#007bff', border: 'none', color: '#fff', borderRadius: '5px' }}>Nouvelle Partie</button>
            <div style={{ marginTop: '20px' }}>
              <button onClick={() => setLiveMatch(null)} style={{ background: '#444', color: '#fff', padding: '10px 20px', marginRight: '10px' }}>Annuler</button>
              <button style={{ background: '#28a745', color: '#fff', padding: '10px 20px' }}>Valider Partie</button>
            </div>
          </div>
        </div>
      )}

      <h2>Salle : {roomName}</h2>

      {/* ... (Reste du rendu: Classement et Suivi des rencontres) */}
      {showMatches && (
        <div style={{ background: '#222', padding: '10px' }}>
          {Object.entries(matches).map(([id, m]) => (
            <div key={id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span onClick={() => setLiveMatch({id, ...m})} style={{ cursor: 'pointer', color: '#fff' }}>
                👑 {m.p1} ({m.w1}) vs 🏓 {m.p2} ({m.w2})
              </span>
              <button onClick={() => { setModalAction({matchId: id, matchNames: `${m.p1} vs ${m.p2}`, p1Name: m.p1, p2Name: m.p2, w1: m.w1, w2: m.w2}); setIsModalOpen(true); }}>🏓</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
