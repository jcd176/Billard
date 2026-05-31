import React from 'react';
import { signInWithGoogle } from '../services/authService';

export default function LoginPage() {
  const handleLocalLogin = () => {
    const name = prompt("Entrez votre nom :");
    if (name) {
      localStorage.setItem('localUser', name);
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('/billard-bg.jpg')] bg-cover bg-center p-4">
      <div className="bg-black/80 p-10 rounded-2xl border border-[#dfb743] shadow-2xl w-full max-w-md text-center">
        <h1 className="text-4xl font-serif text-[#dfb743] mb-10 tracking-widest">BILLARD PARTY</h1>
        
        <div className="flex flex-col gap-6">
          <button 
            onClick={signInWithGoogle}
            className="w-full bg-[#dfb743] text-black font-bold py-4 rounded-lg hover:bg-[#c6a23a] transition-all"
          >
            Connexion Google
          </button>
          
          <button 
            onClick={handleLocalLogin}
            className="w-full bg-[#1a1a1a] text-white font-bold py-4 rounded-lg border border-[#dfb743] hover:bg-[#333] transition-all"
          >
            Connexion Locale
          </button>
        </div>
      </div>
    </div>
  );
}
