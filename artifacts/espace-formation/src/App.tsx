import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Coins,
  Download,
  Headphones,
  House,
  LockKeyhole,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Play,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react';

type NavItem = 'accueil' | 'formations' | 'recompenses';
type ToastKind = 'success' | 'info' | 'warning';

interface Module {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  lessons: number;
  duration: string;
  progress: number;
  color: 'coral' | 'teal' | 'violet';
  icon: typeof BookOpen;
  completed?: boolean;
}

const modules: Module[] = [
  {
    id: 'communication',
    title: 'Mieux communiquer',
    eyebrow: 'Module 01 · Essentiel',
    description: 'Les clés pour prendre la parole avec assurance, au travail comme au quotidien.',
    lessons: 8,
    duration: '1 h 40',
    progress: 68,
    color: 'coral',
    icon: MessageCircle,
  },
  {
    id: 'budget',
    title: 'Gérer son budget',
    eyebrow: 'Module 02 · Pratique',
    description: 'Des habitudes simples pour mieux organiser ses revenus et ses projets.',
    lessons: 6,
    duration: '1 h 15',
    progress: 24,
    color: 'teal',
    icon: WalletCards,
  },
  {
    id: 'projet',
    title: 'Lancer son projet',
    eyebrow: 'Module 03 · Inspiration',
    description: 'Passer d’une idée à un premier plan d’action concret et réaliste.',
    lessons: 10,
    duration: '2 h 20',
    progress: 0,
    color: 'violet',
    icon: Sparkles,
  },
];

const navItems: Array<{ id: NavItem; label: string; icon: typeof House }> = [
  { id: 'accueil', label: 'Accueil', icon: House },
  { id: 'formations', label: 'Formations', icon: BookOpen },
  { id: 'recompenses', label: 'Récompenses', icon: Trophy },
];

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeNav, setActiveNav] = useState<NavItem>('accueil');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCoinModalOpen, setIsCoinModalOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [name, setName] = useState('');
  const [accessState, setAccessState] = useState<'ready' | 'checking' | 'active'>('ready');
  const [coinBalance, setCoinBalance] = useState(347);
  const [toast, setToast] = useState<{ message: string; kind: ToastKind } | null>(null);
  const [completedModules, setCompletedModules] = useState<string[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 540);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3300);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const firstName = name.trim().split(' ')[0] || 'apprenant·e';
  const currentModules = useMemo(
    () => modules.map((module) => (completedModules.includes(module.id) ? { ...module, progress: 100, completed: true } : module)),
    [completedModules],
  );
  const totalProgress = Math.round(currentModules.reduce((sum, module) => sum + module.progress, 0) / currentModules.length);

  const showToast = (message: string, kind: ToastKind = 'success') => setToast({ message, kind });

  const handleAccess = () => {
    if (name.trim().length < 2) {
      showToast('Écris ton prénom pour continuer.', 'warning');
      return;
    }
    setAccessState('checking');
    window.setTimeout(() => {
      setAccessState('active');
      setCoinBalance((value) => value + 25);
      showToast('Accès validé. Bienvenue dans ton espace.', 'success');
    }, 950);
  };

  const handleComplete = (module: Module) => {
    if (!completedModules.includes(module.id)) {
      setCompletedModules((values) => [...values, module.id]);
      setCoinBalance((value) => value + 40);
      showToast('Module terminé. +40 pièces ajoutées !', 'success');
    } else {
      showToast('Tu peux revoir ce module quand tu veux.', 'info');
    }
    setSelectedModule(null);
  };

  const changeNav = (item: NavItem) => {
    setActiveNav(item);
    setIsDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <main className="app-shell noise min-h-[100dvh] flex justify-center">
        <div className="phone-frame min-h-[100dvh] w-full max-w-[470px] bg-background">
          <div className="space-y-5 p-6 pt-12">
            <div className="flex justify-between"><div className="skeleton h-10 w-10 rounded-2xl" /><div className="skeleton h-10 w-28 rounded-full" /></div>
            <div className="skeleton h-8 w-64 rounded-xl" />
            <div className="skeleton h-36 w-full rounded-[2rem]" />
            <div className="skeleton h-32 w-full rounded-[1.75rem]" />
            <div className="skeleton h-48 w-full rounded-[1.75rem]" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell noise min-h-[100dvh] flex justify-center">
      <div className="phone-frame relative min-h-[100dvh] w-full max-w-[470px] overflow-hidden bg-background">
        <div className="min-h-[100dvh] pb-24">
          <Header
            balance={coinBalance}
            onMenu={() => setIsDrawerOpen(true)}
            onCoins={() => setIsCoinModalOpen(true)}
          />
          {activeNav === 'accueil' && (
            <HomeView
              firstName={firstName}
              name={name}
              accessState={accessState}
              progress={totalProgress}
              modules={currentModules}
              onNameChange={setName}
              onAccess={handleAccess}
              onJoinGroup={() => showToast('Le lien du groupe sera bientôt disponible.', 'info')}
              onModule={(module) => setSelectedModule(module)}
              onAllModules={() => changeNav('formations')}
              onCoins={() => setIsCoinModalOpen(true)}
            />
          )}
          {activeNav === 'formations' && (
            <FormationsView
              modules={currentModules}
              onModule={(module) => setSelectedModule(module)}
              onBack={() => changeNav('accueil')}
              onToast={showToast}
            />
          )}
          {activeNav === 'recompenses' && (
            <RewardsView balance={coinBalance} onWithdraw={() => setIsCoinModalOpen(true)} onToast={showToast} />
          )}
        </div>
        <BottomNav active={activeNav} onChange={changeNav} />
        {isDrawerOpen && <MenuDrawer onClose={() => setIsDrawerOpen(false)} onNavigate={changeNav} onToast={showToast} />}
        {isCoinModalOpen && (
          <CoinModal
            balance={coinBalance}
            onClose={() => setIsCoinModalOpen(false)}
            onWithdraw={() => {
              setIsCoinModalOpen(false);
              showToast('Demande enregistrée. Nous revenons vers toi rapidement.', 'success');
            }}
          />
        )}
        {selectedModule && <ModuleModal module={selectedModule} onClose={() => setSelectedModule(null)} onComplete={handleComplete} />}
        {toast && <Toast message={toast.message} kind={toast.kind} onClose={() => setToast(null)} />}
      </div>
    </main>
  );
}

