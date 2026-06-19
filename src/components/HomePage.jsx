import React from 'react';
import { auth, googleProvider } from '../services/firebase';
import { signInWithPopup } from 'firebase/auth';

export default function HomePage({ onUserLogin }) {
  
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      onUserLogin();
    } catch (err) {
      alert("Erreur de connexion : " + err.message);
    }
  };

  return (
    <div className="card">
      <h2>Connexion</h2>
      <button 
        onClick={handleGoogleLogin} 
        className="btn-primary" 
        style={{ width: '100%', padding: '15px' }}
      >
        Connexion avec Google
      </button>
    </div>
  );
}
