import { getAuth, signInWithPopup, GoogleAuthProvider, signInAnonymously as firebaseSignInAnonymously } from 'firebase/auth';
import { auth } from './firebase';

const googleProvider = new GoogleAuthProvider();

// Exportation nommée : signInWithGoogle
export const signInWithGoogle = async () => {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error("Erreur Google:", error);
    throw error;
  }
};

// Exportation nommée : signInAnonymously
export const signInAnonymously = async () => {
  try {
    const userCredential = await firebaseSignInAnonymously(auth);
    // Stockage local pour persister le statut
    localStorage.setItem('localUser', 'Joueur Local');
    return userCredential.user;
  } catch (error) {
    console.error("Erreur anonyme:", error);
    throw error;
  }
};
