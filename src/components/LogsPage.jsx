import React, { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../services/firebase';

export default function LogsPage({ roomId }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const logsRef = ref(database, `rooms/${roomId}/logs`);
    onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Transforme l'objet en tableau, trié par heure (du plus récent au plus ancien)
        const logsArray = Object.values(data).sort((a, b) => b.time - a.time);
        setLogs(logsArray);
      }
    });
  }, [roomId]);

  return (
    <div className="p-4 pb-20">
      <h2 className="text-xl font-bold text-gold mb-4">Historique des actions</h2>
      <div className="space-y-3">
        {logs.map((log, index) => (
          <div key={index} className="billard-panel text-sm">
            <span className="text-gray-400 font-mono">
              {new Date(log.time).toLocaleTimeString()}
            </span>
            <p className="text-white">
              <strong className="text-gold">{log.user}</strong> {log.action}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
