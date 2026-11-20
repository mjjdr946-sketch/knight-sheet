/**
 * API comptes & sessions (prompt v12 §1).
 * - GET  /api/comptes  → liste des 4 comptes (écran « Qui joue ? »)
 * - POST /api/comptes  → choisit un compte (cookie re-signé avec accountId en payload)
 */
import { NextRequest, NextResponse } from 'next/server';
import { compteParNom, tousComptes } from '@/lib/db';
import { creerTokenSession } from '@/lib/session';

const COOKIE = 'sheet-auth';

export async function GET() {
  return NextResponse.json({ comptes: tousComptes() });
}

export async function POST(req: NextRequest) {
  const { nom } = (await req.json()) as { nom?: string };
  const compte = nom ? compteParNom(nom) : null;
  if (!compte) return NextResponse.json({ ok: false, message: 'Compte inconnu' }, { status: 404 });

  // cookie re-signé avec accountId en payload
  const res = NextResponse.json({ ok: true, compte });
  res.cookies.set(COOKIE, await creerTokenSession(compte.id), {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}
