/**
 * API session de combat (prompt v13 §2) — par compte.
 * PUT  { accountId, session } → sauvegarde de l'état du simulateur
 * GET  ?accountId=… → session du compte (historique revient après reload)
 */
import { NextRequest, NextResponse } from 'next/server';
import { sauverSession, sessionDuCompte } from '@/lib/db';

export async function GET(req: NextRequest) {
  const accountId = req.nextUrl.searchParams.get('accountId');
  if (!accountId) return NextResponse.json({ ok: false, message: 'accountId requis' }, { status: 400 });
  const brut = sessionDuCompte(accountId);
  return NextResponse.json({ ok: true, session: brut ? JSON.parse(brut) : null });
}

export async function PUT(req: NextRequest) {
  const { accountId, session } = (await req.json()) as { accountId: string; session: unknown };
  if (!accountId || !session) return NextResponse.json({ ok: false, message: 'payload incomplet' }, { status: 400 });
  sauverSession(accountId, session);
  return NextResponse.json({ ok: true });
}
