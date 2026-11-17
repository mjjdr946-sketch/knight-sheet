import { NextRequest, NextResponse } from 'next/server';
import { creerTokenSession } from '@/lib/session';

/**
 * API de login (prompt v6 §5, correctif it. 7 bug 7 🟠) : compare le mot de
 * passe à SHEET_PASSWORD et pose un cookie de session httpOnly contenant un
 * TOKEN SIGNÉ HMAC — jamais le mot de passe. Le secret de signature est
 * DÉRIVÉ du mot de passe (SHA-256, cf. lib/session) : rotation du mot de
 * passe → toutes les sessions existantes sont invalidées. Réponse
 * volontairement générique en cas d'échec (aucune fuite d'information).
 */
export async function POST(req: NextRequest) {
  const motDePasse = process.env.SHEET_PASSWORD;
  if (!motDePasse) {
    // Pas de secret configuré : accès libre (dev) — session posée quand même
    const res = NextResponse.json({ ok: true });
    res.cookies.set('sheet-auth', 'dev', { httpOnly: true, maxAge: 60 * 60 * 24 * 30, sameSite: 'strict' });
    return res;
  }
  const { password } = (await req.json()) as { password?: string };
  if (password !== motDePasse) {
    return NextResponse.json({ ok: false, message: 'Accès refusé' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set('sheet-auth', await creerTokenSession(), {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30, // 30 jours
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}
