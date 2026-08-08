import { createHmac, randomUUID } from "node:crypto";

const COOKIE_NAME = "formation_access";
const TTL_SECONDS = 30 * 60;
const usedNonces = new Set<string>();

type ResponseLike = { setHeader(name: string, value: string): void };
type RequestLike = { headers: { cookie?: string } };

function secret() {
  return process.env.SESSION_SECRET ?? process.env.WHATSAPP_GROUP_INVITE_URL ?? "";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function readCookie(req: RequestLike) {
  const raw = req.headers.cookie ?? "";
  const pair = raw.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`));
  return pair ? decodeURIComponent(pair.slice(COOKIE_NAME.length + 1)) : null;
}

function cookie(value: string, maxAge: number) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function setPaidCookie(res: ResponseLike) {
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const nonce = randomUUID();
  const payload = `${exp}.${nonce}`;
  res.setHeader("Set-Cookie", cookie(`${payload}.${sign(payload)}`, TTL_SECONDS));
}

export function clearPaidCookie(res: ResponseLike) {
  res.setHeader("Set-Cookie", cookie("", 0));
}

export function hasValidPayment(req: RequestLike) {
  const value = readCookie(req);
  if (!value || !secret()) return null;
  const [expText, nonce, signature] = value.split(".");
  const exp = Number(expText);
  if (!expText || !nonce || !signature || !Number.isFinite(exp) || exp <= Math.floor(Date.now() / 1000)) return null;
  const payload = `${expText}.${nonce}`;
  if (sign(payload) !== signature || usedNonces.has(nonce)) return null;
  return nonce;
}

export function consumePayment(nonce: string) {
  usedNonces.add(nonce);
}
