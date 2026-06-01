import { getAuth, signInWithPopup, GoogleAuthProvider, signInAnonymously as firebaseSignInAnonymously } from 'firebase/auth';

const auth = getAuth();
const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  return await signInWithPopup(auth, googleProvider);
};

export const signInAnonymously = async () => {
  return await firebaseSignInAnonymously(auth);
};
