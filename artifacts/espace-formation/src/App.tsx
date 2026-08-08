import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Coins,
  LogOut,
  Menu,
  MessageCircle,
  Play,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserRound,
  X,
} from "lucide-react";
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithRedirect,
  signOut,
  type User,
} from "firebase/auth";
import { auth, createGoogleProvider, hasFirebaseConfig } from "@/lib/firebase";

type ToastKind = "success" | "warning" | "info";
type NavItem = "accueil" | "formations" | "recompenses";

interface Module {
  id: string;
  title: string;
  description: string;
  lessons: number;
  duration: string;
  progress: number;
  tone: "coral" | "teal" | "violet";
}

const modules: Module[] = [
  {
    id: "facebook-scores",
    title: "Booster sa visibilité avec les scores en direct",
    description: "Apprends à capter l’attention, générer des vues et créer une audience fidèle avec des contenus qui vivent en temps réel.",
    lessons: 8,
    duration: "1 h 40",
    progress: 68,
    tone: "coral",
  },
  {
    id: "onewin-promo",
    title: "Gagner de l’argent avec un code promo",
    description: "Une méthode pratique pour créer, configurer et monétiser ton propre code promo.",
    lessons: 6,
    duration: "1 h 15",
    progress: 24,
    tone: "teal",
  },
  {
    id: "payment-groups",
    title: "Relier un paiement à son groupe privé",
    description: "Découvre comment automatiser les paiements et les accès à une communauté WhatsApp ou Telegram.",
    lessons: 10,
    duration: "2 h 20",
    progress: 0,
    tone: "violet",
  },
];

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [activeNav, setActiveNav] = useState<NavItem>("accueil");
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; kind: ToastKind } | null>(null);

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthLoading(false);
    });
    void getRedirectResult(auth).catch((error: unknown) => {
      setAuthLoading(false);
      const code = error instanceof Error && "code" in error ? String(error.code) : "";
      if (code === "auth/unauthorized-domain") {
        setToast({
          message: "Ce domaine doit être ajouté aux domaines autorisés Firebase.",
          kind: "warning",
        });
      } else if (code !== "auth/popup-closed-by-user") {
        setToast({
          message: "Google n’a pas pu terminer la connexion. Vérifie que Google est activé dans Firebase Authentication.",
          kind: "warning",
        });
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const visibleModules = useMemo(
    () => modules.map((module) => completed.includes(module.id) ? { ...module, progress: 100 } : module),
    [completed],
  );
  const progress = Math.round(visibleModules.reduce((total, module) => total + module.progress, 0) / visibleModules.length);
  const firstName = user?.displayName?.split(" ")[0] || "apprenant·e";

  const showToast = (message: string, kind: ToastKind = "success") => setToast({ message, kind });

  const handleGoogleLogin = async () => {
    if (!auth || !hasFirebaseConfig) {
      showToast("La configuration Firebase doit encore être ajoutée à l’application.", "warning");
      return;
    }
    setIsSigningIn(true);
    try {
      await signInWithRedirect(auth, createGoogleProvider());
    } catch (error) {
      const code = error instanceof Error && "code" in error ? String(error.code) : "";
      const message =
        code === "auth/unauthorized-domain"
          ? "Ajoute espace-formation.vercel.app dans les domaines autorisés Firebase."
          : "Impossible d’ouvrir la connexion Google. Vérifie que Google est activé dans Firebase Authentication.";
      showToast(message, "warning");
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    if (auth) await signOut(auth);
    showToast("Tu es déconnecté·e.", "info");
  };

  const completeModule = (module: Module) => {
    if (!completed.includes(module.id)) {
      setCompleted((items) => [...items, module.id]);
      showToast("Module terminé. Bravo pour ta progression !");
    } else {
      showToast("Tu peux revoir ce module quand tu veux.", "info");
    }
    setSelectedModule(null);
  };

  if (authLoading) {
    return <div className="auth-loading"><div className="brand-mark"><Sparkles size={18} /></div><span>Préparation de ton espace...</span></div>;
  }

  if (!user) {
    return <LoginScreen onLogin={handleGoogleLogin} isSigningIn={isSigningIn} hasConfig={hasFirebaseConfig} />;
  }

  return (
    <main className="app-shell">
      <div className="phone-frame">
        <header className="topbar">
          <button type="button" className="icon-button" data-testid="button-open-menu" aria-label="Ouvrir le menu" onClick={() => showToast("Ton espace est déjà prêt.", "info")}><Menu size={20} /></button>
          <div className="brand-lockup"><span className="brand-mark"><Sparkles size={14} /></span><span>Espace <b>formation</b></span></div>
          <div className="user-bubble" title={user.email ?? undefined}>{user.photoURL ? <img src={user.photoURL} alt="" /> : <UserRound size={17} />}</div>
        </header>

        <div className="app-content">
          {activeNav === "accueil" && (
            <HomeView user={user} firstName={firstName} progress={progress} modules={visibleModules} onModule={setSelectedModule} onAllModules={() => setActiveNav("formations")} />
          )}
          {activeNav === "formations" && <FormationsView modules={visibleModules} onModule={setSelectedModule} onBack={() => setActiveNav("accueil")} />}
          {activeNav === "recompenses" && <RewardsView progress={progress} onToast={showToast} />}
        </div>

        <nav className="bottom-nav" aria-label="Navigation principale">
          {([
            ["accueil", "Accueil", Sparkles],
            ["formations", "Formations", BookOpen],
            ["recompenses", "Récompenses", Trophy],
          ] as const).map(([id, label, Icon]) => (
            <button type="button" key={id} data-testid={`nav-${id}`} className={activeNav === id ? "active" : ""} onClick={() => setActiveNav(id)}><Icon size={18} /><span>{label}</span></button>
          ))}
        </nav>

        <button type="button" className="logout-button" data-testid="button-logout" onClick={handleLogout}><LogOut size={14} /> Se déconnecter</button>
        {selectedModule && <ModuleModal module={selectedModule} onClose={() => setSelectedModule(null)} onComplete={completeModule} />}
        {toast && <div className={`toast toast-${toast.kind}`} role="status" data-testid="status-toast"><span>{toast.message}</span><button type="button" aria-label="Fermer le message" data-testid="button-close-toast" onClick={() => setToast(null)}><X size={15} /></button></div>}
      </div>
    </main>
  );
}

function LoginScreen({ onLogin, isSigningIn, hasConfig }: { onLogin: () => void; isSigningIn: boolean; hasConfig: boolean }) {
  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="login-orbit"><span className="brand-mark"><Sparkles size={21} /></span><span className="orbit-dot" /></div>
        <p className="eyebrow">ESPACE FORMATION</p>
        <h1>Apprends. <em>Progresse.</em><br />Construis la suite.</h1>
        <p className="login-copy">Retrouve tes formations, ton parcours et tes récompenses dans un espace pensé pour avancer à ton rythme.</p>
        <button type="button" className="google-button" data-testid="button-login-google" onClick={onLogin} disabled={isSigningIn}>
          <GoogleIcon />
          <span>{isSigningIn ? "Ouverture de Google..." : "Continuer avec Google"}</span>
          {!isSigningIn && <ArrowRight size={17} />}
        </button>
        {!hasConfig && <p className="config-note"><CircleHelp size={14} /> Configuration Firebase requise pour activer la fenêtre Google.</p>}
        <div className="login-trust"><ShieldCheck size={15} /><span>Connexion sécurisée avec ton compte Google. Aucun mot de passe à retenir.</span></div>
      </section>
      <p className="login-footer">Un petit pas aujourd’hui, une vraie différence demain.</p>
    </main>
  );
}

function GoogleIcon() {
  return <svg aria-hidden="true" className="google-icon" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.35 12.27c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.26Z" /><path fill="#34A853" d="M12 21.6c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.6Z" /><path fill="#FBBC05" d="M6.54 13.68a5.86 5.86 0 0 1 0-3.36V7.79H3.3a9.74 9.74 0 0 0 0 8.42l3.24-2.53Z" /><path fill="#EA4335" d="M12 6.29c1.43 0 2.71.49 3.72 1.45l2.79-2.78C16.84 3.32 14.63 2.4 12 2.4a9.74 9.74 0 0 0-8.7 5.39l3.24 2.53C7.31 8.01 9.46 6.29 12 6.29Z" /></svg>;
}

function HomeView({ user, firstName, progress, modules: visibleModules, onModule, onAllModules }: { user: User; firstName: string; progress: number; modules: Module[]; onModule: (module: Module) => void; onAllModules: () => void }) {
  return <div className="view-stack">
    <section className="welcome-block animate-rise"><p className="eyebrow">TON ESPACE, TON RYTHME</p><h1>Bonjour,<br /><em>{firstName}.</em></h1><p>Heureux de te retrouver. Prêt·e à faire avancer ton projet ?</p><span className="email-chip">{user.email}</span></section>
    <section className="progress-card animate-rise"><div><p className="eyebrow">TON PARCOURS</p><h2>Tu avances bien.</h2><p>Chaque leçon te rapproche de ton prochain objectif.</p></div><strong>{progress}%</strong><div className="progress-track"><span style={{ width: `${progress}%` }} /></div></section>
    <section className="section-block animate-rise"><div className="section-heading"><div><p className="eyebrow">À DÉCOUVRIR</p><h2>Formations pratiques</h2></div><button type="button" className="text-button" data-testid="button-view-all-formations" onClick={onAllModules}>Tout voir <ArrowRight size={14} /></button></div><div className="module-scroller">{visibleModules.slice(0, 2).map((module) => <ModuleCard key={module.id} module={module} onClick={() => onModule(module)} />)}</div></section>
    <section className="community-card animate-rise"><span className="community-icon"><MessageCircle size={20} /></span><div><p className="eyebrow">ON APPREND MIEUX ENSEMBLE</p><h3>Le groupe communauté</h3><p>Échange, pose tes questions, reste motivé.</p></div><ArrowRight size={17} /></section>
  </div>;
}

function FormationsView({ modules: visibleModules, onModule, onBack }: { modules: Module[]; onModule: (module: Module) => void; onBack: () => void }) {
  return <div className="view-stack"><div className="page-heading"><button type="button" className="back-button" data-testid="button-back-home" onClick={onBack}><ArrowRight size={17} className="rotate-180" /></button><div><p className="eyebrow">BIBLIOTHÈQUE</p><h1>Toutes les formations</h1></div></div><div className="formation-list">{visibleModules.map((module) => <ModuleCard key={module.id} module={module} onClick={() => onModule(module)} full />)}</div></div>;
}

function RewardsView({ progress, onToast }: { progress: number; onToast: (message: string, kind?: ToastKind) => void }) {
  const steps = [
    { number: "01", Icon: Play, title: "Apprends", copy: "Suis une leçon jusqu’au bout." },
    { number: "02", Icon: Check, title: "Progresse", copy: "Valide tes étapes." },
    { number: "03", Icon: Coins, title: "Récolte", copy: "Gagne des pièces." },
  ];
  return <div className="view-stack"><div className="page-heading"><div><p className="eyebrow">TON ÉNERGIE</p><h1>Pièces & récompenses</h1></div><span className="reward-icon"><Trophy size={18} /></span></div><section className="reward-card"><Coins size={26} /><p>Progression globale</p><strong>{progress}%</strong><span>Chaque effort compte.</span><button type="button" data-testid="button-reward-info" onClick={() => onToast("Les récompenses arrivent avec tes prochaines leçons.", "info")}>Comment ça marche <ArrowRight size={16} /></button></section><section className="steps-card"><p className="eyebrow">TON RITUEL</p><h2>Apprends avec régularité.</h2>{steps.map(({ number, Icon, title, copy }) => <div className="reward-step" key={number}><span>{number}</span><i><Icon size={15} /></i><div><b>{title}</b><small>{copy}</small></div></div>)}</section></div>;
}

function ModuleCard({ module, onClick, full = false }: { module: Module; onClick: () => void; full?: boolean }) {
  return <button type="button" data-testid={`card-module-${module.id}`} className={`module-card module-${module.tone} ${full ? "module-full" : ""}`} onClick={onClick}><div className="module-topline"><span className="module-number">{module.progress === 100 ? <Check size={15} /> : <BookOpen size={15} />}</span><ChevronRight size={17} /></div><div className="module-content"><p>PARCOURS · {module.lessons} LEÇONS</p><h3>{module.title}</h3><span><Clock3 size={12} /> {module.duration}</span></div><div className="card-progress"><span style={{ width: `${module.progress}%` }} /></div><div className="module-bottom"><span>{module.progress === 0 ? "À commencer" : `${module.progress}% terminé`}</span><ArrowRight size={15} /></div></button>;
}

function ModuleModal({ module, onClose, onComplete }: { module: Module; onClose: () => void; onComplete: (module: Module) => void }) {
  return <div className="modal-layer"><button type="button" className="modal-scrim" aria-label="Fermer le module" data-testid="button-close-module" onClick={onClose} /><section className={`module-modal module-${module.tone}`} role="dialog" aria-modal="true"><button type="button" className="modal-close" data-testid="button-close-module-inner" onClick={onClose}><X size={17} /></button><p className="eyebrow">FORMATION PRATIQUE</p><h2>{module.title}</h2><p>{module.description}</p><div className="lesson-summary"><span><b>{module.lessons}</b> leçons</span><span><b>{module.duration}</b> à ton rythme</span></div><button type="button" className="primary-button" data-testid={`button-start-module-${module.id}`} onClick={() => onComplete(module)}>{module.progress === 0 ? "Commencer le module" : "Continuer ma leçon"} <ArrowRight size={16} /></button></section></div>;
}

export default App;