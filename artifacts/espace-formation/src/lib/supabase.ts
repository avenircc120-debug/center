import { createClient } from "@supabase/supabase-js";
import { firebaseAuth } from "./firebase";

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
  "https://iykryokvyrbdznbdxxjo.supabase.co";

const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5a3J5b2t2eXJiZHpuYmR4eGpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMjg2MDUsImV4cCI6MjEwMTcwNDYwNX0.2dlNDYxBcR9HYoBpNGbnnrdXIyd1qkH6ZE1M9S8OUIE";

/**
 * Supabase reste la base de données de l'application.
 * L'authentification est gérée uniquement par Firebase (Google) :
 * le jeton Firebase est transmis à Supabase via `accessToken`,
 * ce qui permet aux politiques RLS d'utiliser `auth.jwt()->>'sub'`.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  accessToken: async () => {
    const user = firebaseAuth.currentUser;
    if (!user) return null;
    return user.getIdToken();
  },
});
