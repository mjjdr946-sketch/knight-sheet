/**
 * Session HMAC (correctif it. 7, bug 7 🟠 — prompt v9) :
 * le cookie ne contient JAMAIS le mot de passe. Format du token :
 *   `<timestamp en base36>.<HMAC-SHA256(secretDérivé, timestamp)>`
 * Le secret de signature est DÉRIVÉ du mot de passe (SHA-256 de
 * `knight-session-secret:<mot de passe>`) : rotation du mot de passe →
 * tous les tokens précédents deviennent invalides immédiatement.
 * Edge-compatible (middleware) : Web Crypto uniquement.
 */

const DELIVRANCE_MS = 60 * 60 * 24 * 30 * 1000; // 30 jours

/** Secret de signature dérivé du mot de passe — SHA-256 en hexadécimal. */
async function secretDerive(): Promise<string> {
  const data = new TextEncoder().encode(`knight-session-secret:${process.env.SHEET_PASSWORD ?? ''}`);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** HMAC-SHA256(secret, message) en hexadécimal (Web Crypto, edge-safe). */
async function hmac(secret: string, message: string): Promise<string> {
  const cle = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', cle, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Crée un token de session signé (timestamp + accountId + HMAC).
 * Prompt v12 §1 : accountId en payload — le compte actif voyage dans le cookie
 * signé (impossible à falsifier sans le secret dérivé). */
export async function creerTokenSession(accountId?: string): Promise<string> {
  const ts = Date.now().toString(36);
  const payload = accountId ? `${ts}.${accountId}` : ts;
  const sig = await hmac(await secretDerive(), payload);
  return `${payload}.${sig}`;
}

/** Vérifie un token : signature valide ET non expiré. */
export async function verifierTokenSession(token: string): Promise<boolean> {
  if (!token || !token.includes('.')) return false;
  const parties = token.split('.');
  if (parties.length < 2) return false;
  const ts = parties[0]!;
  const sig = parties[parties.length - 1]!;
  const payload = parties.slice(0, -1).join('.'); // ts[.accountId] signé
  if (!ts || !sig) return false;
  const attendue = await hmac(await secretDerive(), payload);
  // comparaison à temps constant basique (longueur + XOR)
  if (sig.length !== attendue.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ attendue.charCodeAt(i);
  if (diff !== 0) return false;
  const age = Date.now() - parseInt(ts, 36);
  return Number.isFinite(age) && age >= 0 && age < DELIVRANCE_MS;
}
