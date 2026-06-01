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
        setLogs(Object.values(data).sort((a, b) => b.time - a.time));
      }
    });
  }, [roomId]);

  return (
    <div className="p-4 pb-24 text-white">
      <h2 className="text-[#00b4d8] text-xl font-bold mb-4 font-serif">Historique de la session</h2>
      <div className="space-y-2">
        {logs.map((log, index) => (
          <div key={index} className="bg-[#1a1a1a] p-4 rounded-xl border border-white/10 flex justify-between items-center shadow-md">
            <p>
              <span className="text-[#2a9d8f] font-bold">{log.user}</span> 
              <span className="text-gray-300 ml-2">{log.action}</span>
            </p>
            <span className="text-gray-600 text-xs">
              {new Date(log.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
