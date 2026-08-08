import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD9uOz7cli23FmnPH89gb6KewPcOFrZXMM",
  authDomain: "center-d25a2.firebaseapp.com",
  projectId: "center-d25a2",
  storageBucket: "center-d25a2.firebasestorage.app",
  messagingSenderId: "996031391100",
  appId: "1:996031391100:web:a65f643abc810d1d8770f9",
  measurementId: "G-3QTC91NRGT",
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(firebaseApp);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Analytics is optional and only works in a browser with a measurementId.
export async function initFirebaseAnalytics() {
  if (typeof window === "undefined") return null;
  try {
    const { getAnalytics, isSupported } = await import("firebase/analytics");
    if (!(await isSupported())) return null;
    return getAnalytics(firebaseApp);
  } catch {
    return null;
  }
}
