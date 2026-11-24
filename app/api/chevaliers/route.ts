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

/** IT. 21 §1 : la garde passe en liste INVERSE — tout champ qui n'est pas
 * STRUCTUREL (identité de création) est modifiable sur fiche scellée : jauges,
 * combat, favoris, XP/évolutions, modules (activer/désactiver), armes
 * (équiper/modes), armure déployée (Shrine/Watchtower/Guardian), déverrouillage
 * (scelle), conditions/styles de jeu, ascribes d'agonie. Une liste POSITIVE
 * oubliait systématiquement le champ suivant (3 rounds de bandeau « non
 * sauvegardé » à tort). */
const CHAMPS_STRUCTURELS = new Set(['id', 'nom', 'classe', 'concept', 'archetypeId', 'sectionId', 'metaArmor']);

export async function PUT(req: NextRequest) {
  const { accountId, fiche } = (await req.json()) as { accountId: string; fiche: Character };
  if (!accountId || !fiche?.id) return NextResponse.json({ ok: false, message: 'payload incomplet' }, { status: 400 });

  // garde scellement côté API (§0.2) : comparer à la version serveur
  const existante = chevaliersDuCompte(accountId).find((r) => r.id === fiche.id);
  if (existante) {
    const ancienne = JSON.parse(existante.fiche) as Character;
    if (ancienne.scelle) {
      // ne diff que sur les champs de jeu
      const horsJeu = Object.keys(fiche).filter((k) => CHAMPS_STRUCTURELS.has(k) && JSON.stringify((fiche as unknown as Record<string, unknown>)[k]) !== JSON.stringify((ancienne as unknown as Record<string, unknown>)[k]));
      if (horsJeu.length > 0) {
        return NextResponse.json({ ok: false, message: `Fiche scellée — identité bloquée : ${horsJeu.join(', ')}` }, { status: 403 });
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
  // La route ne doit pas mentir : 0 ligne supprimée = 404 (un id erroné renvoyait
  // {ok:true} et la fiche revenait au rechargement suivant).
  const n = supprimerChevalier(accountId, id);
  if (n === 0) return NextResponse.json({ ok: false, message: 'fiche introuvable' }, { status: 404 });
  return NextResponse.json({ ok: true, supprimees: n });
}
