'use client';

/**
 * FichesSection — gestion des slots de personnages (prompt v6 §2) :
 * créer, dupliquer, supprimer, charger. Persité via le store (schéma v4).
 */
import { useState } from 'react';
import Accordion from '../../components/ui/Accordion';
import { useCharacterStore } from '@/store/characterStore';

export default function FichesSection() {
  const actifId = useCharacterStore((s) => s.actifId);
  const autresFiches = useCharacterStore((s) => s.autresFiches);
  const character = useCharacterStore((s) => s.character);
  const creerFiche = useCharacterStore((s) => s.creerFiche);
  const dupliquerFiche = useCharacterStore((s) => s.dupliquerFiche);
  const supprimerFiche = useCharacterStore((s) => s.supprimerFiche);
  const chargerFiche = useCharacterStore((s) => s.chargerFiche);

  const [nomNouvelle, setNomNouvelle] = useState('');

  const creer = () => {
    const nom = nomNouvelle.trim() || 'Nouveau chevalier';
    creerFiche(nom);
    setNomNouvelle('');
  };

  return (
    <Accordion titre="Fiches" compteur={1 + Object.keys(autresFiches).length} accent="cyan">
      <div className="space-y-2">
        {/* Fiche active */}
        <div className="flex items-center justify-between rounded-lg border border-neon-cyan/40 bg-zinc-950 px-2.5 py-2">
          <div>
            <p className="text-xs text-white">★ {character.nom}</p>
            <p className="text-[11px] text-neon-cyan">fiche active</p>
          </div>
          <button
            type="button"
            onClick={() => actifId && dupliquerFiche(actifId)}
            className="min-h-[48px] rounded-lg border border-zinc-700 px-2.5 text-[11px] text-zinc-300 active:bg-zinc-800"
          >
            Dupliquer
          </button>
        </div>

        {/* Autres fiches */}
        {Object.entries(autresFiches).map(([id, fiche]) => (
          <div key={id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-2">
            <p className="text-xs text-zinc-300">{fiche.nom}</p>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => chargerFiche(id)}
                className="min-h-[48px] rounded-lg bg-neon-cyan/15 px-2.5 text-[11px] text-neon-cyan active:bg-neon-cyan/25"
              >
                Charger
              </button>
              <button
                type="button"
                onClick={() => dupliquerFiche(id)}
                className="min-h-[48px] rounded-lg border border-zinc-700 px-2.5 text-[11px] text-zinc-300 active:bg-zinc-800"
              >
                Dupliquer
              </button>
              <button
                type="button"
                aria-label={`Supprimer ${fiche.nom}`}
                onClick={() => supprimerFiche(id)}
                className="min-h-[48px] rounded-lg border border-red-900/50 px-2.5 text-[11px] text-red-400 active:bg-red-900/20"
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}

        {/* Création */}
        <div className="flex items-center gap-2 rounded-lg bg-zinc-950 p-2">
          <input
            value={nomNouvelle}
            onChange={(e) => setNomNouvelle(e.target.value)}
            placeholder="Nom du nouveau chevalier…"
            className="min-h-[48px] flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-xs text-white outline-none"
          />
          <button
            type="button"
            onClick={creer}
            className="min-h-[48px] rounded-lg bg-neon-gold/15 px-3 text-xs font-medium text-neon-gold active:bg-neon-gold/25"
          >
            Créer
          </button>
        </div>
      </div>
    </Accordion>
  );
}
