import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { app } from './firebase'; 

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Erreur de connexion Google :", error);
    throw error;
  }
};
