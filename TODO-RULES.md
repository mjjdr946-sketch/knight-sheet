# TODO-RULES — placeholders et règles à compléter

> Inventaire de TOUT ce que l'app n'implémente pas encore ou tranché par
> interprétation. Conformément au prompt : « n'invente jamais une règle » —
> chaque entrée pointe le fichier, la règle du digest manquante ou ambiguë,
> et la page du livre quand elle est connue.
>
> État après **itération 6** (prompt v8 : thèmes DOCUMENT 3, accueil,
> wizard 10 étapes + scellement, onglet Dés, Feuille regroupée, XP,
> capacités Priest/Barbarian, gyroscope) — détails ci-dessous. Précédent : itération 5 (prompt v7 : adversaires, environnement,
> véhicules, automatisations combat). Hors scope reporté : PNJ
> (bandes/salopards/colosses), tracker d'initiative, dégâts
> environnementaux, véhicules.

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

- ✅ **Simulateur de duel (p.76-89, prompt v5)** — `engine/dice.ts`
  (paire = réussite, exploit/critique, dés injectables) + `computeAttack`
  (dés = base + combo, OD = réussites auto, styles Agressif/Précis/
  Puissant/Pilonnage/Ambidextre-Akimbo jumelés) ; UI : modes attaque/
  encaisse, opposition mémorisée, historique des 20 derniers jets,
  relance d'exploit, dégâts auto sur touche (+Force au contact).
- ✅ **Mécanique de dés spécifiée** (p.76-78, validée par NunnuN) :
  n dés = base + combo, réussite = face paire, toucher = strictement
  supérieur à défense/réaction.
- ✅ **Tableau des blessures aléatoires (p.91)** — tirage injecté 2D6,
  application automatique en `Condition` + `Modifier` (moteur + store),
  accès UI depuis le mode encaissement à 0 PS.
- ✅ **Implant cybernétique / thérapie (p.91)** — `poserImplant` (retire la
  blessure, −3 PEs total, max 6) et `therapieReconstruction` (efface toutes
  les blessures) ; UI « État & soins lourds » sur la page Identité.
- ✅ **Test d'espoir (p.96)** — moteur + store + boutons UI (réussite/échec
  1D6) dans le widget Héroïsme ; Esprit d'acier appliqué automatiquement.
- ✅ **Héroïsme (p.96-97)** — les 5 usages + Cartes du Destin (3 points)
  en moteur, store ET UI (widget onglet Combat).
- ✅ **Points de contact (p.95)** — dépense par lieu (1/2/3/4/6 pts) sur la
  page Attributs, récupération au reset combat (retour Camelot).
- ❌ **Initiative en phase de conflit (p.86)** : pas de tracker (3D6 +
  score, embuscade +10, bandes à initiative 1, retarder son tour) —
  **réservé itération 3**.
- ❌ **Dégâts environnementaux (p.92)** : chute, feu, noyade, gaz/poisons,
  accidents — **réservé itération 3**.
- ✅ **Côté PNJ** (prompt v7 §1) — `engine/pnj.ts` : types
  hostile/salopard/patron/colosse/bande/allié, points faibles (défense/réaction
  ÷2 une fois, p.103), colosses tranches de 10 + anti-véhicule, bandes
  cohésion (violence seule)/débordement cumulé/initiative 1, boucliers/CdF ;
  panneau adversaire branché sur le simulateur avec **mode MJ** (valeurs
  masquées, seul TOUCHE/RATE affiché — p.86) et catalogue véhicules prérempli.
