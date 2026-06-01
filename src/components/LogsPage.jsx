<div className="card-dark">
  <h3 className="text-[#00b4d8] font-bold mb-4">Historique de la session</h3>
  {logs.map((log) => (
    <div key={log.id} className="flex justify-between border-b border-white/5 py-2">
      <p className="text-white">
        <span className="font-bold text-green-400">{log.winner}</span> bat 
        <span className="font-bold text-red-400 ml-2">{log.loser}</span>
      </p>
      <span className="text-gray-500 text-sm">{new Date(log.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
    </div>
  ))}
</div>
