<div className="card">
  <h2>Historique de la session</h2>
  {logs.slice().reverse().map((l, i) => {
    const date = new Date(l.time);
    const dateFormatted = date.toLocaleDateString([], {day:'2-digit', month:'2-digit', year:'numeric'});
    const timeFormatted = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

    // Logique de couleur et texte
    let style = { color: 'white' };
    let displayAction = l.action;

    if (l.action.includes("a rejoint")) {
      style = { color: 'blue' };
    } else if (l.action.includes("a quitté")) {
      style = { color: 'maroon' };
    } else if (l.action.includes("bat")) {
      // Remplacement de "bat" par "a gagné contre"
      displayAction = l.action.replace("bat ", "a gagné contre ");
    }

    return (
      <div key={i} style={{fontSize:'12px', borderBottom:'1px solid #333', padding:'8px 0', display:'flex', justifyContent:'space-between'}}>
        <span style={style}>
          <strong>{l.user}</strong> {displayAction}
        </span>
        <span style={{color: '#555'}}>
          {dateFormatted} {timeFormatted}
        </span>
      </div>
    );
  })}
</div>
