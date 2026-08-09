import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
  "https://iykryokvyrbdznbdxxjo.supabase.co";

const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5a3J5b2t2eXJiZHpuYmR4eGpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMjg2MDUsImV4cCI6MjEwMTcwNDYwNX0.2dlNDYxBcR9HYoBpNGbnnrdXIyd1qkH6ZE1M9S8OUIE";

/**
 * Supabase gere a la fois la base de donnees et l'authentification.
 * Auth par e-mail : code de confirmation (OTP) a l'inscription et pour
 * la reinitialisation du mot de passe, puis e-mail + mot de passe au quotidien.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storageKey: "espace-formation-auth",
  },
});
