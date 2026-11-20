'use client';

/**
 * Page Équipement (ex-Matériel, renommée it. 9) — armes, modules, échanges à la volée.
 * Armes (modes, équipe/ranger), équipement de mission (nods utilisables,
 * grenades). Les modules restent sur l'onglet Méta-armure.
 */
import { useState } from 'react';
import WeaponCard from '../../../components/cards/WeaponCard';
import Accordion from '../../../components/ui/Accordion';
import { useCharacterStore } from '@/store/characterStore';
import { equipementMissionDepart } from '../../../src/data/weapons';
import type { Weapon } from '@/types/character';

export default function EquipementPage() {
  const character = useCharacterStore((s) => s.character);
  const equiperArme = useCharacterStore((s) => s.equiperArme);
  const utiliserNod = useCharacterStore((s) => s.utiliserNod);

  const [modesArmes, setModesArmes] = useState<Record<string, number>>({});
  const [nodsRestants, setNodsRestants] = useState({
    energie: equipementMissionDepart.nodsEnergie,
    armure: equipementMissionDepart.nodsArmure,
    soin: equipementMissionDepart.nodsSoin,
  });

  // Lance 3D6 via le moteur (Math.random — usage réel)
  const utiliserNodD6 = (type: 'soin' | 'armure' | 'energie') => {
    if (nodsRestants[type] <= 0) return;
    const des = Array.from({ length: 3 }, () => 1 + Math.floor(Math.random() * 6));
    const restaure = utiliserNod(type, des[0]!, des[1]!, des[2]!);
    setNodsRestants((n) => ({ ...n, [type]: n[type] - 1 }));
    // RÈGLES: à compléter — espacement 1 h entre nods d'énergie (arbitrage MJ)
    alert(`Nod utilisé : +${restaure} (${des.join(', ')})`);
  };

  const modeIndexArme = (arme: Weapon) => modesArmes[arme.id] ?? 0;

  return (
    <div className="space-y-5">
      {/* ─── Armes ──────────────────────────────────────────────────── */}
      <Accordion titre="Armes" compteur={character.armes.length} ouvertParDefaut accent="cyan">
        <div className="space-y-2">
          {character.armes.map((arme) => (
            <WeaponCard
              key={arme.id}
              arme={arme}
              modeActif={modeIndexArme(arme)}
              onModeChange={(i) => setModesArmes((m) => ({ ...m, [arme.id]: i }))}
              onEquiper={(e) => equiperArme(arme.id, e)}
              onDesequiper={() => equiperArme(arme.id, false)}
            />
          ))}
        </div>
      </Accordion>

      {/* ─── Équipement de mission (étape 10, p.174) ────────────────── */}
      <Accordion titre="Équipement de mission" accent="gold">
        <div className="space-y-2">
          {(
            [
              { type: 'soin', nom: 'Nods de soin', reste: nodsRestants.soin, total: equipementMissionDepart.nodsSoin, effet: '3D6 PS' },
              { type: 'armure', nom: 'Nods d’armure', reste: nodsRestants.armure, total: equipementMissionDepart.nodsArmure, effet: '3D6 PA' },
              { type: 'energie', nom: 'Nods d’énergie', reste: nodsRestants.energie, total: equipementMissionDepart.nodsEnergie, effet: '3D6 PE' },
            ] as const
          ).map((n) => (
            <div key={n.type} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-2">
              <div>
                <p className="text-xs text-white">{n.nom}</p>
                <p className="text-[11px] text-zinc-500">{n.effet} · 1 action de déplacement (annexe)</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">{n.reste}/{n.total}</span>
                <button
                  type="button"
                  disabled={n.reste <= 0}
                  onClick={() => utiliserNodD6(n.type)}
                  className="min-h-[48px] rounded-lg bg-neon-cyan/15 px-3 text-xs font-medium text-neon-cyan disabled:opacity-40 active:bg-neon-cyan/25"
                >
                  Utiliser
                </button>
              </div>
            </div>
          ))}
          <p className="text-[11px] text-zinc-600">
            Grenades intelligentes : {equipementMissionDepart.grenadesIntelligentes} par mission (type choisi à la
            commande digitale, annexe). Remplacement gratuit à Camelot.
          </p>
        </div>
      </Accordion>
    </div>
  );
}
