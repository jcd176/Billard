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
      addLog(roomId, "Système", `${name} a rejoint.`);
    }
  };

  const deletePlayer = (name) => {
    if (confirm(`Supprimer ${name} ?`)) {
      remove(ref(database, `rooms/${roomId}/scores/${name}`));
      addLog(roomId, "Système", `${name} a été supprimé.`);
    }
  };

  const recordMatch = () => {
    if (winner && loser && winner !== loser) {
      declareWinner(roomId, winner, loser);
      setWinner(''); 
      setLoser('');
    }
  };

  if (!data) return <div className="card" style={{color:'white', textAlign:'center'}}>Chargement...</div>;
  
  const scores = data.scores || {};
  const logs = data.logs ? Object.values(data.logs) : [];

  return (
    <div className="container">
      {/* Header */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ border: 'none', margin: 0 }}>{data.name}</h2>
        <button onClick={onLeave} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer' }}>Quitter</button>
      </div>

      <button onClick={addPlayer} className="btn-primary" style={{ marginBottom: '15px' }}>+ Ajouter un joueur</button>

      {/* Formulaire Enregistrer match */}
      <div className="card">
        <h2>Enregistrer un match</h2>
        <select onChange={(e) => setWinner(e.target.value)} value={winner} className="join-input">
          <option value="">Vainqueur 🏆</option>
          {Object.keys(scores).map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select onChange={(e) => setLoser(e.target.value)} value={loser} className="join-input">
          <option value="">Perdant ❌</option>
          {Object.keys(scores).map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <button onClick={recordMatch} className="btn-primary">Valider le match</button>
      </div>

      {/* Classement */}
      <div className="card">
        <h2>Classement</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
          <thead>
            <tr style={{ color: '#aaa', fontSize: '14px' }}>
              <th style={{ textAlign: 'left', padding: '8px' }}>Joueur</th>
              <th>V</th><th>D</th><th>%</th><th></th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(scores).map(([name, s]) => {
              const total = (s.v || 0) + (s.d || 0);
              const pct = total > 0 ? Math.round(((s.v || 0) / total) * 100) : 0;
              return (
                <tr key={name} style={{ borderBottom: '1px solid #333' }}>
                  <td style={{ padding: '8px' }}>{name}</td>
                  <td style={{ textAlign: 'center' }}>{s.v}</td>
                  <td style={{ textAlign: 'center' }}>{s.d}</td>
                  <td style={{ textAlign: 'center' }}>{pct}%</td>
                  <td style={{ textAlign: 'center' }}>
                    <button onClick={() => deletePlayer(name)} style={{background:'none', color:'red', border:'1px solid #555', cursor:'pointer', borderRadius:'4px'}}>×</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Historique */}
      <div className="card">
        <h2>Historique</h2>
        {logs.length === 0 ? <p style={{color:'#888', fontSize:'12px'}}>Aucun match enregistré</p> : 
         logs.slice().reverse().map((l, i) => (
           <p key={i} style={{fontSize:'12px', borderBottom:'1px solid #333', padding:'8px 0', margin:0}}>
             <strong>{l.user}</strong> {l.action}
           </p>
         ))}
      </div>
    </div>
  );
}