function Header({ balance, onMenu, onCoins }: { balance: number; onMenu: () => void; onCoins: () => void }) {
  return (
    <header className="flex items-center justify-between px-5 pb-4 pt-6">
      <button type="button" aria-label="Ouvrir le menu" data-testid="button-open-menu" onClick={onMenu} className="icon-button">
        <Menu size={21} strokeWidth={2.2} />
      </button>
      <div className="brand-lockup">
        <span className="brand-mark"><Sparkles size={14} /></span>
        <span>Espace <b>formation</b></span>
      </div>
      <button type="button" data-testid="button-open-coins" onClick={onCoins} className="coin-pill">
        <Coins size={16} />
        <span data-testid="text-coin-balance">{balance}</span>
      </button>
    </header>
  );
}

function HomeView({
  firstName, name, accessState, progress, modules: visibleModules, onNameChange, onAccess, onJoinGroup, onModule, onAllModules, onCoins,
}: {
  firstName: string;
  name: string;
  accessState: 'ready' | 'checking' | 'active';
  progress: number;
  modules: Module[];
  onNameChange: (value: string) => void;
  onAccess: () => void;
  onJoinGroup: () => void;
  onModule: (module: Module) => void;
  onAllModules: () => void;
  onCoins: () => void;
}) {
  return (
    <div className="space-y-7 px-5">
      <section className="animate-rise pt-2">
        <p className="eyebrow">TON ESPACE, TON RYTHME</p>
        <h1 className="hero-title">Bonjour,<br /><em>{firstName}.</em></h1>
        <p className="body-copy mt-3 max-w-[320px]">Un petit pas aujourd’hui, une vraie différence demain.</p>
      </section>

      <AccessCard
        name={name}
        state={accessState}
        onNameChange={onNameChange}
        onSubmit={onAccess}
        onJoinGroup={onJoinGroup}
      />

      <section className="animate-rise delay-200">
        <div className="section-heading">
          <div>
            <p className="eyebrow">TON PARCOURS</p>
            <h2 className="section-title">Tu avances bien.</h2>
          </div>
          <button type="button" data-testid="button-open-rewards" onClick={onCoins} className="progress-orb">
            <span>{progress}%</span><small>progression</small>
          </button>
        </div>
        <div className="progress-track mt-4"><span style={{ width: `${progress}%` }} /></div>
        <p className="micro-copy mt-2">{progress > 0 ? 'Continue comme ça, ta régularité paie.' : 'Ton premier chapitre t’attend.'}</p>
      </section>

      <section className="animate-rise delay-300">
        <div className="section-heading mb-3">
          <div>
            <p className="eyebrow">À DÉCOUVRIR</p>
            <h2 className="section-title">Formations pratiques</h2>
          </div>
          <button type="button" data-testid="button-view-all-formations" onClick={onAllModules} className="text-button">Tout voir <ArrowRight size={14} /></button>
        </div>
        <div className="module-scroller scroll-hide">
          {visibleModules.slice(0, 2).map((module, index) => (
            <ModuleCard key={module.id} module={module} index={index} onClick={() => onModule(module)} compact />
          ))}
        </div>
      </section>

      <section className="community-card animate-rise delay-400">
        <div className="community-icon"><MessageCircle size={22} /></div>
        <div className="min-w-0 flex-1">
          <p className="eyebrow text-[#9be3cc]">ON APPREND MIEUX ENSEMBLE</p>
          <h3>Le groupe WhatsApp</h3>
          <p>Échange, pose tes questions, reste motivé.</p>
        </div>
        <button type="button" data-testid="button-join-whatsapp" onClick={onJoinGroup} className="round-arrow light"><ArrowRight size={17} /></button>
      </section>
    </div>
  );
}

