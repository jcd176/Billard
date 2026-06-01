import React, { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
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
      addLog(roomId, "Système", `${name} a rejoint la partie`);
    }
  };

  const recordMatch = () => {
    if (winner && loser && winner !== loser) {
      declareWinner(roomId, winner, loser);
      setWinner(''); setLoser('');
    }
  };

  if (!data) return <div className="card" style={{color: 'white', textAlign: 'center'}}>Chargement...</div>;
  
  const scores = data.scores || {};
  const players = Object.keys(scores);
  const logs = data.logs ? Object.values(data.logs) : [];

  return (
    <div className="container">
      {/* Header */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ border: 'none', margin: 0 }}>{data.name}</h2>
        <button onClick={onLeave} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '20px' }}>⏻</button>
      </div>

      {/* Bouton Ajouter */}
      <button onClick={addPlayer} className="btn-primary" style={{ marginBottom: '15px' }}>+ Ajouter un joueur</button>
      
      {/* Formulaire Enregistrer match */}
      <div className="card">
        <h2>Enregistrer un match</h2>
        <select onChange={(e) => setWinner(e.target.value)} value={winner} className="join-input"><option value="">Vainqueur 🏆</option>{players.map(p => <option key={p} value={p}>{p}</option>)}</select>
        <select onChange={(e) => setLoser(e.target.value)} value={loser} className="join-input"><option value="">Perdant ❌</option>{players.map(p => <option key={p} value={p}>{p}</option>)}</select>
        <button onClick={recordMatch} className="btn-primary">Valider le match</button>
      </div>

      {/* Tableau de Classement */}
      <div className="card">
        <h2>Classement Général</h2>
        <table style={{ width: '100%', color: 'white', borderCollapse: 'collapse' }}>
          <thead><tr><th>Joueur</th><th>V</th><th>D</th><th>%</th></tr></thead>
          <tbody>
            {players.map(p => {
              const v = scores[p].v || 0;
              const d = scores[p].d || 0;
              const total = v + d;
              const pct = total > 0 ? Math.round((v / total) * 100) : 0;
              return (<tr key={p}><td>{p}</td><td>{v}</td><td>{d}</td><td>{pct}%</td></tr>);
            })}
          </tbody>
        </table>
      </div>

      {/* Historique */}
      <div className="card">
        <h2>Historique de la session</h2>
        {logs.length === 0 ? <p style={{color: '#888'}}>Aucun match enregistré</p> : 
         logs.slice().reverse().map((log, i) => <p key={i} style={{fontSize: '12px', borderBottom: '1px solid #333'}}>{log.msg}</p>)}
      </div>
    </div>
  );
}
