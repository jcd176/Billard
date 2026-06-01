import React, { useState } from 'react';
import { signInAnon } from '@/services/auth';
import { updateProfile } from 'firebase/auth';

export default function HomePage({ onUserLogin, onGameSelect, user }) {
  const [guestPseudo, setGuestPseudo] = useState('');

  const handleAnonLogin = async (e) => {
    e.preventDefault();
    const currentUser = await signInAnon();
    await updateProfile(currentUser, { displayName: guestPseudo || 'Invité' });
    onUserLogin(currentUser);
  };

  return (
    <div className="container">
      <div className="card">
        <h2>Gestion de la Session</h2>
        <form onSubmit={handleAnonLogin}>
          <input className="join-input" placeholder="Pseudo (ex: Joueur 1)" 
                 value={guestPseudo} onChange={(e) => setGuestPseudo(e.target.value)} />
          <button type="submit" className="btn-primary">Créer / Rejoindre</button>
        </form>
      </div>
    </div>
  );
}
