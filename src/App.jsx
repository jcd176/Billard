{view === 'create' && (
        <div className="card" style={{ maxWidth: '400px', margin: '0 auto', boxSizing: 'border-box' }}>
          <h2>Nouvelle salle</h2>
          
          <input 
            id="newRoomName" 
            placeholder="Nom de la salle" 
            style={{
              width: '100%', 
              padding: '10px', 
              marginBottom: '10px', 
              boxSizing: 'border-box' // Empêche le débordement
            }} 
          />
          
          <div style={{color: 'white', marginBottom:'10px', textAlign: 'left'}}>
             <input type="checkbox" id="isPrincipal" style={{marginRight: '8px'}} /> 
             Salle Principale 👑
          </div>
          
          <button 
            className="btn-primary" 
            style={{width: '100%', padding: '10px'}}
            onClick={() => createRoom(document.getElementById('newRoomName').value, document.getElementById('isPrincipal').checked)}
          >
            Lancer
          </button>
          
          <button 
            onClick={() => setView('menu')} 
            style={{marginTop:'10px', width:'100%', padding:'10px', cursor:'pointer'}}
          >
            Annuler
          </button>
        </div>
      )}
