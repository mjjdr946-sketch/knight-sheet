'use client';

/**
 * ⚒ Équipement — le VRAI catalogue (prompt v17) : parcourir et ACHETER.
 * 3 sections drill-down avec compteurs, recherche textuelle, badges
 * d'accessibilité, achats réels (PG débités, sync serveur via subscriber).
 */
import { useMemo, useState } from 'react';
import Accordion from '../../../components/ui/Accordion';
import { useCharacterStore } from '@/store/characterStore';
import { armesArsenal } from '../../../src/data/weapons';
import { NOUVEL_ARSENAL_2038, ARMES_PRESTIGE, RELIQUES_ESPOIR, MODULES_PRESTIGE } from '../../../src/data/arsenal-2038';
import { catalogueModules } from '../../../src/data/modules';
import { META_ARMURES } from '../../../src/data/meta-armures';
import { validerEquipement } from '@/engine/equipement';
import type { Weapon, ArmorModule } from '@/types/character';

/** Badge d'accessibilité (prompt v17 §3) */
function Badge({ a, prestige }: { a: 'standard' | 'avance' | 'rare'; prestige?: boolean }) {
  const styles = {
    standard: 'border-zinc-600 text-zinc-400',
    avance: 'border-sky-700 text-sky-300',
    rare: 'border-amber-700 text-amber-300',
  };
  return <span className={`rounded border px-1 text-[9px] uppercase tracking-wider ${styles[a]}`}>{prestige ? 'Table Ronde' : a}</span>;
}

