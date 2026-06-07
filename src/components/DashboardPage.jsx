import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState('');

  return (
    <div className="card">
      <button onClick={() => navigate('/login')}>← Retour Connexion</button>
      <h2 style={{marginTop: '20px'}}>Espace Sportif</h2>
      <select onChange={(e) => setSelected(e.target.value)} className="join-input">
        <option value="">-- Choisir un sport --</option>
        <option value="billard">🎱 Billard</option>
        <option value="ping-pong">🏓 Ping Pong</option>
        <option value="skate">🛹 Skate</option>
        <option value="tennis">🎾 Tennis</option>
        <option value="palets">🎯 Palets</option>
        <option value="petanque">🔘 Pétanque</option>
      </select>
      <button onClick={() => navigate(`/${selected}`)} disabled={!selected} className="btn-primary" style={{marginTop: '10px'}}>
        Accéder à la salle
      </button>
    </div>
  );
}
