import React, { useState } from 'react';
import { auth, database, googleProvider, facebookProvider } from '../services/firebase';
import { signInWithPopup, signInAnonymously, updateProfile } from 'firebase/auth';
import { ref, get, child } from 'firebase/database';

export default function HomePage({ onUserLogin }) {
  const [pseudo, setPseudo] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!pseudo.trim()) return;

    // 1. Vérification si le pseudo est déjà pris dans la base de données
    const dbRef = ref(database);
    const snapshot = await get(child(dbRef, 'users'));
    if (snapshot.exists()) {
      const users = Object.values(snapshot.val());
      if (users.some(u => u.displayName === pseudo)) {
        alert("Ce pseudo est déjà utilisé !");
        return;
      }
    }

    // 2. Connexion anonyme si le pseudo est libre
    const { user } = await signInAnonymously(auth);
    await updateProfile(user, { displayName: pseudo });
    onUserLogin();
  };

  const handleSocialLogin = async (provider) => {
    try {
      await signInWithPopup(auth, provider);
      onUserLogin();
    } catch (err) {
      alert("Erreur de connexion : " + err.message);
    }
  };

  return (
    <div className="card">
      <h2>Connexion</h2>
      <form onSubmit={handleLogin} style={{ marginBottom: '20px' }}>
        <input className="join-input" value={pseudo} onChange={(e) => setPseudo(e.target.value)} placeholder="Pseudo" required />
        <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px' }}>Entrer</button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button onClick={() => handleSocialLogin(googleProvider)} className="btn-primary">Connexion Google</button>
        <button onClick={() => handleSocialLogin(facebookProvider)} className="btn-primary">Connexion Facebook</button>
      </div>
    </div>
  );
}
