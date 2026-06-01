import React from 'react';
import { signInWithGoogle, signInAnonymously } from '../services/authService';

export default function LoginPage() {
  return (
    // "min-h-screen flex flex-col items-center justify-center" centre tout verticalement et horizontalement
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-serif text-white mb-10 drop-shadow-md">
        BILLARD PARTY
      </h1>
      
      {/* "gap-4" crée l'espacement entre les deux boutons */}
      <div className="flex flex-col gap-4 w-full items-center">
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
