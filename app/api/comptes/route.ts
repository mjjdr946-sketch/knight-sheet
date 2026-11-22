/**
 * API comptes & sessions (prompt v12 §1, HOTFIX it. 17-bis prod).
 * - GET  /api/comptes  → liste des comptes (écran « Qui joue ? »)
 * - POST /api/comptes  → connexion OU création :
 *      • compte existant (casse-insensible) → connexion (cookie HMAC accountId)
 *      • compte inconnu  → CRÉATION automatique en libre-service (HOTFIX :
 *        la prod renvoyait 404 « Compte inconnu » et bloquait tout le monde)
 *      • `creer: true` explicite sur un nom DÉJÀ pris → 409 casse-insensible
 *      • nom vide/trop court → 400
 */
import { NextRequest, NextResponse } from 'next/server';
import { compteParNom, tousComptes, creerCompte } from '@/lib/db';
import { creerTokenSession } from '@/lib/session';

const COOKIE = 'sheet-auth';

/** Pose le cookie de session signé (accountId en payload) + le cookie
 * de préférence `knight-compte` (lisible côté client, prompt hotfix §1). */
function reponseCompte(compte: { id: string; nom: string; role: string }, token: string): NextResponse {
  const rep = NextResponse.json({ ok: true, compte });
  rep.cookies.set(COOKIE, token, {
    httpOnly: true, maxAge: 60 * 60 * 24 * 30, sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  });
  rep.cookies.set('knight-compte', compte.nom, {
    maxAge: 60 * 60 * 24 * 30, sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  });
  return rep;
}

export async function GET() {
  return NextResponse.json({ comptes: tousComptes() });
}

export async function POST(req: NextRequest) {
  const { nom, creer } = (await req.json()) as { nom?: string; creer?: boolean };

  // Validation du nom (HOTFIX : refus propre, jamais de silence)
  const nomPropre = nom?.trim() ?? '';
  if (nomPropre.length < 2) {
    return NextResponse.json({ ok: false, message: 'Nom de compte requis (2 caractères minimum)' }, { status: 400 });
  }

  // Connexion si le compte existe déjà (casse-insensible : brute / lower / capitalisée)
  const existant = compteParNom(nomPropre)
    ?? compteParNom(nomPropre.toLowerCase())
    ?? compteParNom(nomPropre.charAt(0).toUpperCase() + nomPropre.slice(1));
  if (existant) {
    if (creer === true) {
      // création explicite sur un nom déjà pris → 409 casse-insensible
      return NextResponse.json({ ok: false, message: `Ce nom est déjà pris (${existant.nom})` }, { status: 409 });
    }
    return reponseCompte(existant, await creerTokenSession(existant.id));
  }

  // HOTFIX : compte inconnu → CRÉATION en libre-service (role joueur)
  const res = creerCompte(nomPropre);
  if (!res.ok || !res.compte) {
    return NextResponse.json({ ok: false, message: res.message ?? 'Création refusée' }, { status: 409 });
  }
  return reponseCompte(res.compte, await creerTokenSession(res.compte.id));
}
