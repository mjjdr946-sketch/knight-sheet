# TODO-RULES — placeholders et règles à compléter

> Inventaire de TOUT ce que l'app n'implémente pas encore ou tranché par
> interprétation. Conformément au prompt : « n'invente jamais une règle » —
> chaque entrée pointe le fichier, la règle du digest manquante ou ambiguë,
> et la page du livre quand elle est connue.
>
> État après **itération 2** (scope Full, prompt v4). Hors scope réservé
> itération 3 : PNJ (bandes/salopards/colosses), tracker d'initiative,
> dégâts environnementaux, véhicules.

## 1. Incohérences du digest — TRANCHÉES (prompt v4 §0, validées par NunnuN)

- ✅ **OD de base de la Paladin (p.138)** — TRANCHÉ : 4 OD dans 4
  caractéristiques de 4 aspects **différents**, au choix du joueur
  (Tir = Machine, Perception = Masque). Exemple codé corrigé :
  force/Chair, sangfroid/Dame, tir/Machine, perception/Masque.
  Garde anti-régression : `src/data/__tests__/tranchages.test.ts`.
- ✅ **Défense/Réaction/Initiative** — CONFIRMÉ : interprétation « au choix »
  (p.88) avec repli « la plus haute ». UI de choix sur la page Attributs.
- ✅ **Tableau des blessures (p.91)** — TRANCHÉ (codage tel quel) : table
  complète en données (`src/data/blessures.ts`), lignes douteuses marquées
  `// TODO-RULES: vérifier p.91`, application automatique via le moteur
  (`appliquerBlessure` + store `tirerBlessureAgonie`, suite d'agonie
  1re/2e = blessure, 3e = mort — p.90).

## 2. Coûts et automatisations

- ✅ **Coûts PE structurés** — `parseCoutPE()` (engine/equipement) :
  activation + usage par tir/action/tour ; store `depenserPEUsage(cout)`
  avec refus si PE insuffisant (p.130). Le câblage par usage (ex. déduire
  1 PE à chaque tir supplémentaire Watchtower) reste à l'UI de tir
  (itération 3 — la fonction existe, l'automatisation par tir non).
- ✅ **Shrine : maintenance** — bouton « Payer maintenance (1 PE/tour) »
  sur la page Méta-armure (FAQ p.455) ; pas d'horloge automatique (choix
  validé prompt v4 §2).
- ✅ **Évolutions Paladin 150/200/250 PG (p.140)** — détection automatique
  (`evolutionsAtteintes`, gloire >= seuil), affichage d'état ✓/○ sur la page
  Méta-armure, **slotage d'armes dans les bras** opérationnel (store
  `sloterArme`/`desloterArme`, validation p.140 + FAQ p.455). Reste : l'UI
  du slotage n'a pas de panneau dédié (passable via console/itération 3).
- 🔶 **Niveaux de modules (niv 2/3)** : le champ `niveau` existe, les
  paliers sont décrits dans les données, mais l'achat progressif (niveaux
  précédents requis, p.428) n'est pas modélisé dans le store.

## 3. Données d'arsenal — INTÉGRÉES (livrable 2 it. 2)

- ✅ **Armes** : 40 armes + 19 modes secondaires (le bilan du digest
  annonce 17 ; la table en contient 19 — écart documenté dans
  `src/data/__tests__/arsenal.test.ts`). → `src/data/weapons.ts`
- ✅ **Modules** : 57 modules hors OD (72 − 15) dans le catalogue, filtrable
  par catégorie/accessibilité sur la page Méta-armure. → `src/data/modules.ts`
- ✅ **Overdrives** : les 15 types avec grille 10/30/50/70/100 PG et
  effets par palier en données. → `src/data/overdrives.ts`
- ✅ **Améliorations d'armes à distance** : 18 en données. →
  `src/data/upgrades.ts`. Reste : l'UI d'application des améliorations
  sur une arme (le type est prêt).
- ✅ **Grenades intelligentes** : les 5 types (shrapnel, flashbang, IEM,
  anti-blindage, explosive). → `src/data/weapons.ts`
