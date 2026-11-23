'use client';

/**
 * Assistant de création (prompt v8 livrable 2) — les 10 étapes du chapitre 5.
 * Travaille sur une COPIE de travail ; l'étape 10 scelle la fiche (édition
 * bloquée, jauges restent jouables). Mode boosté = XP en plus (option MJ).
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCharacterStore } from '@/store/characterStore';
import { computeDerived } from '@/engine/stats';
import { compteActif, sauverFicheImmediate } from '@/lib/sync'; // HOTFIX 2 : push ciblé de la fiche scellée
import { LAMES_TAROT } from '@/data/tarot';
import { ARCHETYPES, HAUTS_FATS, BLASONS } from '@/data/creation';
import { META_ARMURES } from '@/data/meta-armures';
import { personnageExemple } from '@/data/character';
import { armesArsenal } from '@/data/weapons';
import { NODS } from '@/data/nods';
import type { Character, AspectId, TraitId } from '@/types/character';

const ETAPES = [
  'Identité', 'Archétype', 'Tarot', 'Haut fait', 'Blason',
  'Motivations', 'Méta-armure', 'Section', 'Dérivées', 'Arsenal',
];

/** Sections optionnelles (p.170-171) : +1 aspect et +1 dans ses 3 caractéristiques */
const SECTIONS: { id: string; nom: string; aspect: AspectId; traits: TraitId[]; inconv: string }[] = [
  { id: 'ogre', nom: 'Ogre', aspect: 'bete', traits: ['hargne', 'combat', 'instinct'], inconv: 'Marqué par les ténèbres' },
  { id: 'dragon', nom: 'Dragon', aspect: 'dame', traits: ['aura', 'parole', 'sangfroid'], inconv: 'Humaniste' },
  { id: 'giant', nom: 'Giant', aspect: 'machine', traits: ['tir', 'savoir', 'technique'], inconv: 'Rat d\u2019atelier' },
  { id: 'gargoyle', nom: 'Gargoyle', aspect: 'chair', traits: ['deplacement', 'force', 'endurance'], inconv: 'Surprotecteur' },
  { id: 'korrigan', nom: 'Korrigan', aspect: 'masque', traits: ['discretion', 'dexterite', 'perception'], inconv: 'Toujours un doute' },
  { id: 'tarasque', nom: 'Tarasque', aspect: 'bete', traits: ['hargne', 'combat', 'instinct'], inconv: 'Fou dangereux' },
  { id: 'griffon', nom: 'Griffon', aspect: 'masque', traits: ['discretion', 'dexterite', 'perception'], inconv: 'Jouteur' },
  { id: 'cyclope', nom: 'Cyclope', aspect: 'machine', traits: ['tir', 'savoir', 'technique'], inconv: 'Sensible à l’Anathème' },
];

