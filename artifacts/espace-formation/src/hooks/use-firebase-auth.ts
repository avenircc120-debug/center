import { useCallback, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from "firebase/auth";

import { firebaseAuth, googleProvider, initFirebaseAnalytics } from "@/lib/firebase";

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void initFirebaseAnalytics();
    return onAuthStateChanged(firebaseAuth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      await signInWithPopup(firebaseAuth, googleProvider);
    } catch (error) {
      const code = (error as { code?: string } | null)?.code ?? "";
      if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment") {
        await signInWithRedirect(firebaseAuth, googleProvider);
        return;
      }
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return;
      throw error;
    }
  }, []);

  const logout = useCallback(() => signOut(firebaseAuth), []);

  return { user, loading, signInWithGoogle, logout };
}
