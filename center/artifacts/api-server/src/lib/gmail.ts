import { google } from "googleapis";

function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON n'est pas configure.");
  }

  let parsed: {
    client_email?: string;
    private_key?: string;
  };

  try {
    parsed = JSON.parse(raw) as typeof parsed;
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON contient un JSON invalide.");
  }

  if (!parsed.client_email || !parsed.private_key) {
    throw new Error("Le compte de service Firebase est incomplet.");
  }

  return {
    clientEmail: parsed.client_email,
    privateKey: parsed.private_key.replace(/\\n/g, "\n"),
  };
}

function encodeMime(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

export async function sendConfirmationEmail(to: string, code: string) {
  const sender = process.env.GMAIL_SENDER_EMAIL;
  if (!sender) {
    throw new Error("GMAIL_SENDER_EMAIL n'est pas configure.");
  }

  const account = getServiceAccount();
  const auth = new google.auth.JWT({
    email: account.clientEmail,
    key: account.privateKey,
    scopes: ["https://www.googleapis.com/auth/gmail.send"],
    subject: sender,
  });
  const gmail = google.gmail({ version: "v1", auth });
  const rawMessage = [
    `From: ${sender}`,
    `To: ${to}`,
    "Subject: Votre code de confirmation Center",
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "",
    [
      "Bienvenue sur Center !",
      "",
      `Votre code de confirmation est : ${code}`,
      "",
      "Ce code est valable pendant 10 minutes.",
      "Si vous n'etes pas a l'origine de cette inscription, ignorez cet e-mail.",
    ].join("\n"),
  ].join("\r\n");

  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encodeMime(rawMessage) },
  });
}