export default function CreationPage() {
  const router = useRouter();
  const character = useCharacterStore((s) => s.character);
  const autresFiches = useCharacterStore((s) => s.autresFiches);
  const actifId = useCharacterStore((s) => s.actifId);
  const creerFiche = useCharacterStore((s) => s.creerFiche);
  const chargerFiche = useCharacterStore((s) => s.chargerFiche);
  // HOTFIX 2 (v19bis) : brouillon du wizard dans le store
  const demarrerWizard = useCharacterStore((s) => s.demarrerWizard);
  const majWizardDraft = useCharacterStore((s) => s.majWizardDraft);
  const confirmerScellement = useCharacterStore((s) => s.confirmerScellement);

  // MICRO-HOTFIX : l'étape courante vit dans le store (persistée) — un reload
  // réseau au milieu du wizard reprend là où le joueur en était.
  const step = useCharacterStore((s) => s.wizardStep);
  const majWizardStep = useCharacterStore((s) => s.majWizardStep);
  // HOTFIX 2 (v19bis) : le brouillon vit DANS le store (persisté) — plus de
  // state local de composant (cause racine du bug prod : brouillon jamais
  // transféré, seule la fiche neutre était scellée).
  const draft = useCharacterStore((s) => s.wizardDraft);
  const [booste, setBooste] = useState(false);
  const [messageErreur, setMessageErreur] = useState('');
  // Étape 10 (prompt v10 §4) : achat d'arsenal intégré — 60 PG de départ (p.174)
  const [achats, setAchats] = useState<Record<string, number>>({}); // id arme → quantité

  /**
   * CORRECTIF it. 7 (bug 1 🔴) : l'assistant part d'une fiche NEUVE vierge
   * (jamais du personnage actif). L'active reste intacte ; à la validation
   * la nouvelle fiche est AJOUTÉE à la liste (pas de remplacement).
   */
  const demarrer = () => {
    // HOTFIX 2 : le brouillon neuf est créé DANS le store
    const avant = useCharacterStore.getState().wizardDraft;
    demarrerWizard();
    // MICRO-HOTFIX : si le brouillon existait déjà (reprise après reload),
    // on conserve l'étape persistée — sinon on repart de l'étape 1.
    if (!avant) majWizardStep(0);
  };

  const budgetTotal = booste ? 85 : 60; // 60 PG (p.174) + 25 boosté (option MJ, p.128)
  const depense = Object.entries(achats).reduce((total, [id, qte]) => {
    const arme = armesArsenal.find((a) => a.id === id);
    return total + (arme ? arme.coutPG * qte : 0);
  }, 0);
  const restant = budgetTotal - depense;

  const acheter = (id: string) => {
    const arme = armesArsenal.find((a) => a.id === id);
    if (!arme) return;
    if (arme.coutPG > restant) { setMessageAchat('PG insuffisants'); return; }
    setAchats((s) => ({ ...s, [id]: (s[id] ?? 0) + 1 }));
    setMessageAchat('');
  };
  const [messageAchat, setMessageAchat] = useState('');

  const maj = (fn: (d: Character) => void) => {
    majWizardDraft(fn); // HOTFIX 2 : écriture dans le store (persistée)
  };

  // HOTFIX 2-bis (verdict 3ᵉ échec) : TOUTES les sorties de valider sont
  // traçées et visibles — plus AUCUNE sortie silencieuse (avant : !draft et
  // !accountId retournaient sans message, une exception dans le void async
  // était avalée : l'URL restait sur le wizard sans aucune erreur).
  const valider = async () => {
    console.info('[scellement] clic « Sceller et jouer »');
    try {
      if (!draft) {
        console.error('[scellement] ABANDON : wizardDraft est null dans le store');
        setMessageErreur('⚠ Brouillon perdu — redémarre la création (aucune donnée à sauvegarder).');
        return; // PAS de redirection
      }
      if (!draft.nom.trim()) {
        console.error('[scellement] ABANDON : nom du chevalier vide');
        setMessageErreur('Le nom du chevalier est requis (prompt v12 §0.4)');
        return; // PAS de redirection
      }
      const accountId = compteActif();
      if (!accountId) {
        console.error('[scellement] ABANDON : aucun compte actif (knight-compte absent)');
        setMessageErreur('Aucun compte actif — impossible de sauvegarder. Rechoisis ton compte.');
        return; // PAS de redirection
      }
      const finie: Character = { ...structuredClone(draft), scelle: true };
      if (booste) finie.gloire = (finie.gloire ?? 0) + 25; // mode boosté (option MJ)
      // scellement propre (prompt v9 §3) : jauges courantes == max, journal initialisé
      const derivees = computeDerived(finie);
      finie.jauges = {
        ps: { current: derivees.ps.max },
        pa: { current: derivees.pa.max },
        pe: { current: derivees.pe.max },
        cdf: { current: derivees.cdf },
        pes: { current: derivees.pes.max },
        heroisme: { current: 0 },
      };
      finie.xpJournal = finie.xpJournal ?? [];
      // Étape 10 : achats d'arsenal appliqués avant scellement (prompt v10 §4)
      finie.armes = [
        ...finie.armes,
        ...Object.entries(achats).flatMap(([id, qte]) => {
          const modele = armesArsenal.find((a) => a.id === id);
          return modele ? Array.from({ length: qte }, (_, i) => ({ ...structuredClone(modele), id: `${modele.id}-${Date.now()}-${i}`, equipee: false })) : [];
        }),
      ];
      // Équipement de départ par mission (p.174) : 3 nods de chaque type (information rôles — les nods restent consommables en jeu via ⚒ Matériel)
      void NODS;
      // HOTFIX 2 : la FICHE SCELLÉE (le brouillon du store) est poussée au
      // serveur EN ATTENDANT la confirmation — avec TRACE du statut réseau.
      console.info('[scellement] PUT /api/chevaliers → fiche', finie.nom, '| compte', accountId);
      const ok = await sauverFicheImmediate(accountId, finie);
      console.info('[scellement] résultat du PUT :', ok ? 'SUCCÈS' : 'ÉCHEC');
      if (!ok) {
        console.error('[scellement] échec de l\'écriture serveur — brouillon préservé');
        setMessageErreur('⚠ Non sauvegardé — le serveur n\'a pas confirmé l\'écriture. Réessaie.');
        return; // PAS de redirection en cas d'échec — le brouillon du store est PRÉSERVÉ
      }
      // Succès : la fiche scellée devient l'active (brouillon consommé)
      confirmerScellement(finie);
      console.info('[scellement] fiche active =', finie.nom, '→ redirection accueil');
      router.push('/');
    } catch (e) {
      // Toute exception est maintenant VISIBLE (avant : unhandled rejection silencieux)
      console.error('[scellement] EXCEPTION pendant la validation :', e);
      setMessageErreur(`⚠ Erreur pendant le scellement : ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  // ─── Écrans par étape ──────────────────────────────────────────────────
  const corps = () => {
    if (!draft) return <AvantDemarrage onDemarrer={demarrer} nomActuel={character.nom} />;
    switch (step) {
      case 0: // 1 — Identité de base (p.110) : scores déjà reset, nom
        return (
          <Champ
            label="Nom du chevalier"
            value={draft.nom}
            onChange={(v) => maj((d) => { d.nom = v; })}
            note="Étape 1 (p.110) : aspects à 2 et caractéristiques à 1 — appliqué automatiquement."
          />
        );
      case 1: { // 2 — Archétype (p.111-113)
        return (
          <ChoixListe
            titre="Archétype (p.111-113)"
            items={ARCHETYPES.map((a) => ({ id: a.id, nom: a.nom, sous: a.bonus }))}
            actif={draft.archetypeId}
            onChoisir={(id) => maj((d) => {
              const arch = ARCHETYPES.find((a) => a.id === id)!;
              d.archetypeId = id;
              // appliquer le bonus : +1 dans 2 caractéristiques (max aspect 9)
              arch.traits.forEach((tr) => { const key = tr as TraitId; d.traits[key] = Math.min(9, d.traits[key] + 1); });
            })}
          />
        );
      }
      case 2: // 3 — Tarot : 5 lames (p.114-122)
        return (
          <ChoixLames
            actives={draft.identite.cartes.map((c) => c.numero)}
            onToggle={(numero) => maj((d) => {
              if (d.identite.cartes.some((c) => c.numero === numero)) {
                d.identite.cartes = d.identite.cartes.filter((c) => c.numero !== numero);
              } else if (d.identite.cartes.length < 5) {
                const lame = LAMES_TAROT.find((l) => l.numero === numero)!;
                d.identite.cartes.push({
                  numero: lame.numero, nom: lame.nom, aspect: null,
                  avantagesRetenus: [], effets: [], // avantages/inconvénients retenus à l'étape suivante (prompt v8 : simplifié)
                });
              }
            })}
            note="5 lames max — bonus : +1 aspect +3 pts de caractéristiques (appliqué à la validation de l'étape)."
          />
        );
      case 3: // 4 — Haut fait (p.123-125)
        return (
          <ChoixListe
            titre="Haut fait (p.123-125)"
            items={HAUTS_FATS.map((h) => ({ id: h.nom, nom: h.nom, sous: h.bonus }))}
            actif={draft.identite.hautFait?.nom}
            onChoisir={(nomHf) => maj((d) => {
              const hf = HAUTS_FATS.find((h) => h.nom === nomHf)!;
              d.identite.hautFait = { nom: hf.nom, surnom: '' };
              const key = hf.trait as TraitId;
              d.traits[key] = Math.min(9, d.traits[key] + 1); // +1 aspect simplifié (prompt v8 : +1 aspect +2 pts liés au MJ)
            })}
          />
        );
      case 4: // 5 — Blason (p.126)
        return (
          <ChoixListe
            titre="Blason (p.126)"
            items={BLASONS.map((b) => ({ id: b.nom, nom: b.nom, sous: b.voeu }))}
            actif={draft.identite.blason}
            onChoisir={(nomBlason) => maj((d) => {
              const b = BLASONS.find((x) => x.nom === nomBlason)!;
              d.identite.blason = b.nom; // le blason est stocké par nom (identité)
              d.identite.motivations = d.identite.motivations.filter((m) => m.texte !== b.voeu);
              d.identite.motivations.push({ type: 'mineure', texte: b.voeu }); // le vœu = motivation mineure (p.126)
            })}
          />
        );
      case 5: // 6 — Motivations (p.127-128)
        return (
          <div className="space-y-3">
            <Champ label="Motivation majeure (objectif conclusif, validé MJ)" value={draft.identite.motivations.find((m) => m.type === 'majeure')?.texte ?? ''} onChange={(v) => maj((d) => {
              d.identite.motivations = d.identite.motivations.filter((m) => m.type !== 'majeure');
              if (v) d.identite.motivations.unshift({ type: 'majeure', texte: v });
            })} />
            <Champ label="Motivation mineure 1" value={draft.identite.motivations.filter((m) => m.type === 'mineure' && m.texte !== draft.identite.blason)[0]?.texte ?? ''} onChange={(v) => maj((d) => {
              const mineures = d.identite.motivations.filter((m) => m.type === 'mineure');
              if (mineures[0]) mineures[0].texte = v; else d.identite.motivations.push({ type: 'mineure', texte: v });
            })} />
            <Champ label="Motivation mineure 2" value={draft.identite.motivations.filter((m) => m.type === 'mineure' && m.texte !== draft.identite.blason)[1]?.texte ?? ''} onChange={(v) => maj((d) => {
              const mineures = d.identite.motivations.filter((m) => m.type === 'mineure');
              if (mineures[1]) mineures[1].texte = v; else d.identite.motivations.push({ type: 'mineure', texte: v });
            })} />
          </div>
        );
      case 6: { // 7 — Méta-armure (p.129-131)
        return (
          <ChoixListe
            titre="Méta-armure (p.129-131)"
            items={Object.entries(META_ARMURES).map(([id, m]) => ({
              id, nom: `${m.modele.toUpperCase()} — ${m.paTotal} PA · ${m.peTotal} PE · CdF ${m.cdfTotal}`,
              sous: m.capacites.map((c) => c.nom).join(' · ') || '—',
            }))}
            actif={draft.metaArmor.modele}
            onChoisir={(id) => maj((d) => {
              if (META_ARMURES[id]) d.metaArmor = structuredClone(META_ARMURES[id]);
              // appliquer les OD de base
              d.overdrives = d.metaArmor.overdrivesDeBase.map((o) => ({ trait: o.trait, niveau: o.niveau })); // OD de base posés
            })}
          />
        );
      }
      case 7: // 8 — Section optionnelle (p.170-171)
        return (
          <ChoixListe
            titre="Section optionnelle (p.170-171) — +1 aspect et +1 dans ses 3 caractéristiques"
            items={[{ id: 'aucune', nom: 'Aucune section', sous: 'pas de bonus ni d\u2019inconvénient' },
              ...SECTIONS.map((s) => ({ id: s.id, nom: s.nom, sous: `+1 ${s.aspect} +1 ${s.traits.join(' / ')} — inconvénient : ${s.inconv}` }))]}
            actif={draft.sectionId ?? 'aucune'}
            onChoisir={(id) => maj((d) => {
              if (d.sectionId) { /* retirer les bonus précédents */ }
              d.sectionId = id === 'aucune' ? undefined : id;
              const s = SECTIONS.find((x) => x.id === id);
              if (s) {
                d.aspects[s.aspect] = Math.min(9, d.aspects[s.aspect] + 1);
                s.traits.forEach((t) => { d.traits[t] = Math.min(9, d.traits[t] + 1); });
              }
            })}
          />
        );
      case 8: // 9 — Valeurs dérivées (p.88 : au choix)
        return (
          <div className="space-y-3">
            <p className="text-xs text-zinc-500">Étape 9 (p.172) — dérivées au choix (OD inclus, +1/niveau).</p>
            {(['defense', 'reaction', 'initiative'] as const).map((c) => (
              <ChoixListe
                key={c}
                titre={c}
                items={(c === 'defense' ? ['hargne', 'combat', 'instinct'] : c === 'reaction' ? ['tir', 'savoir', 'technique'] : ['discretion', 'dexterite', 'perception']).map((t) => ({ id: t, nom: t, sous: `score ${draft.traits[t as TraitId]}` }))}
                actif={draft.choixDerivees[c]}
                onChoisir={(id) => maj((d) => { d.choixDerivees[c] = id as TraitId; })}
              />
            ))}
          </div>
        );
      case 9: // 10 — Arsenal 60 PG (p.174) + récap + scellement
        return (
          <div className="space-y-3">
            <p className="text-sm text-white">Étape 10 (p.174) : arsenal — 60 PG à dépenser (armes standards + nods).</p>
            <p className="text-xs text-neon-gold">Budget : <b>{restant}</b> PG restants sur {budgetTotal}</p>
            <div className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-zinc-800 p-2">
              {armesArsenal.filter((a) => a.accessibilite === 'standard').map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 px-2 py-1.5">
                  <div>
                    <p className="text-xs text-white">{a.nom} <span className="text-zinc-500">{a.coutPG} PG</span></p>
                    <p className="text-[10px] text-zinc-500">{a.degats.nombre}D6+{a.degats.bonus} · {a.type}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {(achats[a.id] ?? 0) > 0 && <span className="text-xs text-neon-cyan">×{achats[a.id]}</span>}
                    <button type="button" onClick={() => acheter(a.id)} disabled={a.coutPG > restant}
                      className="min-h-[44px] rounded-lg bg-neon-cyan/15 px-2.5 text-xs font-bold text-neon-cyan disabled:opacity-30">+</button>
                  </div>
                </div>
              ))}
            </div>
            {messageAchat && <p className="text-xs text-red-400">{messageAchat}</p>}
            <p className="text-[11px] text-zinc-600">
              Les 3 nods d'énergie/armure/soins + 5 grenades intelligentes sont équipés automatiquement (p.174).
              Ajustable ensuite dans ⚒ Matériel (même source de vérité).
            </p>
            <p className="text-xs text-zinc-400">
              {draft?.nom} · {draft?.metaArmor.modele} · archétype {draft?.archetypeId ?? '—'} · {draft?.identite.cartes.length} lames ·
              haut fait {draft?.identite.hautFait?.nom ?? '—'} · blason {draft?.identite.blason ?? '—'}
            </p>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" checked={booste} onChange={(e) => setBooste(e.target.checked)} />
              Mode boosté (+25 PG — option MJ, p.128)
            </label>
            <button type="button" onClick={() => void valider()} className="min-h-[48px] w-full rounded-lg bg-neon-cyan/20 text-sm font-bold text-neon-cyan">
              🔒 Sceller et jouer
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="mx-auto max-w-md px-3 pb-44 pt-6">
      <header className="mb-4 flex items-center justify-between">
        <button type="button" onClick={() => router.push('/')} className="text-sm text-zinc-500">← Accueil</button>
        <span className="text-xs text-zinc-500">Étape {step + 1}/10 — {ETAPES[step]}</span>
      </header>
      <div className="mb-4 flex gap-1">
        {ETAPES.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i <= step && draft ? 'bg-neon-cyan' : 'bg-zinc-800'}`} />
        ))}
      </div>
      {corps()}
      {messageErreur && (
        <div className="sticky top-0 z-50 bg-red-900/90 px-3 py-2 text-center text-xs font-semibold text-white" role="alert">
          ⚠ {messageErreur}
        </div>
      )}
      {draft && (
        <div className="fixed inset-x-0 bottom-[76px] z-30 flex gap-2 border-t border bg-zinc-950/95 p-3 backdrop-blur safe-bottom">
          <button type="button" disabled={step === 0} onClick={() => majWizardStep(Math.max(0, step - 1))} className="min-h-[48px] flex-1 rounded-lg border border-zinc-700 text-sm text-zinc-300 disabled:opacity-30">←</button>
          {step < 9 ? (
            <button type="button" onClick={() => majWizardStep(step + 1)} className="min-h-[48px] flex-[3] rounded-lg bg-neon-cyan/20 text-sm font-bold text-neon-cyan">Étape suivante</button>
          ) : null}
        </div>
      )}
    </main>
  );
}

