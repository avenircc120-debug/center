import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { Router, type IRouter, type Request } from "express";
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "../lib/firebase-admin";
import { sendConfirmationEmail } from "../lib/gmail";

const router: IRouter = Router();
const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const COLLECTION = "email_confirmations";

type ConfirmationRecord = {
  email: string;
  codeHash: string;
  resendTokenHash: string;
  expiresAt: number;
  lastSentAt: number;
  attempts: number;
};

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function hash(value: string) {
  return createHash("sha256").update(value).digest("base64");
}

function sameHash(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "base64");
  const rightBuffer = Buffer.from(right, "base64");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function getBearerToken(req: Request) {
  const header = req.headers.authorization;
  return header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
}

async function getAuthenticatedUser(req: Request) {
  const token = getBearerToken(req);
  if (!token) return null;
  try {
    return await getFirebaseAdminAuth().verifyIdToken(token);
  } catch {
    return null;
  }
}

function readRecord(snapshot: FirebaseFirestore.DocumentSnapshot): ConfirmationRecord | null {
  if (!snapshot.exists) return null;
  return snapshot.data() as ConfirmationRecord;
}

async function sendCodeForUser(uid: string, email: string, existingToken?: string) {
  const db = getFirebaseAdminDb();
  const ref = db.collection(COLLECTION).doc(uid);
  const snapshot = await ref.get();
  const previous = readRecord(snapshot);
  const now = Date.now();

  if (previous && now - previous.lastSentAt < RESEND_COOLDOWN_MS) {
    throw Object.assign(new Error("Attends une minute avant de demander un nouveau code."), { status: 429 });
  }

  const resendToken = existingToken ?? randomBytes(24).toString("base64url");
  const code = randomInt(100000, 1000000).toString();
  const record: ConfirmationRecord = {
    email,
    codeHash: hash(code),
    resendTokenHash: previous?.resendTokenHash ?? hash(resendToken),
    expiresAt: now + CODE_TTL_MS,
    lastSentAt: now,
    attempts: 0,
  };

  await ref.set(record);
  try {
    await sendConfirmationEmail(email, code);
  } catch (error) {
    await ref.delete();
    throw error;
  }

  return {
    expiresInSeconds: CODE_TTL_MS / 1000,
    resendToken: previous ? undefined : resendToken,
  };
}

router.post("/auth/confirmation/start", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const resendToken = typeof req.body?.resendToken === "string" ? req.body.resendToken : undefined;
  if (!isEmail(email)) {
    res.status(400).json({ message: "Une adresse e-mail valide est requise." });
    return;
  }

  try {
    const user = await getAuthenticatedUser(req);
    const auth = getFirebaseAdminAuth();
    let uid = user?.uid;

    if (user) {
      if (normalizeEmail(user.email) !== email) {
        res.status(403).json({ message: "L'adresse e-mail ne correspond pas au compte." });
        return;
      }
      await auth.updateUser(user.uid, { disabled: true });
    } else if (resendToken) {
      const matched = await auth.getUserByEmail(email);
      const record = readRecord(await getFirebaseAdminDb().collection(COLLECTION).doc(matched.uid).get());
      if (!record || record.email !== email || !sameHash(record.resendTokenHash, hash(resendToken))) {
        res.status(403).json({ message: "Session de confirmation invalide." });
        return;
      }
      uid = matched.uid;
    } else {
      res.status(401).json({ message: "Authentification requise pour démarrer la confirmation." });
      return;
    }

    if (!uid) {
      res.status(401).json({ message: "Impossible d'identifier le compte à confirmer." });
      return;
    }

    const result = await sendCodeForUser(uid, email, resendToken);
    res.setHeader("Cache-Control", "no-store");
    res.json({ started: true, expiresInSeconds: result.expiresInSeconds, resendToken: result.resendToken });
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error ? Number(error.status) : 503;
    req.log?.error({ err: error }, "Unable to send confirmation email");
    const message =
      status === 429
        ? (error as Error).message
        : "Le code n'a pas pu être envoyé. Vérifie la configuration Gmail du compte de service.";
    res.status(status).json({ message });
  }
});

router.post("/auth/confirmation/verify", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const code = typeof req.body?.code === "string" ? req.body.code.trim() : "";
  if (!isEmail(email) || !/^\d{6}$/.test(code)) {
    res.status(400).json({ message: "Le code doit contenir 6 chiffres." });
    return;
  }

  try {
    const auth = getFirebaseAdminAuth();
    const user = await auth.getUserByEmail(email);
    const ref = getFirebaseAdminDb().collection(COLLECTION).doc(user.uid);
    const snapshot = await ref.get();
    const pending = readRecord(snapshot);

    if (!pending || pending.email !== email) {
      res.status(400).json({ message: "Aucun code actif pour cette adresse e-mail." });
      return;
    }
    if (Date.now() > pending.expiresAt) {
      await ref.delete();
      res.status(410).json({ message: "Ce code a expire. Demande un nouveau code." });
      return;
    }

    const nextAttempts = pending.attempts + 1;
    if (!sameHash(pending.codeHash, hash(code))) {
      if (nextAttempts >= MAX_ATTEMPTS) await ref.delete();
      else await ref.update({ attempts: nextAttempts });
      res.status(nextAttempts >= MAX_ATTEMPTS ? 429 : 400).json({
        message:
          nextAttempts >= MAX_ATTEMPTS
            ? "Trop de tentatives. Demande un nouveau code."
            : `Code incorrect. Il te reste ${MAX_ATTEMPTS - nextAttempts} tentative(s).`,
      });
      return;
    }

    await auth.updateUser(user.uid, { disabled: false, emailVerified: true });
    await ref.delete();
    res.setHeader("Cache-Control", "no-store");
    res.json({ confirmed: true });
  } catch (error) {
    req.log?.error({ err: error }, "Unable to verify confirmation code");
    res.status(503).json({ message: "La validation est temporairement indisponible." });
  }
});

router.get("/auth/confirmation/status", async (req, res) => {
  const email = normalizeEmail(req.query.email);
  res.setHeader("Cache-Control", "no-store");
  try {
    const user = await getFirebaseAdminAuth().getUserByEmail(email);
    res.json({ confirmed: user.emailVerified === true && user.disabled !== true });
  } catch {
    res.json({ confirmed: false });
  }
});

export default router;