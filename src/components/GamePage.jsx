import React, { useState, useEffect } from 'react';
import { ref, onValue, update, remove } from 'firebase/database';
import { database } from '../services/firebase';
import { declareWinner, addLog } from '../services/gameService';

export default function GamePage({ roomId, onLeave }) {
  const [data, setData] = useState(null);
  const [winner, setWinner] = useState('');
  const [loser, setLoser] = useState('');

  useEffect(() => {
    return onValue(ref(database, `rooms/${roomId}`), (s) => setData(s.val()));
  }, [roomId]);

  const addPlayer = () => {
    const name = prompt("Nom du nouveau joueur :");
    if (name) {
      update(ref(database, `rooms/${roomId}/scores`), { [name]: { v: 0, d: 0 } });
      // CORRECTION : On passe 'name' au lieu de "Système"
      addLog(roomId, name, `a rejoint la partie`);
    }
  };

  const deletePlayer = (name) => {
    if (confirm(`Supprimer ${name} ?`)) {
      remove(ref(database, `rooms/${roomId}/scores/${name}`));
      // CORRECTION : On passe 'name' au lieu de "Système"
      addLog(roomId, name, `a quitté la partie`);
    }
  };

  const recordMatch = () => {
    if (winner && loser && winner !== loser) {
      declareWinner(roomId, winner, loser);
      setWinner(''); setLoser('');
    }
  };

  if (!data) return <div className="card">Chargement...</div>;

  const scores = data.scores || {};
  // On récupère bien les logs depuis Firebase
  const logs = data.logs ? Object.values(data.logs) : [];

  return (
    <div className="container">
      {/* ... Header et Formulaire Match (inchangés) ... */}
      
      {/* Historique mis à jour */}
      <div className="card">
        <h2>Historique de la session</h2>
        {logs.length === 0 ? <p style={{color:'#888', fontSize:'12px'}}>Aucun match enregistré</p> : 
         logs.slice().reverse().map((l, i) => (
           <div key={i} style={{fontSize:'13px', borderBottom:'1px solid #333', padding:'8px 0', display:'flex', justifyContent:'space-between'}}>
             <span>
               {l.action.includes("bat") ? (
                 <><strong style={{color:'#2a9d8f'}}>{l.user}</strong> bat <strong style={{color:'#ff4d4d'}}>{l.action.split("bat ")[1]}</strong></>
               ) : (
                 <><strong style={{color:'#aaa'}}>{l.user}</strong> <span style={{color:'#888'}}>{l.action}</span></>
               )}
             </span>
             <span style={{color: '#555', fontSize: '11px'}}>{new Date(l.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
           </div>
         ))}
      </div>
    </div>
  );
}