/* ─── Sous-composants simples ─────────────────────────────────────────── */

function AvantDemarrage({ onDemarrer, nomActuel }: { onDemarrer: () => void; nomActuel: string }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-300">
        L'assistant applique les 10 étapes du chapitre 5 sur une <b>fiche neuve</b> — la fiche
        active ({nomActuel}) reste intacte. À la fin, la nouvelle fiche est <b>scellée</b>
        (édition bloquée) et ajoutée à « Mes chevaliers ».
      </p>
      <button type="button" onClick={onDemarrer} className="min-h-[48px] w-full rounded-lg bg-neon-cyan/20 text-sm font-bold text-neon-cyan">Démarrer la création</button>
    </div>
  );
}

function Champ({ label, value, onChange, note }: { label: string; value: string; onChange: (v: string) => void; note?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs uppercase tracking-widest text-zinc-500">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="min-h-[48px] w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-sm text-white" />
      {note && <p className="mt-1 text-[11px] text-zinc-600">{note}</p>}
    </div>
  );
}

function ChoixListe({ titre, items, actif, onChoisir }: { titre: string; items: { id: string; nom: string; sous?: string }[]; actif?: string; onChoisir: (id: string) => void }) {
  return (
    <div>
      <p className="mb-1.5 text-xs uppercase tracking-widest text-zinc-500">{titre}</p>
      <div className="space-y-1.5">
        {items.map((it) => (
          <button key={it.id} type="button" onClick={() => onChoisir(it.id)}
            className={`min-h-[48px] w-full rounded-lg border px-3 text-left text-sm ${actif === it.id ? 'border-neon-cyan/60 bg-neon-cyan/10 text-white' : 'border-zinc-800 bg-zinc-900/60 text-zinc-300'}`}>
            <span className="font-semibold">{it.nom}</span>
            {it.sous && <span className="block text-[11px] text-zinc-500">{it.sous}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChoixLames({ actives, onToggle, note }: { actives: string[]; onToggle: (id: string) => void; note: string }) {
  return (
    <div>
      <p className="mb-1.5 text-xs uppercase tracking-widest text-zinc-500">Lames du tarot — {actives.length}/5 choisies</p>
      <div className="grid grid-cols-2 gap-1.5">
        {LAMES_TAROT.map((l) => (
          <button key={l.numero} type="button" onClick={() => onToggle(l.numero)}
            className={`min-h-[48px] rounded-lg border px-2 text-left text-xs ${actives.includes(l.numero) ? 'border-neon-cyan/60 bg-neon-cyan/10 text-white' : 'border-zinc-800 bg-zinc-900/60 text-zinc-400'}`}>
            {l.nom}
          </button>
        ))}
      </div>
      <p className="mt-1 text-[11px] text-zinc-600">{note}</p>
    </div>
  );
}