export default function EquipementPage() {
  const character = useCharacterStore((s) => s.character);
  const acheterArmeCatalogue = useCharacterStore((s) => s.acheterArmeCatalogue);
  const acheterModuleCatalogue = useCharacterStore((s) => s.acheterModuleCatalogue);
  const equiperArme = useCharacterStore((s) => s.equiperArme);
  const activerModule = useCharacterStore((s) => s.activerModule);
  const [recherche, setRecherche] = useState('');
  const [message, setMessage] = useState('');

  // Catalogue complet : livre de base + 2038 + prestige (Table Ronde)
  const catalogueArmes: Weapon[] = useMemo(
    () => [...armesArsenal, ...NOUVEL_ARSENAL_2038, ...ARMES_PRESTIGE],
    [],
  );
  const possedees = useMemo(() => new Set(character.armes.map((a) => a.nom)), [character.armes]);

  const filtre = (texte: string) => texte.toLowerCase().includes(recherche.toLowerCase());

  // IT. 22 §7 : filtre par CATÉGORIE des équipements achetés ET achetables
  const [categorieFiltre, setCategorieFiltre] = useState<'toutes' | 'contact' | 'tir'>('toutes');

  const armesFiltrees = catalogueArmes
    .filter((a) => categorieFiltre === 'toutes' || a.type === categorieFiltre)
    .filter((a) => filtre(`${a.nom} ${a.effets.join(' ')}`));
  const modulesFiltres = catalogueModules.filter((m) => filtre(`${m.nom} ${m.categorie}`));

  const exec = (fn: () => { ok: boolean; message: string }) => setMessage(fn().message);

  // IT. 22 §7 : boutons de filtre par catégorie (armes de contact / armes de tir)
  const boutonsFiltre = (
    <div className="flex gap-1.5">
      {(['toutes', 'contact', 'tir'] as const).map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => setCategorieFiltre(cat)}
          className={`min-h-[44px] flex-1 rounded-lg border px-2 text-xs ${categorieFiltre === cat ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan' : 'border-zinc-700 text-zinc-400'}`}
        >
          {cat === 'toutes' ? 'Toutes' : cat === 'contact' ? 'Contact' : 'Tir'}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* PG disponibles + recherche */}
      <div className="flex items-center gap-2">
        <span className="rounded-lg border border-neon-gold/50 bg-neon-gold/10 px-3 py-1.5 text-sm font-bold text-neon-gold">{character.gloire} PG</span>
        <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher (nom ou effet)…"
          className="min-h-[44px] flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-sm text-white" />
      </div>
      {message && <p className="rounded-lg border border-neon-cyan/30 bg-neon-cyan/5 p-2 text-xs text-neon-cyan">{message}</p>}

      {/* ─── 1. Mon armure (prompt v17 §1) ─────────────────────────── */}
      <Accordion titre="Mon armure" compteur={character.modules.length} ouvertParDefaut accent="cyan">
        <div className="space-y-2">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-xs text-zinc-300">
            <b className="text-white uppercase">{character.metaArmor.modele}</b> · {character.metaArmor.paTotal} PA · {character.metaArmor.peTotal} PE · CdF {character.metaArmor.cdfTotal}
          </div>
          {character.modules.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-2">
              <div>
                <p className="text-xs text-white">{m.nom} {m.etat === 'actif' && <span className="text-neon-cyan">● actif</span>}</p>
                <p className="text-[10px] text-zinc-500">{m.coutPE ? `${m.coutPE} PE` : 'sans énergie'} · {m.duree}</p>
              </div>
              <div className="flex gap-1">
                <button type="button" onClick={() => { const ok = activerModule(m.id, m.etat !== 'actif'); setMessage(ok ? (m.etat !== 'actif' ? m.nom + ' activé' : m.nom + ' désactivé') : 'Activation impossible'); }}
                  className="min-h-[44px] rounded-lg bg-neon-cyan/15 px-2.5 text-[11px] text-neon-cyan active:bg-neon-cyan/25">
                  {m.etat === 'actif' ? 'Désactiver' : 'Activer'}
                </button>
              </div>
            </div>
          ))}
          {character.modules.length === 0 && <p className="text-xs text-zinc-600">Aucun module installé — achète-en dans la section ci-dessous.</p>}
          <p className="text-[11px] text-zinc-600">Changer de méta-armure : onglet ◈ Armure (modale de confirmation).</p>
        </div>
      </Accordion>

      {/* ─── 2. Catalogue d'armes (prompt v17 §1) ──────────────────── */}
      <Accordion titre="Catalogue d'armes" compteur={armesFiltrees.length} accent="cyan">
        <div className="space-y-1.5">
          {armesFiltrees.map((a) => {
            const possedee = possedees.has(a.nom);
            // instance de l'inventaire : équipée ou non (une arme à deux mains en
            // main empêche tout autre équipement → il FAUT pouvoir la déséquiper)
            const instanceInv = character.armes.find((ar) => ar.nom === a.nom);
            const dejaEquipee = !!instanceInv?.equipee;
            const tableRonde = ARMES_PRESTIGE.some((p) => p.id === a.id);
            const releve = RELIQUES_ESPOIR.some((r) => r.nom.includes(a.nom));
            return (
              <div key={a.id} className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white">
                      {a.nom} <Badge a={a.accessibilite} prestige={tableRonde || releve} />
                    </p>
                    <p className="text-[10px] text-zinc-500">{a.degats.nombre}D6+{a.degats.bonus} · {a.violence.nombre}D6+{a.violence.bonus} · {a.portee}{a.effets.length > 0 ? ` · ${a.effets.slice(0, 3).join(', ')}` : ''}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    {!possedee && (
                      <button type="button" onClick={() => exec(() => acheterArmeCatalogue(a))}
                        className="min-h-[44px] rounded-lg bg-neon-gold/15 px-2.5 text-[11px] font-bold text-neon-gold active:bg-neon-gold/25">
                        Acheter {a.coutPG} PG
                      </button>
                    )}
                    {possedee && dejaEquipee && (
                      <button type="button" onClick={() => {
                        setMessage(equiperArme(instanceInv!.id, false) ? `${a.nom} déséquipée` : 'Déséquipement impossible');
                      }}
                        className="min-h-[44px] rounded-lg border border-zinc-600 px-2.5 text-[11px] text-zinc-300 active:bg-zinc-800">
                        Déséquiper
                      </button>
                    )}
                    {possedee && !dejaEquipee && (
                      <button type="button" onClick={() => {
                        // IT. 22 §7 : équiper l'INSTANCE de l'inventaire (son id
                        // réel ≠ l'id du catalogue — avant : le PUT cherchait un
                        // id inexistant et refusait « Équipement impossible »)
                        // CORRECTIF ops : ce refus contredisait le store livré dans le
                        // même commit (equiperArme autorise l'équipement sur fiche
                        // scellée — action de jeu, FAQ p.453) ET le test E2E
                        // « XP → achat → Équiper → l'arme apparaît dans Combat » (8/8
                        // exigé avant déploiement). Deux chemins pour la même action
                        // (catalogue vs inventaire) doivent se comporter pareil.
                        const instance = character.armes.find((ar) => ar.nom === a.nom && !ar.equipee);
                        if (!instance) { setMessage('Déjà équipée'); return; }
                        // L'utilisateur doit savoir POURQUOI : « Équipement impossible »
                        // seul ne disait pas qu'une arme à deux mains occupe déjà les deux
                        // mains (cause du KO testeur « le bouton ne fait rien »).
                        const v = validerEquipement(character, { ...instance, equipee: true });
                        if (!v.ok) { setMessage(`Équipement impossible — ${v.raison ?? 'mains occupées'}`); return; }
                        const ok = equiperArme(instance.id, true);
                        setMessage(ok ? `${a.nom} équipée` : 'Équipement impossible');
                      }}
                        className="min-h-[44px] rounded-lg bg-neon-cyan/15 px-2.5 text-[11px] text-neon-cyan active:bg-neon-cyan/25">
                        Équiper
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Accordion>

      {/* ─── 3. Modules & améliorations (prompt v17 §1) ────────────── */}
      <Accordion titre="Modules & améliorations" compteur={modulesFiltres.length} accent="cyan">
        <div className="space-y-1.5">
          {modulesFiltres.map((m: ArmorModule) => (
            <div key={m.id} className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white">{m.nom} <Badge a={m.accessibilite} /></p>
                  <p className="text-[10px] text-zinc-500">{m.description.slice(0, 90)}…</p>
                </div>
                <button type="button" onClick={() => exec(() => acheterModuleCatalogue(m))}
                  className="min-h-[44px] rounded-lg bg-neon-gold/15 px-2.5 text-[11px] font-bold text-neon-gold active:bg-neon-gold/25">
                  Acheter {m.coutPG} PG
                </button>
              </div>
            </div>
          ))}
        </div>
      </Accordion>

      {/* ─── 4. Reliques d'espoir (2038 p.35) ───────────────────────── */}
      <Accordion titre="Reliques d'espoir" compteur={RELIQUES_ESPOIR.length} accent="gold">
        <div className="space-y-1.5">
          {RELIQUES_ESPOIR.map((r) => (
            <div key={r.id} className="rounded-lg border border-amber-800/50 bg-zinc-900/60 px-2.5 py-2">
              <p className="text-xs text-white">{r.nom} <Badge a="rare" prestige /></p>
              <p className="text-[10px] text-zinc-500">{r.description} · {r.effets.join(' / ')}{r.special ? ` · ${r.special}` : ''}</p>
            </div>
          ))}
          <p className="text-[11px] text-zinc-600">Achat réservé aux chevaliers ≥ 300 PG, un exemplaire chacune (2038 p.35).</p>
        </div>
      </Accordion>

      {/* ─── 5. Modules de prestige (2038 pp.26-33) ─────────────────── */}
      <Accordion titre="Modules de prestige" compteur={MODULES_PRESTIGE.length} accent="gold">
        <div className="space-y-1.5">
          {MODULES_PRESTIGE.filter((m) => filtre(`${m.nom} ${m.description}`)).map((m) => (
            <div key={m.id} className="rounded-lg border border-amber-800/50 bg-zinc-900/60 px-2.5 py-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white">{m.nom} <Badge a="rare" prestige /></p>
                  <p className="text-[10px] text-zinc-500">{m.description}</p>
                </div>
                <button type="button" onClick={() => exec(() => acheterModuleCatalogue({
                  ...catalogueModules[0]!, // gabarit de forme
                  id: `prestige-${m.id}`, nom: m.nom, coutPG: m.coutPG, slots: {},
                  description: m.description, accessibilite: 'rare',
                } as ArmorModule))}
                className="min-h-[44px] rounded-lg bg-neon-gold/15 px-2.5 text-[11px] font-bold text-neon-gold">
                  Acheter {m.coutPG} PG
                </button>
              </div>
            </div>
          ))}
          <p className="text-[11px] text-zinc-600">Table Ronde à 500 PG — aucun slot ; synergie si tous les modules d'un blason (2038 p.26).</p>
        </div>
      </Accordion>
    </div>
  );
}
