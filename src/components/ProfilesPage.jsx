import React, { useState, useEffect } from 'react';
import { subscribeToProfiles, updateProfileName } from '../services/gameService';

function ProfilesPage() {
  const [profiles, setProfiles] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [tempName, setTempName] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeToProfiles((data) => setProfiles(data));
    return () => unsubscribe();
  }, []);

  const startEdit = (id, currentName) => {
    setEditingId(id);
    setTempName(currentName);
  };

  const saveEdit = async (id) => {
    if (tempName.trim()) {
      await updateProfileName(id, tempName.trim());
      setEditingId(null);
    }
  };

  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-white/10 shadow-xl">
      <h2 className="text-2xl font-serif text-gold mb-6 border-b border-white/10 pb-4"><i className="fa-solid fa-user-gear mr-2"></i>Gestion des profils du Club</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.values(profiles).map((player) => (
          <div key={player.id} className="bg-dark-wood p-4 rounded-xl border border-amber-900/30 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3 flex-growmr-4">
              {/* Icône de Billard stylisée en Avatar */}
              <div className="w-12 h-12 rounded-full bg-black border-2 border-white flex items-center justify-center font-bold text-white shadow font-mono text-sm">
                {player.name.substring(0, 2).toUpperCase()}
              </div>

              {editingId === player.id ? (
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  maxLength={15}
                  className="bg-black/50 border border-gold/40 text-ivory rounded px-3 py-1.5 font-bold focus:outline-none focus:border-gold w-full max-w-[180px]"
                />
              ) : (
                <div>
                  <h3 className="text-lg font-bold text-ivory">{player.name}</h3>
                  <p className="text-xs text-ivory/50">ID permanent: {player.id}</p>
                </div>
              )}
            </div>

            <div>
              {editingId === player.id ? (
                <button
                  onClick={() => saveEdit(player.id)}
                  className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-1.5 px-3 rounded text-sm transition-all shadow"
                >
                  <i className="fa-solid fa-check mr-1"></i>Sauver
                </button>
              ) : (
                <button
                  onClick={() => startEdit(player.id, player.name)}
                  className="bg-white/5 hover:bg-gold hover:text-dark-wood text-gold border border-gold/30 hover:border-transparent font-bold py-1.5 px-3 rounded text-sm transition-all"
                >
                  <i className="fa-solid fa-pen-to-square mr-1"></i>Modifier
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProfilesPage;
