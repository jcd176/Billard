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
        const list = Object.entries(data).map(([id, info]) => ({
          id, name: info.name || "Joueur", wins: info.wins || 0, losses: info.losses || 0
        }));
        setProfiles(list);
      }
    });
  }, []);

  return (
    <div className="p-6 text-white">
      <h2 className="text-3xl font-serif text-[#dfb743] mb-8 border-b border-[#dfb743]/30 pb-2">Joueurs du Club</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr className="text-[#dfb743] border-b border-[#dfb743]/30">
            <th className="py-3 text-left">Joueur</th>
            <th className="py-3 text-center">Victoires</th>
            <th className="py-3 text-center">Défaites</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((p) => (
            <tr key={p.id} className="border-b border-white/10 hover:bg-white/5">
              <td className="py-4 font-bold">{p.name}</td>
              <td className="py-4 text-center">{p.wins}</td>
              <td className="py-4 text-center">{p.losses}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
