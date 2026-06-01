import { getAuth, signInWithPopup, GoogleAuthProvider, signInAnonymously as firebaseSignInAnonymously } from 'firebase/auth';
import { auth } from './firebase';

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  return await signInWithPopup(auth, googleProvider);
};

export const signInAnonymously = async () => {
  const userCredential = await firebaseSignInAnonymously(auth);
  localStorage.setItem('localUser', 'Joueur Local');
  return userCredential.user;
};
