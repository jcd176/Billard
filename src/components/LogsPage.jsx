import React, { useEffect, useState } from 'react';
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
