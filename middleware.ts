import { NextRequest, NextResponse } from 'next/server';
import { verifierTokenSession } from '@/lib/session';

/**
 * Middleware d'accès protégé (prompt v6 §5, correctif it. 7 bug 7 🟠) :
 * le cookie `sheet-auth` contient un TOKEN SIGNÉ HMAC (payload+signature) —
 * plus jamais le mot de passe en clair. La signature est vérifiée côté
 * serveur avec un secret DÉRIVÉ de SHEET_PASSWORD : rotation du mot de
 * passe → toutes les sessions existantes deviennent invalides.
 *
 * Si `SHEET_PASSWORD` n'est pas défini (dev local), l'accès est libre.
 * Message d'erreur volontairement générique (aucune fuite d'information).
 */
const COOKIE = 'sheet-auth';

export async function middleware(req: NextRequest) {
  const motDePasse = process.env.SHEET_PASSWORD;

  // Développement / build sans secret : accès libre
  if (!motDePasse) return NextResponse.next();

  const token = req.cookies.get(COOKIE)?.value ?? '';
  const authentifie = token !== 'dev' && (await verifierTokenSession(token));
  if (!authentifie) {
    // Sas obligatoire (prompt v6 §5)
    const url = req.nextUrl;
    if (url.pathname === '/login' || url.pathname === '/api/login') return NextResponse.next();
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Prompt v14 §1 / v19 §3 : AUTH STRICTE — un compte doit être choisi
  // (payload accountId dans le cookie : ts.accountId.signature)
  const compteChoisi = token.split('.').length >= 3;
  const url = req.nextUrl;
  const exemptees = ['/quijoue', '/api/comptes', '/api/login', '/api/logout'];
  if (!compteChoisi && !exemptees.some((e) => url.pathname.startsWith(e))) {
    return NextResponse.redirect(new URL('/quijoue', req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
