import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../services/firebase';

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    const profilesRef = ref(database, 'profiles');
    onValue(profilesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Transforme l'objet Firebase en tableau exploitable
        const list = Object.entries(data).map(([id, info]) => ({
          id,
          name: info.name || "Joueur inconnu", // On affiche le nom, pas l'ID
          wins: info.wins || 0,
          losses: info.losses || 0
        }));
        setProfiles(list);
      }
    });
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-3xl font-serif text-gold mb-8 border-b border-gold/30 pb-2">Joueurs du Club</h2>
      <div className="grid gap-4">
        {profiles.map((p) => (
          <div key={p.id} className="bg-dark-wood p-5 rounded-2xl border border-gold/40 shadow-xl flex items-center justify-between">
            <div>
              {/* ICI : On affiche uniquement le nom, pas l'ID */}
              <h3 className="text-2xl font-bold text-white">{p.name}</h3>
              <p className="text-gold text-sm">Victoires: {p.wins} | Défaites: {p.losses}</p>
            </div>
            <div className="w-12 h-12 bg-black rounded-full border-2 border-gold flex items-center justify-center font-bold">
              {p.name.substring(0, 1)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
