'use client';

/**
 * Header sticky — rangée de jauges 1-tap.
 * Se lit depuis le store (jauges + dérivées du moteur) ; zéro calcul local.
 *
 * MICRO-HOTFIX (prod) : sur un compte SANS chevalier, le header n'affichait
 * que des jauges factices (fiche neutre « · PALADIN · ÉCUYER ») — première
 * image du nouveau joueur. Fix : en-tête ALLÉGÉ « Bienvenue, <compte> —
 * crée ton premier chevalier » + lien assistant, SANS jauges ; header
 * complet uniquement si une fiche réelle existe.
 */
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Gauge from './Gauge';
import { useCharacterStore } from '@/store/characterStore';
import { palierPuissance } from '../../src/engine/stats';

export default function GaugeBar() {
  const character = useCharacterStore((s) => s.character);
  const derived = useCharacterStore((s) => s.derived);
  const ajusterJauge = useCharacterStore((s) => s.ajusterJauge);
  const pathname = usePathname();

  // MICRO-HOTFIX : la fiche neutre (id « aucune », invariant it. 7/11) n'est
  // PAS un chevalier — le header la traite comme « aucune fiche ».
  const ficheReelle = character.id !== 'aucune' && character.nom !== '';

  if (!ficheReelle) {
    // En-tête allégé : bienvenue + lien assistant, zéro jauge factice
    const nom = typeof window !== 'undefined' ? localStorage.getItem('knight-compte') : null;
    return (
      <header className="safe-top sticky top-0 z-40 shrink-0 border-b border bg-zinc-950/95 backdrop-blur">
        <p className="text-center text-xs text-zinc-400">
          Bienvenue, <b className="text-white">{nom ?? 'chevalier'}</b> — crée ton premier chevalier
        </p>
        {pathname !== '/personnage/creation' && (
          <a
            href="/personnage/creation"
            className="mx-auto my-1.5 block w-fit rounded-lg border border-neon-cyan/40 bg-neon-cyan/10 px-3 py-1.5 text-xs font-bold text-neon-cyan active:bg-neon-cyan/20"
          >
            + Créer mon premier chevalier
          </a>
        )}
        <CompteMenu />
      </header>
    );
  }

  return (
    <header className="safe-top sticky top-0 z-40 shrink-0 border-b border bg-zinc-950/95 backdrop-blur">
      <p className="text-center text-[11px] uppercase tracking-widest text-zinc-500">
        {character.nom} · {character.metaArmor.modele}
        <span className="ml-1.5 rounded border border-zinc-700 px-1" title="Palier de puissance (PG cumulés)">
          {palierPuissance(character.gloire).rang}
        </span>
        {character.scelle && <span className="ml-1 text-neon-gold" title="Fiche scellée — édition bloquée">🔒</span>}
        {/* ops : CompteMenu était défini mais jamais rendu (menu compte inaccessible) */}
        <CompteMenu />
      </p>
      {/* Desktop (≥1024px) : dérivées affichées en dur dans le header, sans drill-down (prompt v9 §2) */}
      <div className="hidden justify-center gap-4 border-b border/50 py-1 text-xs lg:flex">
        <span className="text-zinc-400">Défense <b className="text-white">{derived.defense}</b></span>
        <span className="text-zinc-400">Réaction <b className="text-white">{derived.reaction}</b></span>
        <span className="text-zinc-400">Initiative <b className="text-white">{derived.initiative}</b></span>
        <span className="text-zinc-400">Contacts <b className="text-white">{derived.contacts}</b></span>
        <span className="text-zinc-400">CdF <b className="text-white">{derived.cdf}</b></span>
      </div>
      {/* Prompt v11 §1 : desktop = 5 jauges côte à côte (max-w-4xl, jamais de scroll) ;
          mobile = compactes avec swipe horizontal toléré UNIQUEMENT ici */}
      <div className="mx-auto flex max-w-md items-stretch gap-1.5 overflow-x-auto px-2 py-2 lg:max-w-4xl lg:overflow-visible [&>*]:lg:flex-1">
        <Gauge
          nom="PS"
          current={character.jauges.ps.current}
          max={derived.ps.max}
          jauge="ps"
          onDelta={(d) => ajusterJauge('ps', d)}
        />
        <Gauge
          nom="PA"
          current={character.jauges.pa.current}
          max={derived.pa.max}
          jauge="pa"
          onDelta={(d) => ajusterJauge('pa', d)}
        />
        <Gauge
          nom="PE"
          current={character.jauges.pe.current}
          max={derived.pe.max}
          jauge="pe"
          onDelta={(d) => ajusterJauge('pe', d)}
        />
        <Gauge
          nom="Espoir"
          current={character.jauges.pes.current}
          max={derived.pes.max}
          jauge="espoir"
          onDelta={(d) => ajusterJauge('pes', d)}
        />
        <Gauge
          nom="Héroïsme"
          current={character.jauges.heroisme.current}
          max={6}
          jauge="heroisme"
          onDelta={(d) => ajusterJauge('heroisme', d)}
        />
      </div>
      {/* Bandeau d'état (agonie / désespoir) — lecture directe du moteur */}
      {derived.etatAgonie && (
        <p className="bg-red-900/60 py-0.5 text-center text-xs font-semibold uppercase tracking-widest text-red-300">
          À l'agonie — règle p.90
        </p>
      )}
      {derived.malusDesespoir > 0 && (
        <p className="bg-amber-900/40 py-0.5 text-center text-xs text-amber-300">
          Désespoir : −{derived.malusDesespoir} dé à tous les jets (règle p.96)
        </p>
      )}
    </header>
  );
}


/** Menu Compte (prompt v14 §2) : changer de compte (sans re-saisir le sas) ou se déconnecter. */
function CompteMenu() {
  const [ouvert, setOuvert] = useState(false);
  const nom = typeof window !== 'undefined' ? localStorage.getItem('knight-compte') : null;
  return (
    <span className="relative ml-2">
      <button type="button" onClick={() => setOuvert((o) => !o)} className="rounded border border-zinc-700 px-1.5 text-[10px] text-zinc-400">
        👤 {nom ?? 'compte'} ▾
      </button>
      {ouvert && (
        <span className="absolute left-1/2 top-full z-50 mt-1 flex w-44 -translate-x-1/2 flex-col rounded-lg border border-zinc-700 bg-zinc-950 shadow-xl">
          <a href="/quijoue" className="border-b border-zinc-800 px-2 py-2 text-[11px] text-zinc-200">👤 Changer de compte</a>
          <button
            type="button"
            onClick={() => {
              // purge du cookie de session (côté serveur via /api/logout) + local
              fetch('/api/logout', { method: 'POST' }).finally(() => {
                localStorage.removeItem('knight-compte');
                window.location.href = '/login';
              });
            }}
            className="px-2 py-2 text-left text-[11px] text-red-400"
          >
            🚪 Se déconnecter
          </button>
        </span>
      )}
    </span>
  );
}
