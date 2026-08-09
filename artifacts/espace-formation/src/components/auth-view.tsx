import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, Mail, ShieldCheck, Sparkles } from "lucide-react";

import { supabase } from "@/lib/supabase";

type Step = "signin" | "email" | "code" | "profile";
type Purpose = "signup" | "reset";

const CODE_LENGTH = 6;

function readableError(message: string) {
  const text = message.toLowerCase();
  if (text.includes("invalid login credentials")) return "E-mail ou mot de passe incorrect.";
  if (text.includes("email not confirmed")) return "Adresse non confirmee. Demande un nouveau code.";
  if (text.includes("token has expired") || text.includes("invalid")) return "Code invalide ou expire. Demande un nouveau code.";
  if (text.includes("rate limit") || text.includes("too many")) return "Trop de tentatives. Reessaie dans une minute.";
  if (text.includes("user already registered")) return "Un compte existe deja avec cet e-mail.";
  if (text.includes("should be at least")) return "Le mot de passe doit contenir au moins 6 caracteres.";
  return message;
}

export function AuthView({ onNotify }: { onNotify: (message: string, kind?: "success" | "warning" | "info") => void }) {
  const [step, setStep] = useState<Step>("signin");
  const [purpose, setPurpose] = useState<Purpose>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const codeInputRef = useRef<HTMLInputElement | null>(null);
  const verifiedCodeRef = useRef<string>("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (step === "code") codeInputRef.current?.focus();
  }, [step]);

  // Auto-remplissage natif du code (WebOTP) quand le navigateur le supporte.
  useEffect(() => {
    if (step !== "code") return;
    const otpCredential = (window as unknown as { OTPCredential?: unknown }).OTPCredential;
    if (!otpCredential || !("credentials" in navigator)) return;
    const controller = new AbortController();
    void (navigator.credentials
      .get({ otp: { transport: ["sms"] }, signal: controller.signal } as CredentialRequestOptions)
      .then((credential) => {
        const received = (credential as unknown as { code?: string } | null)?.code;
        if (received) setCode(received.replace(/\D/g, "").slice(0, CODE_LENGTH));
      })
      .catch(() => undefined));
    return () => controller.abort();
  }, [step]);

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (signInError) {
      setError(readableError(signInError.message));
      return;
    }
    onNotify("Content de te revoir !");
  };

  const sendCode = async (nextPurpose: Purpose) => {
    const cleanEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Entre une adresse e-mail valide.");
      return;
    }
    setError(null);
    setBusy(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: { shouldCreateUser: nextPurpose === "signup" },
    });
    setBusy(false);
    if (otpError) {
      setError(readableError(otpError.message));
      return;
    }
    setPurpose(nextPurpose);
    setCode("");
    verifiedCodeRef.current = "";
    setStep("code");
    setCooldown(45);
    onNotify("Code envoye par e-mail.", "info");
  };

  const verifyCode = useCallback(
    async (value: string) => {
      if (value.length !== CODE_LENGTH || verifiedCodeRef.current === value) return;
      verifiedCodeRef.current = value;
      setError(null);
      setBusy(true);
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: value,
        type: "email",
      });
      setBusy(false);
      if (verifyError) {
        verifiedCodeRef.current = "";
        setCode("");
        setError(readableError(verifyError.message));
        return;
      }
      onNotify("Adresse confirmee.", "info");
      setStep("profile");
    },
    [email, onNotify],
  );

  // Validation automatique des que les 6 chiffres sont remplis (autofill inclus).
  useEffect(() => {
    if (step === "code" && code.length === CODE_LENGTH) void verifyCode(code);
  }, [code, step, verifyCode]);

  const finishAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caracteres.");
      return;
    }
    setError(null);
    setBusy(true);
    const attributes =
      purpose === "signup"
        ? {
            password: newPassword,
            data: {
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              display_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
            },
          }
        : { password: newPassword };
    const { error: updateError } = await supabase.auth.updateUser(attributes);
    setBusy(false);
    if (updateError) {
      setError(readableError(updateError.message));
      return;
    }
    onNotify(purpose === "signup" ? "Compte cree. Bienvenue !" : "Mot de passe mis a jour.");
  };

  const backToSignIn = async () => {
    setError(null);
    setCode("");
    setStep("signin");
  };

  return (
    <div className="login-view auth-view">
      <span className="brand-mark login-mark"><Sparkles size={18} /></span>
      <p className="eyebrow">BIENVENUE</p>
      <h1>Espace <em>formation</em></h1>

      {step === "signin" && (
        <form className="auth-form" onSubmit={signIn}>
          <p className="login-lead">Connecte-toi avec ton e-mail et ton mot de passe.</p>
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
              data-testid="input-email"
              required
            />
          </label>
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
            <button type="button" onClick={() => { setError(null); setPurpose("signup"); setStep("email"); }} data-testid="button-goto-signup">
              Creer un compte
            </button>
            <button type="button" onClick={() => { setError(null); setPurpose("reset"); setStep("email"); }} data-testid="button-forgot-password">
              Mot de passe oublie ?
            </button>
          </div>
        </form>
      )}

      {step === "email" && (
        <form
          className="auth-form"
          onSubmit={(event) => { event.preventDefault(); void sendCode(purpose); }}
        >
          <p className="login-lead">
            {purpose === "signup"
              ? "Entre ton e-mail : tu recevras un code de confirmation."
              : "Entre ton e-mail : tu recevras un code pour choisir un nouveau mot de passe."}
          </p>
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
              data-testid="input-email-otp"
              required
              autoFocus
            />
          </label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button type="submit" className="auth-primary" disabled={busy} data-testid="button-send-code">
            {busy ? <Loader2 className="auth-spin" size={16} /> : <Mail size={16} />}
            <span>{busy ? "Envoi..." : "Recevoir le code"}</span>
          </button>
          <div className="auth-links">
            <button type="button" onClick={backToSignIn}><ArrowLeft size={13} /> Retour</button>
          </div>
        </form>
      )}

      {step === "code" && (
        <div className="auth-form">
          <p className="login-lead">Saisis le code a {CODE_LENGTH} chiffres envoye a <b>{email.trim()}</b>.</p>
          <label className="auth-field">
            <span>Code de confirmation</span>
            <input
              ref={codeInputRef}
              className="auth-code-input"
              type="text"
              name="one-time-code"
              autoComplete="one-time-code"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={CODE_LENGTH}
              placeholder="------"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))}
              data-testid="input-otp"
              disabled={busy}
            />
          </label>
          {busy && <p className="auth-hint"><Loader2 className="auth-spin" size={13} /> Verification automatique...</p>}
          {error && <p className="auth-error" role="alert">{error}</p>}
          <div className="auth-links">
            <button type="button" disabled={busy || cooldown > 0} onClick={() => void sendCode(purpose)} data-testid="button-resend-code">
              {cooldown > 0 ? `Renvoyer le code (${cooldown}s)` : "Renvoyer le code"}
            </button>
            <button type="button" onClick={backToSignIn}><ArrowLeft size={13} /> Retour</button>
          </div>
        </div>
      )}

      {step === "profile" && (
        <form className="auth-form" onSubmit={finishAccount}>
          <p className="login-lead">
            {purpose === "signup" ? "Derniere etape : ton identite et ton mot de passe." : "Choisis ton nouveau mot de passe."}
          </p>
          {purpose === "signup" && (
            <>
              <label className="auth-field">
                <span>Nom</span>
                <input type="text" autoComplete="family-name" value={lastName} onChange={(event) => setLastName(event.target.value)} data-testid="input-last-name" required />
              </label>
              <label className="auth-field">
                <span>Prenom</span>
                <input type="text" autoComplete="given-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} data-testid="input-first-name" required />
              </label>
            </>
          )}
          <label className="auth-field">
            <span>Mot de passe</span>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="6 caracteres minimum"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              data-testid="input-new-password"
              required
              minLength={6}
            />
          </label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button type="submit" className="auth-primary" disabled={busy} data-testid="button-create-account">
            {busy ? <Loader2 className="auth-spin" size={16} /> : null}
            <span>{busy ? "Enregistrement..." : purpose === "signup" ? "Creer mon compte" : "Enregistrer"}</span>
          </button>
        </form>
      )}

      <p className="login-note"><ShieldCheck size={13} /> Connexion securisee par e-mail. Aucun code a chaque visite.</p>
    </div>
  );
}
