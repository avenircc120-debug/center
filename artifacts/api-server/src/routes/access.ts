import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();
const COOKIE_NAME = "formation_access";
const TTL_SECONDS = 30 * 60;
const usedNonces = new Set<string>();

function getSecret() {
  return process.env.SESSION_SECRET ?? "";
}

function sign(payload: string) {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function readCookie(req: Request) {
  const raw = req.headers.cookie ?? "";
  const pair = raw
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`));
  return pair ? decodeURIComponent(pair.slice(COOKIE_NAME.length + 1)) : null;
}

function makeCookie(value: string, maxAge: number) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function setPaidCookie(res: Response) {
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const nonce = randomBytes(18).toString("base64url");
  const payload = `${exp}.${nonce}`;
  res.setHeader("Set-Cookie", makeCookie(`${payload}.${sign(payload)}`, TTL_SECONDS));
}

function clearPaidCookie(res: Response) {
  res.setHeader("Set-Cookie", makeCookie("", 0));
}

function hasValidPayment(req: Request) {
  const value = readCookie(req);
  if (!value || !getSecret()) return null;

  const [expText, nonce, signature] = value.split(".");
  const exp = Number(expText);
  if (
    !expText ||
    !nonce ||
    !signature ||
    !Number.isFinite(exp) ||
    exp <= Math.floor(Date.now() / 1000) ||
    usedNonces.has(nonce)
  ) {
    return null;
  }

  const expected = sign(`${expText}.${nonce}`);
  const expectedBytes = Buffer.from(expected);
  const signatureBytes = Buffer.from(signature);
  if (
    expectedBytes.length !== signatureBytes.length ||
    !timingSafeEqual(expectedBytes, signatureBytes)
  ) {
    return null;
  }

  return nonce;
}

router.get("/access/status", (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json({ paid: Boolean(hasValidPayment(req)), paymentMode: "simulation" });
});

router.post("/access/simulate-payment", (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (name.length < 2) {
    res.status(400).json({ message: "Un nom valide est requis avant la simulation du paiement." });
    return;
  }

  setPaidCookie(res);
  res.status(201).json({
    paid: true,
    paymentMode: "simulation",
    expiresInSeconds: TTL_SECONDS,
  });
});

router.post("/access/whatsapp", (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const nonce = hasValidPayment(req);
  if (!nonce) {
    res.status(403).json({
      message: "Paiement non confirmé. Simulez le paiement avant de rejoindre le groupe.",
    });
    return;
  }

  const inviteUrl = process.env.WHATSAPP_GROUP_INVITE_URL;
  if (!inviteUrl) {
    res.status(503).json({ message: "L’accès WhatsApp n’est pas configuré côté serveur." });
    return;
  }

  usedNonces.add(nonce);
  clearPaidCookie(res);
  res.redirect(303, inviteUrl);
});

export default router;