function AccessCard({ name, state, onNameChange, onSubmit, onJoinGroup }: {
  name: string;
  state: 'ready' | 'checking' | 'active';
  onNameChange: (value: string) => void;
  onSubmit: () => void;
  onJoinGroup: () => void;
}) {
  const active = state === 'active';
  return (
    <section className={`access-card animate-rise ${active ? 'access-active' : ''}`}>
      <div className="access-decoration"><ShieldCheck size={88} /></div>
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="status-label"><span className={`status-dot ${active ? 'active' : ''}`} /> {active ? 'Accès confirmé' : 'Accès à valider'}</span>
            <h2 className="access-title">{active ? 'Ton espace est ouvert.' : 'Prêt·e à commencer ?'}</h2>
            <p className="access-copy">{active ? 'Tu peux maintenant suivre tes formations et gagner des pièces.' : 'Valide ton accès pour rejoindre la communauté.'}</p>
          </div>
          <div className="ticket-notch"><span>ESPACE</span><strong>24</strong></div>
        </div>
        {!active ? (
          <div className="mt-5">
            <label htmlFor="learner-name" className="input-label">Comment dois-je t’appeler ?</label>
            <div className="name-row">
              <div className="input-wrap"><UserRound size={16} /><input id="learner-name" data-testid="input-learner-name" value={name} onChange={(event) => onNameChange(event.target.value)} placeholder="Ton prénom et nom" /></div>
              <button type="button" data-testid="button-submit-access" disabled={state === 'checking'} onClick={onSubmit} className="submit-button">
                {state === 'checking' ? <span className="button-loading">Vérification...</span> : <><Send size={16} /> Valider</>}
              </button>
            </div>
            <button type="button" data-testid="button-payment-whatsapp" onClick={onJoinGroup} className="payment-link">Déjà payé ? Rejoins-nous sur WhatsApp <ArrowRight size={13} /></button>
          </div>
        ) : (
          <div className="active-access-row"><div className="check-circle"><Check size={16} /></div><span>Ton accès est valable pendant toute la durée du parcours.</span><button type="button" data-testid="button-access-details" onClick={onJoinGroup}><MoreHorizontal size={18} /></button></div>
        )}
      </div>
    </section>
  );
}

function ModuleCard({ module, index, onClick, compact = false }: { module: Module; index: number; onClick: () => void; compact?: boolean }) {
  const Icon = module.icon;
  return (
    <button type="button" data-testid={`card-module-${module.id}`} onClick={onClick} className={`module-card module-${module.color} ${compact ? 'module-compact' : ''}`} style={{ animationDelay: `${index * 80}ms` }}>
      <div className="module-topline"><span className="module-icon"><Icon size={18} /></span>{module.completed ? <span className="completed-tag"><Check size={11} /> Terminé</span> : <span className="round-arrow"><ArrowUpRightIcon /></span>}</div>
      <div className="module-content"><p>{module.eyebrow}</p><h3>{module.title}</h3><span className="module-meta"><BookOpen size={12} /> {module.lessons} leçons <i /> <Clock3 size={12} /> {module.duration}</span></div>
      <div className="card-progress"><span style={{ width: `${module.progress}%` }} /></div>
      <div className="module-bottom"><span>{module.progress === 0 ? 'À commencer' : `${module.progress}% terminé`}</span><ChevronRight size={16} /></div>
    </button>
  );
}

function ArrowUpRightIcon() {
  return <ArrowRight size={17} className="-rotate-45" />;
}