- 🔶 **Styles à effets de dés** : akimbo AUTOMATISÉ (détecte la 2ᵉ arme
  identique équipée, cumul des dés, bonus fixe une fois, malus jumelé −1 dé),
  Pilonnage/Puissant câblés dans `computeAttack` (sacrifice, pile) ;
  restent MJ : ambidextre 2 attaques, précis combo (option dispo).
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
- 🔶 **Affichage des lames** : Esprit d'acier est AUTOMATISÉ (−1 PEs perdu
  sur le test d'espoir) ; l'aspect d'une lame ajoutée depuis l'UI reste non
  renseigné (mapping FR → id au MJ) ; Vétéran (plafonds d'aspects) et autres
  avantages non chiffrés restent roleplay/MJ.

## 6. Ouverts — itérations 3-4 et au-delà

- 🔶 **Profils des 8 méta-armures non Paladin** (prompt v6 §4) :
  `src/data/meta-armures.ts` les structure (Warrior, Warmaster, Rogue, Bard,
  Wizard, Barbarian, Ranger, Priest) mais leurs PA/PE/CdF, slots, OD de
  base, capacités, handicaps et évolutions (pp.130-137) ne sont PAS dans le
  digest → placeholders `RÈGLES: à compléter`, scores à 0. Extraire les
  pages du livre puis remplir les données (le moteur est déjà générique).
- 🔶 **Relance d'exploit en cascade** : si la relance est elle-même un
  exploit, le livre ne précise pas — une seule relance appliquée
  (`relanceExploit`, `// RÈGLES: à compléter`).
- ✅ **Coût PE des tirs Watchtower** — FAQ p.455 : le 1er tir du tour est
  gratuit, les suivants coûtent 1 PE (compteur `tour`/`tirsCeTour` de la
  session, bouton « Tour suivant »).
- 🔶 **Combo de tir** : le combo pertinent d'une arme de tir n'est pas
  déduit automatiquement (option `comboTrait` manuelle ; défaut = Tir seul).
- ✅ **Ordre d'action** : gestion manuelle (choix validé prompt v5 — pas de
  tracker automatique).
- 🔶 **Paliers d'OD à effets de règle** — AUTOMATISÉS : OD Endurance niv 3
  (+6 PS en armure), OD Aura niv 5 (+Aura à la défense), OD Instinct niv 3
  (+3 initiative/niveau), OD Hargne niv 3 (combat la mort à 0 PS), OD Force
  (+3 dégâts/niveau). Restent MJ/à câbler : Savoir niv 3 (soins +1D6),
  Technique, Discrétion, Dextérité, Parole (effets de jets).
- 🔶 **Capacités non automatisées** (PARTIE 6) : Warrior types, Warlord
  impulsions, Falcon, Ghost, Longbow/Vision, Changeling, Borealis/Oriflamme —
  données complètes (texte + coûts PE pp.141-170) mais pas de `Modifier`
  automatique. Priest nanoC/Mechanic (store `reparerPA`) et Barbarian Goliath
  (`activerGoliath`, défense/réaction/CdF automatiques) sont automatisées.

- 🔶 **Niveaux de modules (achat progressif)** — `monterNiveauModule`
  modélise la progression 1→2→3 (niveaux précédents requis, p.428) ;
  les `Modifier` dédiés par palier de module restent à câbler au cas par
  cas (ex. saut niv 2 : +9 dégâts).

---
*Feuille de route itération 6 : profils des 8 méta-armures (pp.130-137),
Modifier des paliers de modules, effets d'OD restants, ambiance/son.
Édition 5 (prompt v7) : adversaires, environnement, véhicules, automatisations
— tous fermés sauf mentions 🔶 ci-dessus.*

## Itération 6 (v8) — nouveau journal

- ✅ DOCUMENT 3 intégré telles quelles (globals.css = knight-themes.css) :
  9 thèmes `data-theme`, tokens sémantiques de jauges, border alpha, glow,
  script anti-flash avant hydration (layout.tsx).
- ✅ Accueil « Mes chevaliers » coloré par armure (ACCENT_PAR_MODELE) ;
  header affiche nom + armure du perso actif.
