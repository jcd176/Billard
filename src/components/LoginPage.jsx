import React from 'react';
import { signInWithGoogle } from '../services/authService';

export default function LoginPage() {
  const handleLocalLogin = () => {
    // Pour une connexion locale simple, on pourrait stocker un nom en localStorage
    const name = prompt("Entrez votre nom :");
    if (name) localStorage.setItem('localUser', name);
    window.location.reload(); // Force le rafraîchissement pour passer à GamePage
  };

  return (
    <div className="relative min-h-screen flex items-center justify-end p-10 bg-[url('/billard-bg.jpg')] bg-cover bg-center">
      
      {/* Conteneur stylisé en bas à droite */}
      <div className="bg-black/60 p-8 rounded-xl border border-[#dfb743]/50 backdrop-blur-sm shadow-2xl w-80">
        <h1 className="text-3xl font-serif text-[#dfb743] mb-6 text-center">Billard Party</h1>
        
        <div className="flex flex-col gap-3">
          <button 
            onClick={signInWithGoogle}
            className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition"
          >
            Connexion Google
          </button>
          
          <button 
            onClick={handleLocalLogin}
            className="w-full bg-[#dfb743] text-black font-bold py-3 rounded-lg hover:bg-[#c6a23a] transition"
          >
            Connexion Locale
          </button>
        </div>
      </div>
    </div>
  );
}
