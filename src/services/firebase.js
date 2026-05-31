import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getAnalytics } from 'firebase/analytics';

// Remplacement direct des valeurs pour éliminer les bugs de configuration Vercel
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY_RECUPEREE_SUR_FIREBASE", 
  authDomain: "billard-17260.firebaseapp.com",
  projectId: "billard-17260",
  storageBucket: "billard-17260.appspot.com",
  messagingSenderId: "VOTRE_MESSAGING_SENDER_ID_RECUPERE_SUR_FIREBASE",
  appId: "VOTRE_APP_ID_RECUPERE_SUR_FIREBASE",
  measurementId: "VOTRE_MEASUREMENT_ID_RECUPERE_SUR_FIREBASE",
  // URL absolue impérative pour cibler la bonne zone géographique (Europe)
  databaseURL: "https://billard-17260-default-rtdb.europe-west1.firebasedatabaseapp.com"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export const analytics = getAnalytics(app);
