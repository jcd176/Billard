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
      addLog(roomId, "Système", `${name} a rejoint la partie.`);
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
      addLog(roomId, "Match", `${winner} a battu ${loser}`);
      setWinner(''); setLoser('');
    }
  };

  if (!data) return <div className="card">Chargement...</div>;
  const scores = data.scores || {};
  const logs = data.logs ? Object.values(data.logs) : [];

  return (
    <div className="container">
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ border: 'none', margin: 0 }}>{data.name}</h2>
        <button onClick={onLeave} style={{ background: 'none', border: 'none', color: '#ff4d4d' }}>Quitter</button>
      </div>

      <button onClick={addPlayer} className="btn-primary" style={{ marginBottom: '15px' }}>+ Ajouter un joueur</button>

      <div className="card">
        <h2>Classement</h2>
        <table>
          <thead><tr><th>Joueur</th><th>V</th><th>D</th><th>%</th><th></th></tr></thead>
          <tbody>
            {Object.entries(scores).map(([name, s]) => {
              const total = (s.v || 0) + (s.d || 0);
              const pct = total > 0 ? Math.round(((s.v || 0) / total) * 100) : 0;
              return (
                <tr key={name}>
                  <td>{name}</td><td>{s.v}</td><td>{s.d}</td><td>{pct}%</td>
                  <td><button onClick={() => deletePlayer(name)} style={{background:'none', color:'red'}}>×</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Historique</h2>
        {logs.slice().reverse().map((l, i) => <p key={i} style={{fontSize:'12px', margin:'5px 0'}}>{l.msg}</p>)}
      </div>
    </div>
  );
}