function FormationsView({ modules: visibleModules, onModule, onBack, onToast }: { modules: Module[]; onModule: (module: Module) => void; onBack: () => void; onToast: (message: string, kind?: ToastKind) => void }) {
  return (
    <div className="space-y-6 px-5 pt-3">
      <div className="page-topline animate-rise"><button type="button" data-testid="button-back-home" onClick={onBack} className="back-button"><ArrowLeft size={17} /></button><div><p className="eyebrow">BIBLIOTHÈQUE</p><h1 className="page-title">Toutes les formations</h1></div><button type="button" data-testid="button-formation-help" onClick={() => onToast('Chaque module est conçu pour avancer à ton rythme.', 'info')} className="icon-button"><CircleHelp size={19} /></button></div>
      <div className="filter-row animate-rise delay-100"><span className="filter-pill active">Tous <b>{visibleModules.length}</b></span><span className="filter-pill">En cours <b>{visibleModules.filter((module) => module.progress > 0 && module.progress < 100).length}</b></span><span className="filter-pill">Terminés <b>{visibleModules.filter((module) => module.completed).length}</b></span></div>
      <div className="formation-list">{visibleModules.map((module, index) => <ModuleCard key={module.id} module={module} index={index} onClick={() => onModule(module)} />)}</div>
      <div className="empty-safe"><Sparkles size={17} /><span>D’autres parcours arrivent bientôt.</span></div>
    </div>
  );
}

function RewardsView({ balance, onWithdraw, onToast }: { balance: number; onWithdraw: () => void; onToast: (message: string, kind?: ToastKind) => void }) {
  return (
    <div className="space-y-6 px-5 pt-3">
      <div className="page-topline animate-rise"><div><p className="eyebrow">TON ÉNERGIE</p><h1 className="page-title">Pièces & récompenses</h1></div><div className="reward-crown"><Trophy size={19} /></div></div>
      <section className="balance-card animate-rise delay-100"><div className="balance-orbit"><Coins size={33} /></div><p>Solde disponible</p><strong data-testid="text-reward-balance">{balance}</strong><span>pièces d’apprentissage</span><button type="button" data-testid="button-withdraw-coins" onClick={onWithdraw} className="withdraw-button"><WalletCards size={16} /> Retirer mes pièces</button></section>
      <section className="reward-section animate-rise delay-200"><div className="section-heading"><div><p className="eyebrow">COMMENT ÇA MARCHE</p><h2 className="section-title">Chaque effort compte.</h2></div></div><div className="reward-steps"><RewardStep number="01" icon={Play} title="Apprends" copy="Suis une leçon jusqu’au bout." /><RewardStep number="02" icon={Check} title="Progresse" copy="Valide tes étapes." /><RewardStep number="03" icon={Coins} title="Récolte" copy="Gagne des pièces." /></div></section>
      <section className="history-card animate-rise delay-300"><div className="flex items-center justify-between"><h3>Activité récente</h3><button type="button" data-testid="button-export-history" onClick={() => onToast('Ton historique est prêt à être partagé.', 'info')}><Download size={16} /></button></div><HistoryRow icon={Check} label="Bienvenue dans Espace formation" detail="Aujourd’hui" amount="+25" /><HistoryRow icon={BookOpen} label="Leçon découverte" detail="Hier" amount="+12" /><HistoryRow icon={Trophy} label="Bonus de régularité" detail="Lundi" amount="+30" /></section>
    </div>
  );
}

function RewardStep({ number, icon: Icon, title, copy }: { number: string; icon: typeof Play; title: string; copy: string }) {
  return <div className="reward-step"><span className="step-number">{number}</span><span className="step-icon"><Icon size={15} /></span><div><strong>{title}</strong><p>{copy}</p></div></div>;
}

function HistoryRow({ icon: Icon, label, detail, amount }: { icon: typeof Check; label: string; detail: string; amount: string }) {
  return <div className="history-row"><span className="history-icon"><Icon size={14} /></span><div><strong>{label}</strong><small>{detail}</small></div><b>{amount}</b></div>;
}

function BottomNav({ active, onChange }: { active: NavItem; onChange: (item: NavItem) => void }) {
  return <nav className="bottom-nav" aria-label="Navigation principale">{navItems.map(({ id, label, icon: Icon }) => <button type="button" key={id} data-testid={`nav-${id}`} onClick={() => onChange(id)} className={active === id ? 'active' : ''}><span><Icon size={19} strokeWidth={active === id ? 2.6 : 2} /></span>{label}</button>)}</nav>;
}

