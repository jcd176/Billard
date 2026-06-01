import React, { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../services/firebase';

export default function LogsPage({ roomId }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (!roomId) return;
    const logsRef = ref(database, `rooms/${roomId}/logs`);
    return onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const logsArray = Object.values(data).sort((a, b) => b.time - a.time);
        setLogs(logsArray);
      } else {
        setLogs([]);
      }
    });
  }, [roomId]);

  return (
    <div className="p-4 pb-24">
      <h2 className="text-[#00b4d8] text-xl font-bold mb-4">Historique de la session</h2>
      <div className="space-y-2">
        {logs.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Aucun historique pour le moment.</p>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="bg-[#1a1a1a] p-3 rounded-lg border border-white/5 flex justify-between items-center">
              <p className="text-white">
                <span className="text-[#2a9d8f] font-bold">{log.user}</span> 
                <span className="text-gray-400 mx-1">{log.action}</span>
              </p>
              <span className="text-gray-600 text-xs">
                {new Date(log.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
