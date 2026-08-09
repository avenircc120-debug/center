import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { Router, type IRouter } from "express";

const router: IRouter = Router();
const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

type PendingConfirmation = {
  codeHash: Buffer;
  expiresAt: number;
  attempts: number;
};

const pendingConfirmations = new Map<string, PendingConfirmation>();
const confirmedEmails = new Set<string>();

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function hashCode(code: string) {
  return createHash("sha256").update(code).digest();
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

router.post("/auth/confirmation/start", (req, res) => {
  const email = normalizeEmail(req.body?.email);
  if (!isEmail(email)) {
    res.status(400).json({ message: "Une adresse e-mail valide est requise." });
    return;
  }

  const code = randomInt(100000, 1000000).toString();
  pendingConfirmations.set(email, {
    codeHash: hashCode(code),
    expiresAt: Date.now() + CODE_TTL_MS,
    attempts: 0,
  });

  // Sans service e-mail externe, le code est renvoyé à l'application
  // pour être présenté dans l'interface de confirmation.
  res.setHeader("Cache-Control", "no-store");
  res.json({
    ok: true,
    email,
    code,
    delivery: "in-app",
    expiresInSeconds: CODE_TTL_MS / 1000,
  });
});

router.post("/auth/confirmation/verify", (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const code = typeof req.body?.code === "string" ? req.body.code.trim() : "";
  const pending = pendingConfirmations.get(email);

  if (!pending) {
    res.status(400).json({ message: "Aucun code actif pour cette adresse e-mail." });
    return;
  }

  if (Date.now() > pending.expiresAt) {
    pendingConfirmations.delete(email);
    res.status(410).json({ message: "Ce code a expire. Demande un nouveau code." });
    return;
  }

  if (!/^\d{6}$/.test(code)) {
    res.status(400).json({ message: "Le code doit contenir 6 chiffres." });
    return;
  }

  pending.attempts += 1;
  const providedHash = hashCode(code);
  const matches = timingSafeEqual(pending.codeHash, providedHash);

  if (!matches) {
    if (pending.attempts >= MAX_ATTEMPTS) {
      pendingConfirmations.delete(email);
      res.status(429).json({ message: "Trop de tentatives. Demande un nouveau code." });
      return;
    }

    res.status(400).json({
      message: `Code incorrect. Il te reste ${MAX_ATTEMPTS - pending.attempts} tentative(s).`,
    });
    return;
  }

  pendingConfirmations.delete(email);
  confirmedEmails.add(email);
  res.setHeader("Cache-Control", "no-store");
  res.json({ confirmed: true });
});

router.get("/auth/confirmation/status", (req, res) => {
  const email = normalizeEmail(req.query.email);
  res.setHeader("Cache-Control", "no-store");
  res.json({ confirmed: confirmedEmails.has(email) });
});

export default router;
