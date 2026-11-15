'use client';

/**
 * WeaponCard — carte générique d'arme (ergonomie Demiplane : tap = RuleDrawer).
 * Aucun calcul : tout vient du modèle de données.
 */
import { useState } from 'react';
import RuleDrawer from '../drawers/RuleDrawer';
import { formaterProfil } from '@/utils/format';
import type { Weapon } from '@/types/character';

export interface WeaponCardProps {
  arme: Weapon;
  /** Sélecteur de mode (munitions alternatives) — index du mode actif */
  modeActif: number;
  onModeChange: (index: number) => void;
  onEquiper: (equiper: boolean) => void;
  onDesequiper: () => void;
}

export default function WeaponCard({ arme, modeActif, onModeChange, onEquiper, onDesequiper }: WeaponCardProps) {
  const [drawer, setDrawer] = useState(false);
  const profils = [{ nom: 'Prof principal', degats: arme.degats, violence: arme.violence, portee: arme.portee, effets: arme.effets }, ...(arme.modes ?? []).map((m) => ({ ...m }))];
  const profil = profils[modeActif] ?? profils[0];
  if (!profil) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setDrawer(true)}
        className={`w-full rounded-xl border p-3 text-left active:bg-zinc-900 ${
          arme.equipee ? 'border-neon-cyan/40 shadow-glow-cyan' : 'border-zinc-800'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="font-medium text-white">{arme.nom}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs uppercase ${arme.equipee ? 'bg-neon-cyan/15 text-neon-cyan' : 'bg-zinc-800 text-zinc-500'}`}>
            {arme.equipee ? 'Équipée' : 'Rangée'}
          </span>
        </div>
        <div className="mt-1 flex gap-3 text-xs text-zinc-400">
          <span>🗡 {formaterProfil(profil.degats)}</span>
          <span>💥 {formaterProfil(profil.violence)}</span>
        </div>
        <div className="mt-1 flex flex-wrap gap-1">
          {profil.effets.slice(0, 3).map((e) => (
            <span key={e} className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-300">{e}</span>
          ))}
          {profil.effets.length > 3 && (
            <span className="text-xs text-zinc-500">+{profil.effets.length - 3}</span>
          )}
        </div>
      </button>

      <RuleDrawer open={drawer} onClose={() => setDrawer(false)} titre={arme.nom} sousTitre={`${arme.accessibilite} — ${arme.coutPG} PG`} pageRef="Annexe 2, arsenal">
        <div className="space-y-3">
          {/* Sélecteur de mode */}
          {arme.modes && arme.modes.length > 0 && (
            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">Mode</p>
              <div className="flex flex-wrap gap-1.5">
                {profils.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onModeChange(i)}
                    className={`min-h-[48px] rounded-lg border px-3 text-xs ${
                      modeActif === i ? 'border-neon-cyan text-neon-cyan shadow-glow-cyan' : 'border-zinc-700 text-zinc-400'
                    }`}
                  >
                    {profils[i]?.nom}
                  </button>
                ))}
              </div>
            </div>
          )}

          <dl className="grid grid-cols-2 gap-2 text-xs">
            <div><dt className="text-zinc-500">Type</dt><dd>{arme.type}</dd></div>
            <div><dt className="text-zinc-500">Portée</dt><dd>{profil.portee}</dd></div>
            <div><dt className="text-zinc-500">Dégâts</dt><dd className="text-white">{formaterProfil(profil.degats)}</dd></div>
            <div><dt className="text-zinc-500">Violence</dt><dd className="text-white">{formaterProfil(profil.violence)}</dd></div>
            {arme.coutPE && <div><dt className="text-zinc-500">Énergie</dt><dd>{arme.coutPE}</dd></div>}
          </dl>

          {profil.effets.length > 0 && (
            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">Effets</p>
              <ul className="space-y-1">
                {profil.effets.map((e) => (
                  <li key={e} className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300">{e}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              if (arme.equipee) onDesequiper();
              else onEquiper(true);
              setDrawer(false);
            }}
            className="min-h-[48px] w-full rounded-lg bg-neon-cyan/15 text-sm font-medium text-neon-cyan active:bg-neon-cyan/25"
          >
            {arme.equipee ? 'Ranger' : 'Équiper'}
          </button>
        </div>
      </RuleDrawer>
    </>
  );
}
