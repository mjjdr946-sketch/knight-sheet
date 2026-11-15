/**
 * Middleware d'accès protégé (prompt v6 §5) :
 * mot de passe unique partagé via `SHEET_PASSWORD` (variable d'environnement
 * exigée au build/déploiement). Aucune donnée personnelle côté serveur —
 * tout reste en localStorage client — donc un secret partagé suffit.
 *
 * Si `SHEET_PASSWORD` n'est pas défini (dev local), l'accès est libre.
 * Message d'erreur volontairement générique (aucune fuite d'information).
 */
import { NextRequest, NextResponse } from 'next/server';

const COOKIE = 'sheet-auth';

export function middleware(req: NextRequest) {
  const motDePasse = process.env.SHEET_PASSWORD;

  // Développement / build sans secret : accès libre
  if (!motDePasse) return NextResponse.next();

  const authentifie = req.cookies.get(COOKIE)?.value === motDePasse;
  if (authentifie) return NextResponse.next();

  // Pages autorisées sans session : login + API de login
  const url = req.nextUrl;
  if (url.pathname === '/login' || url.pathname === '/api/login') {
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL('/login', req.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
