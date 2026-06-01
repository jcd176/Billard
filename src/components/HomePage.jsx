import React, { useState } from 'react';
import { signInAnonymously, signInWithGoogle } from '@/services/auth';
import { updateProfile } from 'firebase/auth';
import { auth } from '@/services/firebase';

export default function HomePage({ onUserLogin }) {
  const [loading, setLoading] = useState(false);
  const [guestPseudo, setGuestPseudo] = useState('');

  const handleAnonLogin = async (e) => {
    e.preventDefault();
    if (!guestPseudo.trim()) return alert('Veuillez choisir un pseudo');
    
    setLoading(true);
    try {
      const user = await signInAnonymously();
      if (user) {
        await updateProfile(user, { displayName: guestPseudo.trim() });
        onUserLogin(user);
      }
    } catch (error) {
      alert('Erreur : ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="container" style={{ maxWidth: '480px', margin: '0 auto', padding: '15px' }}>
      <div className="card">
        <h2>Connexion</h2>
        <form onSubmit={handleAnonLogin}>
          <input 
            className="join-input" 
            placeholder="Pseudo (ex: Joueur 1)" 
            value={guestPseudo} 
            onChange={(e) => setGuestPseudo(e.target.value)} 
          />
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Connexion...' : 'Continuer en tant qu\'invité'}
          </button>
        </form>
        <button onClick={signInWithGoogle} className="btn-primary" style={{ marginTop: '10px', background: '#4285f4' }}>
          Se connecter avec Google
        </button>
      </div>
    </div>
  );
}
