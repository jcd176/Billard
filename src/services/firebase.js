import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getAnalytics } from 'firebase/analytics';

// Remplacement direct des valeurs pour éliminer les bugs de configuration Vercel
const firebaseConfig = {
  apiKey: "AIzaSyC5I_5lHxPH57-rmN_br2SPcUCbmmSti-U", 
  authDomain: "billard-17260.firebaseapp.com",
  projectId: "billard-17260",
  storageBucket: "billard-17260.appspot.com",
  messagingSenderId: "247215612831",
  appId: "1:247215612831:web:70c5b7b6cd642f09a213aa",
  measurementId: "G-3PPC69JKMM",
  // URL absolue impérative pour cibler la bonne zone géographique (Europe)
  databaseURL: "https://billard-17260-default-rtdb.europe-west1.firebasedatabaseapp.com"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export const analytics = getAnalytics(app);
