import { useState } from "react";
import { ArrowLeft, Loader2, Mail, ShieldCheck, Sparkles } from "lucide-react";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

type Step = "signin" | "signup" | "reset";

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
      return "Le mot de passe doit contenir au moins 6 caracteres.";
    case "auth/too-many-requests":
      return "Trop de tentatives. Reessaie dans une minute.";
    case "auth/network-request-failed":
      return "Connexion impossible. Verifie ton reseau.";
    default:
      return fallback;
  }
}

function messageFrom(error: unknown) {
  const err = error as { code?: string; message?: string };
  return readableError(err?.code ?? "", err?.message ?? "Une erreur est survenue.");
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
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caracteres.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
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
          <p className="login-lead">Connecte-toi avec ton e-mail et ton mot de passe.</p>
          {emailField("input-email")}
          <label className="auth-field">
            <span>Mot de passe</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              data-testid="input-password"
              required
            />
          </label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button type="submit" className="auth-primary" disabled={busy} data-testid="button-signin">
            {busy ? <Loader2 className="auth-spin" size={16} /> : null}
            <span>{busy ? "Connexion..." : "Se connecter"}</span>
          </button>
          <div className="auth-links">
            <button type="button" onClick={() => goTo("signup")} data-testid="button-goto-signup">
              Creer un compte
            </button>
            <button type="button" onClick={() => goTo("reset")} data-testid="button-forgot-password">
              Mot de passe oublie ?
            </button>
          </div>
        </form>
      )}

      {step === "signup" && (
        <form className="auth-form" onSubmit={signUp}>
          <p className="login-lead">Cree ton compte avec ton e-mail et un mot de passe.</p>
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
              placeholder="6 caracteres minimum"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              data-testid="input-new-password"
              required
              minLength={6}
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
