import { getAuth, signInWithPopup, GoogleAuthProvider, signInAnonymously as firebaseSignInAnonymously } from 'firebase/auth';

const auth = getAuth();
const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error("Erreur Google:", error);
  }
};

export const signInAnonymously = async () => {
  try {
    // Utilisation de la fonction renommée pour éviter la confusion
    await firebaseSignInAnonymously(auth);
    // Optionnel : stocker un nom par défaut en local pour la session
    localStorage.setItem('localUser', 'Joueur Local');
  } catch (error) {
    console.error("Erreur anonyme:", error);
  }
};