- ✅ Wizard de création 10 étapes (p.109-174) : copie de travail, archétypes
  17, 22 lames, 14 hauts faits, 10 blasons, motivations, 9 méta-armures,
  5 sections, dérivées au choix ; mode boosté (+25 PG option MJ) et
  SCELLEMENT 🔒 (fiche en lecture seule d'édition).
- ✅ Onglet 🎲 Dés : jets de combo génériques (base+combo+OD, p.76-78),
  difficulté, exploit/échec critique, favoris, historique.
- ✅ Onglet 📜 Feuille : Attributs + Méta-armure + Identité en accordéons.
- ✅ XP : journal des points, détection des paliers 150/200/250 (notification
  réclamation d'évolution), widget PG sur la Feuille.
- ✅ Gyroscope : secouer pour lancer les dés (permission iOS gérée).
- 🔶 Étape 10 du wizard simplifiée : pas d'achat d'arsenal intégré (60 PG à
  dépenser dans Matériel après création).

## Itération 7 (v9) — consolidation & fiabilité

- 🔴 **Bug 1 corrigé** : le wizard part d'une fiche NEUVE (`ajouterFiche`) —
  la fiche active n'est jamais écrasée ; validation = jauges courant==max,
  `xpJournal` initialisé, scellement 🔒, retour accueil. Test non-régression.
- 🔴 **Bug 2 corrigé** : scellement RÉEL — `editionBloquee()` bloque
  l'édition de feuille (armure, modules, slots, identité, dérivées, implants)
  ; jauges de jeu, combat et jets restent actifs ; badge 🔒 dans le header,
  bouton « Déverrouiller » avec confirmation sur la Feuille. Tests store.
- 🔴 **Bug 3 corrigé** : le bouton « Créer » de l'accueil pointe vers le
  wizard ; textes obsolètes supprimés.
- 🔴 **Bug 4 corrigé** : INVARIANT « l'active n'est jamais dans autresFiches »
  (chargerFiche retire la cible du map) ; supprimerFiche choisit une clé ≠ id
  ; état « aucune fiche » propre (actifId null, fiche vierge, pas de crash).
- 🟠 **Bug 5 corrigé** : akimbo détecte la jumelle par NOM de catalogue
  (2 instances distinctes du même modèle cumulent les dés, p.87-88).
- 🟠 **Bug 6 corrigé** : historique en mode MJ affiche « ??? vs ??? »
  (JetLog.masque posé à la journalisation).
- 🟠 **Bug 7 corrigé** : cookie = token signé HMAC-SHA256 (lib/session.ts,
  secret dérivé du mot de passe) — le mot de passe n'est plus dans le cookie ;
  rotation → sessions invalidées. Tests dédiés.
- ✅ **Règle tranchée figée** : le CdF ne se consomme pas (p.131-133,
  FAQ p.449-464) — comportement inchangé, couvert par les tests existants.
- ✅ **Header sticky mobile** : layout h-dvh + main scroll interne,
  GaugeBar shrink-0 ; **desktop (≥1024px)** : dérivées (Défense/Réaction/
  Initiative/Contacts/CdF) affichées dans le header sans accordéon.
- ✅ **Test d'intégration du parcours complet** : créer → jouer → sceller →
  déverrouiller → dupliquer → supprimer (parcours.test.ts).

## Itération 8 (v10) — capacités des 6 classes + wizard finalisé

- ✅ **Warrior** : 5 types (Soldier/Hunter/Scholar/Herald/Scout p.136) —
  1 OD dans les 3 traits de l'aspect, HORS limite de 5, 1 PE/tour (6/scène) ;
  slots réels 7/10/10/12/7/7, OD de base corrigées (PARTIE 6 mise à jour).
- ✅ **Warmaster** : impulsions Warlord (p.148) — coûts/allié + surcoût
  porteur (Action 4+10), esquive/force/guerre sur soi en conditions 1 tour ;
  Falcon/alliés distants = résolu à la table (MJ).
- ✅ **Rogue** : Ghost (p.152) — 2 PE/tour, +3 réussites inaperçu, attaque
  surprise = +Discrétion dés et fixe (option `ghostSurprise` de
  `computeAttack`, 1re attaque du tour).
- ✅ **Ranger** : Longbow (p.156) — profil configurable (dés/portée/effets
  par palier de PE, bornes 6D6 générés, 3 effets max), Vision (p.157) ;
  slots réels 4/4/4/6/4/4.
- ✅ **Bard** : Changeling (p.160) — coûts 6/8/3 PE, percée Machine 6 /
  Perception 3 ; vision alternative détecte sans test (FAQ).
- ✅ **Wizard** : Borealis (bénédiction 6+2 PE, plasma 4D6 2 PE, utilitaire
  6 PE) + Oriflamme (6D6+6, 12 PE, anti-Anathème) (p.164-165).
- ✅ **OD restants** : Savoir niv 3 = soins +1D6 (câblé sur les nods de
  soin) ; onglet 🎲 Dés : OD activables/désactivables par trait avant le jet.
- ✅ **Paliers de modules** : `paliers-modules.ts` (blindage drone niv 2 :
  +4 CdF/+3 défense cumulable Shrine…) — `monterNiveauModule` applique les
  Modifier par niveau ; modules sans effet décrit = TODO-RULES 🔶.
- ✅ **Étape 10 du wizard** : mini-catalogue 60 PG (85 boosté) — armes
  standards filtrées, budget restant, achats appliqués à la fiche AVANT
  scellement ; ajustable ensuite dans ⚒ Matériel (même source de vérité).
- ✅ **Tranchage §0 figé** : relance d'exploit = 1 seule, jamais de cascade
  (`relancesAutorisees`, test dédié, p.78).

## Itération 9 (v11) — UX de jeu

- ✅ **Header 2 lignes desktop** (≥1024px) : ligne 1 nom + dérivées, ligne 2
  les 5 jauges côte à côte (`max-w-4xl`, `overflow-visible`) — plus de
  scroll horizontal. Mobile inchangé (swipe horizontal toléré UNIQUEMENT
  dans le header).
- ✅ **TabBar à 5** : 🏠 Chevaliers · 📜 Feuille · ⚔ Combat · 🎲 Dés ·
  ⚒ Équipement (Matériel renommé). L'Opposition n'est plus un onglet :
  bouton « 🎭 Préparer l'adversaire » dans Combat qui ouvre la vue dédiée
  (panneau + environnement repliés en fin de page).
- ✅ **Ordre des blocs Combat** : attaque (gyroscope) · dégâts/encaissement ·
  armure · (adversaire + environnement en bas).
- ✅ **« Jet avec opposition »** (sens inversé) : COCHÉE par défaut — la
  décocher passe en comparaison manuelle au MJ.
- ✅ **Animation Mecha** (prompt v11 §3) : flash blanc, shake/zoom, chiffre
  spring, bordure verdict — composant `ResultatAnime` ; vibreur
  `navigator.vibrate` avec motif par verdict (feature-detect, silencieux
  iOS) ; toggle « Cinématique » dans les réglages de la Feuille (ON par
  défaut, persisté `knight-cinematique`) — OFF = bloc statique.
- ✅ **Modale changement d'armure** (p.130) : liste précise des resets
  (jauges max, OD de base, capacités désactivées, modules déséquipés,
  évolutions) + « conservé » explicite (PG, boosté, identité, XP) ;
  `changerArmure` applique le reset réel — 2 tests de non-régression.
  NB : le test du prompt citait Warrior→Psion — Psion arrive en it. 10
  (PARTIE 7) ; test équivalent avec Wizard.
- ✅ **Palier de puissance** (PARTIE 7) : badge Écuyer/Chevalier/Champion/
  Table Ronde sur l'accueil (cartes) + header (`palierPuissance`, test
  dédié — seuils 100/300/500 PG).
