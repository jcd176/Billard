import { useState, useEffect, useRef } from 'react';
import { ref, onValue, remove, push, update, set } from 'firebase/database';
import { database } from '../services/firebase';

export default function GamePage({ roomId, onLeave }) {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState({});
  const [logs, setLogs] = useState([]);
  const [roomName, setRoomName] = useState('Chargement...');
  
  const [newPlayerName, setNewPlayerName] = useState('');
  const [winner, setWinner] = useState('');
  const [loser, setLoser] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [targetPlayerId, setTargetPlayerId] = useState('');
  const [matchOption, setMatchOption] = useState('delete');
  const [matchPopup, setMatchPopup] = useState(null);
  const [playerPopup, setPlayerPopup] = useState(null);

  const [showRanking, setShowRanking] = useState(true);
  const [showMatches, setShowMatches] = useState(true);
  const [showHistory, setShowHistory] = useState(true);

  const prevLeaderIdRef = useRef(null);

  // --- CHEMINS ---
  // On définit la racine spécifique au pingpong pour être sûr
  const baseRef = `rooms/pingpong/${roomId}`;

  useEffect(() => {
    // 1. Nom de la salle
    const roomRef = ref(database, `${baseRef}/name`);
    const unsubscribeRoom = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) setRoomName(snapshot.val());
    });

    // 2. Joueurs
    const playersRef = ref(database, `${baseRef}/players`);
    const unsubscribePlayers = onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, p]) => ({ id, ...p })) : [];
      const sorted = list.sort((a, b) => (b.wins || 0) - (a.wins || 0));
      setPlayers(sorted);
    });

    // 3. Matches
    const matchesRef = ref(database, `${baseRef}/matches`);
    const unsubscribeMatches = onValue(matchesRef, (snapshot) => setMatches(snapshot.val() || {}));

    // 4. Logs
    const logsRef = ref(database, `${baseRef}/logs`);
    const unsubscribeLogs = onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, log]) => ({ id, ...log })) : [];
      setLogs(list.reverse());
    });

    return () => { unsubscribeRoom(); unsubscribePlayers(); unsubscribeMatches(); unsubscribeLogs(); };
  }, [roomId]);

  // IMPORTANT : Assurez-vous d'utiliser baseRef dans toutes les fonctions (addLog, addPlayer, etc.)
  const addLog = (message, type) => push(ref(database, `${baseRef}/logs`), { message, type, timestamp: Date.now() });

  // ... [Insérez ici toutes vos autres fonctions : executeAdjustment, addPlayer, declareMatch, resetAction, removePlayer]
  // Note : Dans ces fonctions, remplacez les chemins `rooms/${roomId}/...` par `${baseRef}/...`

  return (
    <div className="card">
      <button onClick={onLeave}>↩</button>
      <h2>Match : {roomName}</h2>
      {/* ... [Insérez ici tout votre JSX de rendu comme dans le fichier Billard] */}
    </div>
  );
}
