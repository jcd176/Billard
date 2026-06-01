import React, { useState } from 'react';
import { signInAnonymously, signInWithGoogle } from '@/services/auth';
import { updateProfile } from 'firebase/auth';
import { auth } from '@/services/firebase';

export default function HomePage({ onUserLogin }) {
  const [loading, setLoading] = useState(false);
  const [guestPseudo, setGuestPseudo] = useState('');

  const handleAnonLogin = async (e) => {
    e.preventDefault();
    if (!guestPseudo.trim()) return alert('Pseudo requis');
    setLoading(true);
    try {
      const user = await signInAnonymously();
      await updateProfile(user, { displayName: guestPseudo.trim() });
      onUserLogin(user);
    } catch (err) { alert(err.message); }
    setLoading(false);
  };

  return (
    <div className="container">
      <div className="card">
        <h2>Connexion</h2>
        <form onSubmit={handleAnonLogin}>
          <input className="join-input" placeholder="Votre pseudo" 
                 value={guestPseudo} onChange={(e) => setGuestPseudo(e.target.value)} />
          <button type="submit" className="btn-primary">Entrer en jeu</button>
        </form>
      </div>
    </div>
  );
}
