import React, { useState } from 'react';
import { auth, database, googleProvider } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile } from 'firebase/auth';
import { ref, get, child, set } from 'firebase/database';

export default function HomePage({ onUserLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pseudo, setPseudo] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        // 1. Vérification si le pseudo est déjà pris dans la BDD
        const snapshot = await get(child(ref(database), 'users'));
        if (snapshot.exists()) {
          const users = Object.values(snapshot.val());
          if (users.some(u => u.pseudo === pseudo)) {
            alert("Ce pseudo est déjà utilisé !");
            return;
          }
        }
        // 2. Création compte Firebase
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(user, { displayName: pseudo });
        // 3. Sauvegarde du pseudo lié à l'UID
        await set(ref(database, `users/${user.uid}`), { pseudo, email });
      } else {
        // Connexion simple
        await signInWithEmailAndPassword(auth, email, password);
      }
      onUserLogin();
    } catch (err) {
      alert("Erreur : " + err.message);
    }
  };

  return (
    <div className="card">
      <h2>{isRegistering ? "Créer un Joueur" : "Connexion"}</h2>
      <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {isRegistering && (
          <input className="join-input" value={pseudo} onChange={(e) => setPseudo(e.target.value)} placeholder="Pseudo" required />
        )}
        <input type="email" className="join-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
        <input type="password" className="join-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" required />
        <button type="submit" className="btn-primary">{isRegistering ? "Créer le compte" : "Se connecter"}</button>
      </form>
      
      <button onClick={() => setIsRegistering(!isRegistering)} style={{ marginTop: '10px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
        {isRegistering ? "Déjà un compte ? Connectez-vous" : "Pas de compte ? Créez-en un"}
      </button>

      <hr style={{ margin: '20px 0' }} />
      
      <button onClick={() => signInWithPopup(auth, googleProvider).then(onUserLogin)} className="btn-primary" style={{ width: '100%' }}>
        Connexion Google
      </button>
    </div>
  );
}
