'use client';

/**
 * Layout des pages personnage — héberge GaugeBar (sticky) + TabBar (fixed).
 * Client component : Zustand + persist (localStorage) + Framer Motion.
 * Garde d'hydratation : l'état persisté n'est lu qu'après le montage pour
 * éviter tout mismatch SSR (localStorage indisponible côté serveur).
 */
import { useEffect, useState } from 'react';
import GaugeBar from '../../components/header/GaugeBar';
import TabBar from '../../components/navigation/TabBar';
import { useCharacterStore, themeDeFiche } from '@/store/characterStore';
import { computeDerived } from '@/engine/stats';
import { personnageExemple } from '@/data/character';
import { brancherSync, compteActif, chargerFichesServeur, reconcilierCompte, syncEnRetard, surSync } from '@/lib/sync';

export default function PersonnageLayout({ children }: { children: React.ReactNode }) {
  const [hydrate, setHydrate] = useState(false);
  const remplacerPersonnage = useCharacterStore((s) => s.remplacerPersonnage);

  useEffect(() => {
    // Prompt v13 §1 : le SERVEUR est la source de vérité — les fiches du compte
    // écrasent le cache local au chargement, puis toute écriture est poussée.
    brancherSync();
    const accountId = compteActif();
    if (accountId) {
      // IT. 22 §2 : réconcilier knight-compte (le marquage « (test) » a renommé
      // les comptes — le vieux nom ne résolvait plus → 0 fetch silencieux).
      reconcilierCompte().then((cleCanonique) => {
      chargerFichesServeur(cleCanonique ?? accountId).then((fiches) => {
        // PROMPT v21 §1 (itération 18) : le chargement des données du compte
        // ne remplace JAMAIS un brouillon de wizard en cours — on trace le
        // contexte pour diagnostiquer la chaîne nom en prod.
        const draft = useCharacterStore.getState().wizardDraft;
        if (draft) {
          console.info('[layout] chargement serveur : brouillon en cours préservé (nom:', JSON.stringify(draft.nom), ')');
        }
        // CORRECTIF ops (it. 11, recette pt 6) : ne jamais garder le cache du
        // compte précédent quand le compte courant n'a aucune fiche serveur.
        const liste = (fiches ?? []).map((f) => f as never);
        if (liste.length > 0) {
          // Même invariant ici : l'active reste hors de autresFiches.
          const active = liste.find((f) => (f as { id: string }).id === useCharacterStore.getState().actifId) ?? liste[0];
          useCharacterStore.setState({
            character: active,
            autresFiches: Object.fromEntries(liste.filter((f) => f !== active).map((f) => [(f as { id: string }).id, f])),
          } as never);
        } else {
          const neutre = { ...structuredClone(personnageExemple), id: 'aucune', nom: '' };
          useCharacterStore.setState({ character: neutre, autresFiches: {} } as never);
        }
      });
      }); // fin de la chaîne de réconciliation IT. 22 §2
    }
    // Reprise du persist (cache UI) : recalcul des dérivées à partir du personnage restauré
    useCharacterStore.persist.rehydrate();
    const state = useCharacterStore.getState();
    useCharacterStore.setState({ derived: computeDerived(state.character) });
    // DOCUMENT 3 règle 4 : data-theme suit la classe du personnage actif
    document.documentElement.setAttribute('data-theme', themeDeFiche(state.character));
    setHydrate(true);
  }, [remplacerPersonnage]);

  // Rendu neutre tant que le persist n'est pas relit (anti-flash / anti-mismatch)
  if (!hydrate) {
    return (
      <div className="flex h-dvh items-center justify-center bg-zinc-950">
        <span className="font-display text-sm text-neon-cyan animate-pulse">Knight</span>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col">
      <BandeauSync />
      <GaugeBar />
      <main className="flex-1 overflow-y-auto px-3 pb-24 pt-3">{children}</main>
      <TabBar />
    </div>
  );
}


/** Bandeau « non sauvegardé » (prompt v13 §1) — retry au prochain changement. */
function BandeauSync() {
  const [retard, setRetard] = useState(syncEnRetard());
  useEffect(() => {
    const off = surSync(setRetard);
    return () => { off(); };
  }, []);
  if (!retard) return null;
  return (
    <div className="sticky top-0 z-50 bg-red-900/90 px-3 py-1.5 text-center text-xs font-semibold text-white">
      ⚠ Non sauvegardé — connexion au serveur perdue, nouvelle tentative au prochain jet/action.
    </div>
  );
}
