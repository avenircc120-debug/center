import { useState } from "react";
import { ArrowLeft, Loader2, Mail, ShieldCheck, Sparkles } from "lucide-react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

type Step = "signin" | "signup" | "reset";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

function readableError(code: string, fallback: string) {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "E-mail ou mot de passe incorrect.";
    case "auth/invalid-email":
      return "Entre une adresse e-mail valide.";
    case "auth/email-already-in-use":
      return "Un compte existe deja avec cet e-mail.";
    case "auth/weak-password":
      return "Le mot de passe doit contenir au moins 8 caracteres.";
    case "auth/too-many-requests":
      return "Trop de tentatives. Reessaie dans une minute.";
    case "auth/network-request-failed":
      return "Connexion impossible. Verifie ton reseau.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Connexion Google annulee.";
    case "auth/popup-blocked":
      return "La fenetre Google a ete bloquee par le navigateur.";
    case "auth/account-exists-with-different-credential":
      return "Un compte existe deja avec cet e-mail via une autre methode.";
    case "auth/unauthorized-domain":
      return "Ce domaine n'est pas autorise dans la console Firebase.";
    default:
      return fallback;
  }
}

function messageFrom(error: unknown) {
  const err = error as { code?: string; message?: string };
  return readableError(err?.code ?? "", err?.message ?? "Une erreur est survenue.");
}

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2.5 24 .5 14.6.5 6.5 5.9 2.6 13.7l7.8 6.1C12.3 13.6 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.9 7.2l7.6 5.9c4.4-4.1 7.1-10.2 7.1-17.6z" />
      <path fill="#FBBC05" d="M10.4 28.4a14.5 14.5 0 0 1 0-8.6l-7.8-6.1a23.5 23.5 0 0 0 0 20.8l7.8-6.1z" />
      <path fill="#34A853" d="M24 47.5c6.2 0 11.5-2 15.4-5.5l-7.6-5.9c-2.1 1.4-4.8 2.3-7.8 2.3-6.4 0-11.7-4.1-13.6-9.9l-7.8 6.1C6.5 42.1 14.6 47.5 24 47.5z" />
    </svg>
  );
}

export function AuthView({ onNotify }: { onNotify: (message: string, kind?: "success" | "warning" | "info") => void }) {
  const [step, setStep] = useState<Step>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goTo = (next: Step) => {
    setError(null);
    setStep(next);
  };

  // Firebase gere seul la creation du compte, la session et la persistance.
  const signInWithGoogle = async () => {
    setError(null);
    setBusy(true);
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      onNotify(`Bienvenue ${credential.user.displayName ?? ""}`.trim() + " !");
    } catch (err) {
      setError(messageFrom(err));
    } finally {
      setBusy(false);
    }
  };

  const googleButton = (testId: string) => (
    <>
      <button
        type="button"
        className="auth-google"
        onClick={signInWithGoogle}
        disabled={busy}
        data-testid={testId}
      >
        {busy ? <Loader2 className="auth-spin" size={16} /> : <GoogleIcon />}
        <span>Se connecter avec Google</span>
      </button>
      <div className="auth-separator"><span>ou</span></div>
    </>
  );

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      onNotify("Content de te revoir !");
    } catch (err) {
      setError(messageFrom(err));
    } finally {
      setBusy(false);
    }
  };

  const signUp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caracteres.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      const displayName = `${firstName.trim()} ${lastName.trim()}`.trim();
      if (displayName) await updateProfile(credential.user, { displayName });
      onNotify("Compte cree. Bienvenue !");
    } catch (err) {
      setError(messageFrom(err));
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      onNotify("E-mail de reinitialisation envoye.", "info");
      setStep("signin");
    } catch (err) {
      setError(messageFrom(err));
    } finally {
      setBusy(false);
    }
  };

  const emailField = (testId: string, autoFocus = false) => (
    <label className="auth-field">
      <span>E-mail</span>
      <input
        type="email"
        name="email"
        autoComplete="email"
        inputMode="email"
        placeholder="ton@email.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        data-testid={testId}
        required
        autoFocus={autoFocus}
      />
    </label>
  );

  return (
    <div className="login-view auth-view">
      <span className="brand-mark login-mark"><Sparkles size={18} /></span>
      <p className="eyebrow">BIENVENUE</p>
      <h1>Espace <em>formation</em></h1>

      {step === "signin" && (
        <form className="auth-form" onSubmit={signIn}>
          <p className="login-lead">Connecte-toi avec Google ou avec ton e-mail.</p>
          {googleButton("button-google-sign-in")}
          {emailField("input-email")}
          <label className="auth-field">
            <span>Mot de passe</span>
            <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} data-testid="input-password" required />
          </label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button type="submit" className="auth-primary" disabled={busy} data-testid="button-sign-in">
            {busy ? <Loader2 className="auth-spin" size={16} /> : null}
            <span>{busy ? "Connexion..." : "Se connecter"}</span>
          </button>
          <div className="auth-links">
            <button type="button" onClick={() => goTo("signup")}>Creer un compte</button>
            <button type="button" onClick={() => goTo("reset")}>Mot de passe oublie ?</button>
          </div>
        </form>
      )}

      {step === "signup" && (
        <form className="auth-form" onSubmit={signUp}>
          <p className="login-lead">Cree ton compte avec Google ou avec un e-mail.</p>
          {googleButton("button-google-sign-up")}
          <label className="auth-field">
            <span>Nom</span>
            <input type="text" autoComplete="family-name" value={lastName} onChange={(event) => setLastName(event.target.value)} data-testid="input-last-name" required />
          </label>
          <label className="auth-field">
            <span>Prenom</span>
            <input type="text" autoComplete="given-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} data-testid="input-first-name" required />
          </label>
          {emailField("input-email-signup")}
          <label className="auth-field">
            <span>Mot de passe</span>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="8 caracteres minimum"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              data-testid="input-new-password"
              required
              minLength={8}
            />
          </label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button type="submit" className="auth-primary" disabled={busy} data-testid="button-create-account">
            {busy ? <Loader2 className="auth-spin" size={16} /> : null}
            <span>{busy ? "Enregistrement..." : "Creer mon compte"}</span>
          </button>
          <div className="auth-links">
            <button type="button" onClick={() => goTo("signin")}><ArrowLeft size={13} /> Retour</button>
          </div>
        </form>
      )}

      {step === "reset" && (
        <form className="auth-form" onSubmit={resetPassword}>
          <p className="login-lead">Entre ton e-mail : tu recevras un lien pour choisir un nouveau mot de passe.</p>
          {emailField("input-email-reset", true)}
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button type="submit" className="auth-primary" disabled={busy} data-testid="button-send-reset">
            {busy ? <Loader2 className="auth-spin" size={16} /> : <Mail size={16} />}
            <span>{busy ? "Envoi..." : "Recevoir le lien"}</span>
          </button>
          <div className="auth-links">
            <button type="button" onClick={() => goTo("signin")}><ArrowLeft size={13} /> Retour</button>
          </div>
        </form>
      )}

      <p className="login-note"><ShieldCheck size={13} /> Connexion securisee par Firebase.</p>
    </div>
  );
}