- ✅ **Nods** : données (`src/data/nods.ts`) + action store
  `utiliserNod(type, 3D6)` bornée au max.
- **Véhicules (p.447+)** : hors scope, non extraits du digest.
- 🔶 **Effets des OD par palier** : les données décrivent chaque palier
  (ex. OD Endurance niv 3 = +6 PS en armure ; OD Hargne niv 3 = ne meurt
  pas à 0 PS ; OD Aura niv 5 = +Aura à la défense…) mais seuls les effets
  « +1 réussite » et le bonus de dérivée (+1/niveau) sont AUTOMATISÉS dans
  le moteur ; les paliers à effets de règle nécessitent des implémentations
  dédiées (liste dans les données, à traiter au cas par cas).

## 4. Mécaniques de jeu

- ✅ **Tableau des blessures aléatoires (p.91)** — tirage injecté 2D6,
  application automatique en `Condition` + `Modifier` (moteur + store).
- 🔶 **Implant cybernétique (20 PG, −3 PEs) / thérapie (100 PG, p.91)** :
  le retrait de condition existe (`retirerCondition`) mais pas d'action
  dédiée qui applique le coût et le −3 PEs total.
- ✅ **Test d'espoir (p.96)** — moteur (`appliquerTestEspoir`) + store
  (`testerEspoir`). Reste : un bouton dédié dans l'UI (la fonction est
  appelable, pas de widget).
- ✅ **Héroïsme (p.96-97)** — les 5 usages + Cartes du Destin (3 points)
  en moteur et store (`utiliserHeroisme`). Reste : l'UI des usages
  (aujourd'hui : jauge +/− seule).
- 🔶 **Points de contact (p.95)** : calculés et affichés (page Attributs),
  pas de gestion de dépense par lieu (1/2/3/4/6 pts) ni de récupération.
- ❌ **Initiative en phase de conflit (p.86)** : pas de tracker (3D6 +
  score, embuscade +10, bandes à initiative 1, retarder son tour) —
  **réservé itération 3**.
- ❌ **Dégâts environnementaux (p.92)** : chute, feu, noyade, gaz/poisons,
  accidents — **réservé itération 3**.
- ❌ **Côté PNJ** (bandes, salopards, patrons, colosses, points faibles,
  boucliers) : le flag `colosse` existe dans `applyDamage` (tranches de
  10, p.103) mais aucune UI de PNJ — **réservé itération 3**.
- 🔶 **Styles à effets de dés** (akimbo cumul, pilonnage +1D6/tour, puissant
  sacrifice de dés…) : les styles portent leurs modificateurs de stats
  (défense/réaction, déclarés via `declarerStyle`) ; les mécaniques de dés
  restent MJ/manuels.
- ✅ **Dégâts des armes de contact avec OD** (annexe) — `bonusDegatsOD` :
  +3 par niveau d'OD de Force, +1 pour les autres traits comptés
  (Dextérité/Orfèvrerie, Tir/Précision) ; `degatsContactEffectifs`.

## 5. Schéma / technique

- ✅ **`migrate()` du persist** — implémenté v1→v2 : normalisation des champs
  ajoutés en itération 2 (`agonieCoups`, booléens d'équipement, défauts sûrs).
- ✅ **Équipement multi-mains** — `validerEquipement` (engine/equipement) :
  deux-mains = mains libres, armes slotées « en main » (FAQ p.453) ;
  `equiperArme` du store refuse les combinaisons invalides.
- ✅ **Export/import de personnage** — page Identité : export JSON
  téléchargeable, import avec validation de format (via
  `remplacerPersonnage`).
- 🔶 **Affichage des lames** : l'aspect d'une lame ajoutée depuis l'UI
  n'est pas renseigné (mapping FR → id laissé au MJ à la création) ;
  les avantages chiffrés autres que Dur à cuir / Forteresse spirituelle
  ne créent pas de `Modifier` automatique (ex. Esprit d'acier, Vétéran).

---
*Feuille de route itération 3 (hors scope actuel) : PNJ/colosses, tracker
d'initiative, dégâts environnementaux, véhicules, UI des usages d'héroïsme,
achat progressif des niveaux de modules, effets de paliers d'OD.*
