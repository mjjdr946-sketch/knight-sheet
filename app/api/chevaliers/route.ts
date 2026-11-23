/**
 * API chevaliers (prompt v12 §2) — CRUD par compte.
 * GET  ?accountId=…  → liste des fiches du compte
 * PUT  { accountId, fiche } → sauvegarde (garde scellement CÔTÉ API, §0.2 :
 *      une fiche scellée ne peut être modifiée que sur les jauges de jeu)
 * DELETE ?accountId=…&id=…
 */
import { NextRequest, NextResponse } from 'next/server';
import { chevaliersDuCompte, sauverChevalier, supprimerChevalier } from '@/lib/db';
import type { Character } from '@/types/character';

export async function GET(req: NextRequest) {
  const accountId = req.nextUrl.searchParams.get('accountId');
  if (!accountId) return NextResponse.json({ ok: false, message: 'accountId requis' }, { status: 400 });
  const fiches = chevaliersDuCompte(accountId).map((r) => JSON.parse(r.fiche) as Character);
  return NextResponse.json({ ok: true, fiches });
}

/** Champs modifiables sur une fiche scellée (jauges de jeu — combat/jets restent actifs).
 * IT. 20 §2 : XP/évolutions INCLUSES — « Ajouter des XP » (+10 PG) est une action
 * de jeu qui doit persister après scellement (avant : rejeté silencieusement
 * côté API → bandeau « non sauvegardé » permanent). */
const CHAMPS_JEU = new Set(['jauges', 'combatSession', 'favoris', 'gloire', 'xpJournal', 'niveau', 'overdrives']);

export async function PUT(req: NextRequest) {
  const { accountId, fiche } = (await req.json()) as { accountId: string; fiche: Character };
  if (!accountId || !fiche?.id) return NextResponse.json({ ok: false, message: 'payload incomplet' }, { status: 400 });

  // garde scellement côté API (§0.2) : comparer à la version serveur
  const existante = chevaliersDuCompte(accountId).find((r) => r.id === fiche.id);
  if (existante) {
    const ancienne = JSON.parse(existante.fiche) as Character;
    if (ancienne.scelle) {
      // ne diff que sur les champs de jeu
      const horsJeu = Object.keys(fiche).filter((k) => !CHAMPS_JEU.has(k) && JSON.stringify((fiche as unknown as Record<string, unknown>)[k]) !== JSON.stringify((ancienne as unknown as Record<string, unknown>)[k]));
      const ignorer = ['mis_a_jour', 'niveau', 'id', 'nom'];
      const reel = horsJeu.filter((k) => !ignorer.includes(k));
      if (reel.length > 0) {
        return NextResponse.json({ ok: false, message: `Fiche scellée — édition bloquée : ${reel.join(', ')}` }, { status: 403 });
      }
    }
  }
  sauverChevalier(accountId, fiche);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const accountId = req.nextUrl.searchParams.get('accountId');
  const id = req.nextUrl.searchParams.get('id');
  if (!accountId || !id) return NextResponse.json({ ok: false, message: 'paramètres manquants' }, { status: 400 });
  supprimerChevalier(accountId, id);
  return NextResponse.json({ ok: true });
}
