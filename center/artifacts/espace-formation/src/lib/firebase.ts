import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD9uOZ7clI23FmnPH89gb6KewPc0FrZXMM",
  authDomain: "center-d25a2.firebaseapp.com",
  projectId: "center-d25a2",
  storageBucket: "center-d25a2.firebasestorage.app",
  messagingSenderId: "996031391100",
  appId: "1:996031391100:web:a65f643abc810d1d8770f9",
  measurementId: "G-3QTC91NR0T",
};

/**
 * Firebase gere UNIQUEMENT l'authentification (e-mail + mot de passe)
 * et les e-mails utilisateurs. Supabase reste la base de donnees.
 */
export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);

void setPersistence(auth, browserLocalPersistence).catch(() => undefined);
