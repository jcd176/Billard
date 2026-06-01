import React from 'react';
import { signInWithGoogle, signInAnonymously } from '../services/authService';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-serif text-white mb-10 drop-shadow-md">BILLARD PARTY</h1>
      
      {/* Conteneur flex pour centrer et espacer les boutons */}
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button onClick={signInWithGoogle} className="btn-emerald">
          Connexion Google
        </button>
        <button onClick={signInAnonymously} className="btn-emerald">
          Connexion Locale
        </button>
      </div>
    </div>
  );
}
