import React, { useState } from 'react';
import { signInAnonymously } from '../services/auth';
import { updateProfile } from 'firebase/auth';

export default function HomePage({ onUserLogin }) {
  const [pseudo, setPseudo] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    const user = await signInAnonymously();
    await updateProfile(user, { displayName: pseudo });
    onUserLogin();
  };

  return (
    <div className="card">
      <h2>Connexion</h2>
      <form onSubmit={handleLogin}>
        <input className="join-input" value={pseudo} onChange={(e) => setPseudo(e.target.value)} placeholder="Pseudo" />
        <button type="submit" className="btn-primary">Entrer</button>
      </form>
    </div>
  );
}
