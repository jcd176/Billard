return (
    <div className="card">
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#333', padding: '20px', borderRadius: '8px', color: '#fff', textAlign: 'center' }}>
            <p>Confirmer la modification ?</p>
            <button onClick={executeAdjustment} className="btn-primary">Valider</button>
            <button onClick={() => setIsModalOpen(false)}>Annuler</button>
          </div>
        </div>
      )}

      <button onClick={onLeave} style={{ marginBottom: '10px' }}>← Retour</button>
      <h2>Salle : {roomId}</h2>
      
      <div style={{ display: 'flex', gap: '5px', marginBottom: '20px' }}>
        <input value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Nom du joueur" />
        <button onClick={addPlayer} className="btn-primary">Ajouter</button>
      </div>

      <div style={{ background: '#333', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
        <select value={winner} onChange={(e) => setWinner(e.target.value)} style={selectStyle}>
          <option value="">👑 Vainqueur</option>
          {players.filter(p => p.id !== loser).map(p => <option key={p.id} value={p.id}>👑 {p.name}</option>)}
        </select>
        <select value={loser} onChange={(e) => setLoser(e.target.value)} style={selectStyle}>
          <option value="">🎱 Perdant</option>
          {players.filter(p => p.id !== winner).map(p => <option key={p.id} value={p.id}>🎱 {p.name}</option>)}
        </select>
        <button onClick={declareMatch} className="btn-primary" style={{ width: '100%', padding: '10px' }}>Déclarer Match</button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Classement :</h3>
        <button onClick={() => resetAction('classement', 'players')} style={btnReset}>↻</button>
      </div>
      <table style={{ width: '100%', color: '#fff', borderCollapse: 'collapse' }}>
        <thead><tr style={{ borderBottom: '1px solid #444' }}><th>Joueur</th><th>Vict</th><th>Déf</th><th>%</th><th></th></tr></thead>
        <tbody>
          {players.map((p, i) => {
            const total = (p.wins || 0) + (p.losses || 0);
            const winRate = total > 0 ? Math.round(((p.wins || 0) / total) * 100) : 0;
            return (
              <tr key={p.id} style={{ borderBottom: '1px solid #222' }}>
                <td>{i === 0 && '👑 '}{p.name}</td>
                <td>{p.wins || 0}
                  <span style={{ display: 'inline-flex', flexDirection: 'column', marginLeft: '8px', verticalAlign: 'middle' }}>
                    <button onClick={() => { setModalAction({player: p, type: 'plus', field: 'wins'}); setIsModalOpen(true); }} style={btnAction}>🟢</button>
                    <button onClick={() => { setModalAction({player: p, type: 'minus', field: 'wins'}); setIsModalOpen(true); }} style={btnAction}>🔴</button>
                  </span>
                </td>
                <td>{p.losses || 0}
                  <span style={{ display: 'inline-flex', flexDirection: 'column', marginLeft: '8px', verticalAlign: 'middle' }}>
                    <button onClick={() => { setModalAction({player: p, type: 'plus', field: 'losses'}); setIsModalOpen(true); }} style={btnAction}>🟢</button>
                    <button onClick={() => { setModalAction({player: p, type: 'minus', field: 'losses'}); setIsModalOpen(true); }} style={btnAction}>🔴</button>
                  </span>
                </td>
                <td>{winRate}%</td>
                <td><button onClick={() => removePlayer(p.id, p.name)} style={{...btnAction, fontSize: '28px'}}>🎱</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
        <h3>Suivi des rencontres :</h3>
        <button onClick={() => resetAction('suivi', 'matches')} style={btnReset}>↻</button>
      </div>
      <div style={{ background: '#222', padding: '10px', borderRadius: '5px' }}>
        {matches && Object.entries(matches).map(([id, m]) => {
          const p1Data = players.find(p => p.name === m.p1) || { wins: 0 };
          const p2Data = players.find(p => p.name === m.p2) || { wins: 0 };
          const p1Wins = p1Data.wins || 0;
          const p2Wins = p2Data.wins || 0;
          const leader = p1Wins >= p2Wins ? { name: m.p1, wins: p1Wins } : { name: m.p2, wins: p2Wins };
          const follower = p1Wins >= p2Wins ? { name: m.p2, wins: p2Wins } : { name: m.p1, wins: p1Wins };
          return (
            <div key={id} style={{ marginBottom: '5px' }}>
              👑 {leader.name} ({leader.wins} victoires) vs 🎱 {follower.name} ({follower.wins} victoires) : {m.count} partie(s)
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
        <h3>Historique :</h3>
        <button onClick={() => resetAction('historique', 'logs')} style={btnReset}>↻</button>
      </div>
      <div style={{ background: '#111', padding: '10px', borderRadius: '5px', fontSize: '14px' }}>
        {logs.map(log => (
          <div key={log.id} style={{ marginBottom: '5px' }}>
            <span style={{ color: '#888' }}>{formatDate(log.timestamp)} </span>
            {log.type === 'match' ? (
              <span>
                <span style={{ color: '#0f0' }}>{log.message.split('|')[0].replace('MATCH:', '')}👑</span> 
                vs 
                <span style={{ color: '#f00' }}>{log.message.split('|')[1]}🎱</span>
              </span>
            ) : (
              <span style={{ color: log.type === 'error' ? '#EE82EE' : log.type === 'add' ? '#0f0' : log.type === 'remove' ? '#f00' : '#FFD700' }}>{log.message}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
