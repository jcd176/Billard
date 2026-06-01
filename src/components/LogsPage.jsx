export default function LogsPage({ roomId }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    return onValue(ref(database, `rooms/${roomId}/logs`), (s) => {
      const data = s.val();
      if (data) setLogs(Object.values(data).sort((a, b) => b.time - a.time));
    });
  }, [roomId]);

  return (
    <div className="p-4 pb-24">
      <h2 className="text-[#00b4d8] text-xl font-bold mb-4">Historique de la session</h2>
      <div className="space-y-2">
        {logs.map((log, i) => (
          <div key={i} className="bg-[#1a1a1a] p-3 rounded-lg border border-white/5 flex justify-between">
            <p className="text-white">
              <span className="text-[#2a9d8f] font-bold">{log.user}</span> 
              <span className="text-gray-400 mx-1">{log.action}</span>
            </p>
            <span className="text-gray-600 text-xs">{new Date(log.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
        ))}
      </div>
    </div>
  );
}import React, { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../services/firebase';

// Assurez-vous d'avoir "export default" ici :
export default function LogsPage({ roomId }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const logsRef = ref(database, `rooms/${roomId}/logs`);
    onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const logsArray = Object.values(data).sort((a, b) => b.time - a.time);
        setLogs(logsArray);
      }
    });
  }, [roomId]);

  return (
    <div className="p-4 pb-20">
      <h2 className="text-xl font-bold text-[#dfb743] mb-4">Historique des actions</h2>
      <div className="space-y-3">
        {logs.map((log, index) => (
          <div key={index} className="bg-[#1a1a1a] p-4 rounded-xl border border-white/10">
            <p className="text-white">
              <span className="text-[#dfb743] font-bold">{log.user}</span> {log.action}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
