'use client';

/**
 * Accordéon « Capacités de la classe » (prompt v10 §1) — généré depuis
 * META_ARMURES[modele].capacites. Boutons qui débittent les PE via le store
 * (une seule source de vérité) et affichent le résultat (message moteur).
 */
import { useState } from 'react';
import Accordion from '../../components/ui/Accordion';
import { useCharacterStore } from '@/store/characterStore';
import { META_ARMURES } from '@/data/meta-armures';
import { TYPES_WARRIOR, coutBenedictionArmes, coutChangeling, coutVision, ORIFLAMME, ATTAQUE_PLASMA } from '@/engine/capacites';

export default function CapacitesClasse() {
  const character = useCharacterStore((s) => s.character);
  const activerTypeWarrior = useCharacterStore((s) => s.activerTypeWarrior);
  const basculerGhost = useCharacterStore((s) => s.basculerGhost);
  const utiliserImpulsion = useCharacterStore((s) => s.utiliserImpulsion);
  const utiliserCapacitePE = useCharacterStore((s) => s.utiliserCapacitePE);

  const armure = META_ARMURES[character.metaArmor.modele];
  const [message, setMessage] = useState('');
  const [typeActif, setTypeActif] = useState('');

  const exec = (fn: () => { ok: boolean; message: string }) => {
    const r = fn();
    setMessage(r.message);
  };

  const boutons: { label: string; action: () => { ok: boolean; message: string }; note?: string }[] = [];

  if (character.metaArmor.modele === 'warrior') {
    for (const t of TYPES_WARRIOR) {
      boutons.push({
        label: `Type ${t.nom} (${t.aspect} : +1 OD ${t.traits.join('/')})`,
        action: () => { setTypeActif(t.id); return activerTypeWarrior(t.id, true); },
      });
    }
  }
  if (character.metaArmor.modele === 'rogue') {
    boutons.push({
      label: character.ghostActif ? 'Ghost : DÉSACTIVER' : 'Ghost : activer (2 PE/tour)',
      action: () => basculerGhost(true),
    });
  }
  if (character.metaArmor.modele === 'warmaster') {
    for (const imp of ['esquive', 'force', 'guerre'] as const) {
      boutons.push({
        label: `Impulsion ${imp} sur soi (${imp === 'esquive' ? 3 : imp === 'force' ? 2 : 1} PE)`,
        action: () => utiliserImpulsion(imp, 0, true),
      });
    }
  }
  if (character.metaArmor.modele === 'wizard') {
    boutons.push({ label: `Borealis — bénédiction d'armes (${coutBenedictionArmes(0)} PE)`, action: () => utiliserCapacitePE(coutBenedictionArmes(0), 'Borealis — bénédiction', 'anti-Anathème sur toutes les armes, une phase (p.164)') });
    boutons.push({ label: `Borealis — attaque plasma (${ATTAQUE_PLASMA.coutPE} PE)`, action: () => utiliserCapacitePE(ATTAQUE_PLASMA.coutPE, 'Borealis — attaque plasma', `${ATTAQUE_PLASMA.degats}D6, courte, anti-Anathème + dégâts continus 3 (p.164)`) });
    boutons.push({ label: `Borealis — utilitaire plasma (6 PE)`, action: () => utiliserCapacitePE(6, 'Borealis — utilitaire', 'outils lumineux, portée courte (p.164)') });
    boutons.push({ label: `Oriflamme (${ORIFLAMME.coutPE} PE)`, action: () => utiliserCapacitePE(ORIFLAMME.coutPE, 'Oriflamme', `${ORIFLAMME.degatsDes}D6+${ORIFLAMME.degatsFixe} dégâts / ${ORIFLAMME.violenceDes}D6+${ORIFLAMME.violenceFixe} violence, courte — ne touche QUE l'Anathème (p.165)`) });
  }
  if (character.metaArmor.modele === 'bard') {
    boutons.push({ label: `Changeling — transformation (6 PE)`, action: () => utiliserCapacitePE(coutChangeling(true, false, 0), 'Changeling — transformation', 'percée : PNJ Machine 6, PJ Perception 3 (p.160)') });
    boutons.push({ label: `Changeling — taille étendue (8 PE)`, action: () => utiliserCapacitePE(coutChangeling(false, true, 0), 'Changeling — taille étendue', 'jusqu\u2019à 3 m de rayon (p.160)') });
    boutons.push({ label: `Changeling — faux être (3 PE)`, action: () => utiliserCapacitePE(3, 'Changeling — faux être', 'nanoM intangible, max 3 m (p.160)') });
  }
  if (character.metaArmor.modele === 'ranger') {
    boutons.push({ label: 'Vision (5-10 PE, au MJ)', action: () => utiliserCapacitePE(coutVision(5), 'Vision', 'voir l\u2019invisible — 6 s (p.157)') });
  }
  if (character.metaArmor.modele === 'priest') {
    boutons.push({ label: 'nanoC — forme simple (3 PE)', action: () => utiliserCapacitePE(3, 'nanoC — forme simple', '3 m³, test Technique, 10 tours (p.144)') });
    boutons.push({ label: 'nanoC — objet détaillé (6 PE)', action: () => utiliserCapacitePE(6, 'nanoC — objet détaillé', '2 m³ (p.144)') });
    boutons.push({ label: 'nanoC — objet mécanique (9 PE)', action: () => utiliserCapacitePE(9, 'nanoC — objet mécanique', '1 m³, haute technique (p.144)') });
  }

  if (!armure) return null;

  return (
    <Accordion titre={`Capacités — ${character.metaArmor.modele}`} accent="cyan" sousTitre={`${character.jauges.pe.current} PE disponibles`}>
      <div className="space-y-1.5">
        {boutons.map((b) => (
          <button
            key={b.label}
            type="button"
            onClick={() => exec(b.action)}
            className="min-h-[48px] w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 text-left text-xs text-zinc-300 active:bg-zinc-800"
          >
            {b.label}
          </button>
        ))}
        {typeActif && character.metaArmor.modele === 'warrior' && (
          <p className="text-[11px] text-neon-cyan">Type actif : {TYPES_WARRIOR.find((t) => t.id === typeActif)?.nom}</p>
        )}
        {message && <p className="rounded-lg border border-neon-cyan/30 bg-neon-cyan/5 p-2 text-xs text-neon-cyan">{message}</p>}
        <p className="text-[11px] text-zinc-600">Ghost surprise / impulsion Guerre s'appliquent au prochain jet du simulateur (onglet Combat).</p>
      </div>
    </Accordion>
  );
}
