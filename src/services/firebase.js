import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth'; // AJOUTÉ
import { getDatabase } from 'firebase/database';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyC5I_5lHxPH57-rmN_br2SPcUCbmmSti-U", 
  authDomain: "billard-17260.firebaseapp.com",
  projectId: "billard-17260",
  storageBucket: "billard-17260.appspot.com",
  messagingSenderId: "247215612831",
  appId: "1:247215612831:web:70c5b7b6cd642f09a213aa",
  measurementId: "G-3PPC69JKMM",
  databaseURL: "https://billard-17260-default-rtdb.europe-west1.firebasedatabase.app"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export const analytics = getAnalytics(app);
// Export des providers
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