function MenuDrawer({ onClose, onNavigate, onToast }: { onClose: () => void; onNavigate: (item: NavItem) => void; onToast: (message: string, kind?: ToastKind) => void }) {
  return <div className="drawer-layer"><button type="button" aria-label="Fermer le menu" data-testid="button-close-drawer" onClick={onClose} className="drawer-scrim" /><aside className="drawer-panel animate-slide"><div className="drawer-head"><div className="brand-lockup"><span className="brand-mark"><Sparkles size={14} /></span><span>Espace <b>formation</b></span></div><button type="button" data-testid="button-close-drawer-inner" onClick={onClose} className="icon-button"><X size={19} /></button></div><div className="drawer-welcome"><span className="avatar">A</span><div><p>Ton espace privé</p><strong>On avance ensemble.</strong></div></div><div className="drawer-links"><button type="button" data-testid="drawer-link-home" onClick={() => onNavigate('accueil')}><House size={18} /> Accueil <ChevronRight size={15} /></button><button type="button" data-testid="drawer-link-formations" onClick={() => onNavigate('formations')}><BookOpen size={18} /> Mes formations <ChevronRight size={15} /></button><button type="button" data-testid="drawer-link-rewards" onClick={() => onNavigate('recompenses')}><Trophy size={18} /> Mes récompenses <ChevronRight size={15} /></button></div><div className="drawer-bottom"><button type="button" data-testid="button-help-drawer" onClick={() => onToast('Notre équipe est là pour t’aider.', 'info')}><CircleHelp size={18} /> Besoin d’aide</button><button type="button" data-testid="button-settings-drawer" onClick={() => onToast('Les réglages seront bientôt disponibles.', 'info')}><Settings size={18} /> Réglages</button></div></aside></div>;
}

function CoinModal({ balance, onClose, onWithdraw }: { balance: number; onClose: () => void; onWithdraw: () => void }) {
  return <div className="modal-layer"><button type="button" aria-label="Fermer la fenêtre pièces" data-testid="button-close-coins" onClick={onClose} className="modal-scrim" /><section role="dialog" aria-modal="true" aria-labelledby="coin-modal-title" className="modal-card animate-rise"><button type="button" data-testid="button-close-coins-inner" onClick={onClose} className="modal-close"><X size={18} /></button><div className="modal-icon coin-icon"><Coins size={27} /></div><p className="eyebrow">TON PORTEFEUILLE</p><h2 id="coin-modal-title">Tu as <strong>{balance} pièces</strong>.</h2><p className="modal-copy">Les pièces récompensent ta régularité. Dès que tu es prêt·e, transforme-les en un vrai coup de pouce.</p><div className="withdraw-note"><LockKeyhole size={16} /><span>Retrait possible à partir de <b>500 pièces</b>.</span></div><button type="button" data-testid="button-confirm-withdraw" disabled={balance < 500} onClick={onWithdraw} className="primary-full-button">{balance < 500 ? `Encore ${500 - balance} pièces` : 'Demander un retrait'} <ArrowRight size={17} /></button></section></div>;
}

function ModuleModal({ module, onClose, onComplete }: { module: Module; onClose: () => void; onComplete: (module: Module) => void }) {
  const Icon = module.icon;
  return <div className="modal-layer"><button type="button" aria-label="Fermer le module" data-testid="button-close-module" onClick={onClose} className="modal-scrim" /><section role="dialog" aria-modal="true" aria-labelledby="module-modal-title" className={`modal-card module-modal modal-${module.color} animate-rise`}><button type="button" data-testid="button-close-module-inner" onClick={onClose} className="modal-close"><X size={18} /></button><div className="modal-module-icon"><Icon size={25} /></div><p className="eyebrow">{module.eyebrow}</p><h2 id="module-modal-title">{module.title}</h2><p className="modal-copy">{module.description}</p><div className="lesson-summary"><div><strong>{module.lessons}</strong><span>leçons</span></div><div><strong>{module.duration}</strong><span>à ton rythme</span></div><div><strong>{module.progress}%</strong><span>progression</span></div></div><div className="lesson-bar"><span style={{ width: `${module.progress}%` }} /></div><button type="button" data-testid={`button-start-module-${module.id}`} onClick={() => onComplete(module)} className="primary-full-button">{module.completed ? 'Revoir le module' : module.progress === 0 ? 'Commencer le module' : 'Continuer ma leçon'} <ArrowRight size={17} /></button></section></div>;
}

function Toast({ message, kind, onClose }: { message: string; kind: ToastKind; onClose: () => void }) {
  return <div role="status" data-testid="status-toast" className={`toast toast-${kind} animate-toast`}><span className="toast-icon">{kind === 'success' ? <Check size={15} /> : kind === 'warning' ? <CircleHelp size={15} /> : <Sparkles size={15} />}</span><span>{message}</span><button type="button" data-testid="button-close-toast" onClick={onClose} aria-label="Fermer le message"><X size={15} /></button></div>;
}

export default App;