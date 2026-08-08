import { getApp, getApps, initializeApp, type FirebaseOptions } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  type Auth,
} from "firebase/auth";
import { getAnalytics, type Analytics } from "firebase/analytics";

const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyAkXSsTCzvY2eWUi0ldsiBg-Q2WK9PIHh8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "center-d0f39.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "center-d0f39",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "center-d0f39.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "873961818551",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:873961818551:web:b63e783ec5506a1ab3c032",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? "G-J692DS4NPP",
};

const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean);

let auth: Auth | null = null;
let analytics: Analytics | null = null;
if (hasFirebaseConfig) {
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  if (typeof window !== "undefined") {
    analytics = getAnalytics(app);
  }
}

export { analytics, auth, hasFirebaseConfig };

export function createGoogleProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}