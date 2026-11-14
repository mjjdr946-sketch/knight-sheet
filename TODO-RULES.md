# TODO-RULES — placeholders et règles à compléter

> Inventaire de TOUT ce que l'app n'implémente pas encore ou tranché par
> interprétation. Conformément au prompt : « n'invente jamais une règle » —
> chaque entrée pointe le fichier, la règle du digest manquante ou ambiguë,
> et la page du livre quand elle est connue.

## 1. Incohérences du digest (à trancher avec le livre papier)

- **OD de base de la Paladin (p.138)** : le digest dit « 4 OD, un dans chacune
  des caractéristiques de 4 aspects, au choix : Force/Endurance (Chair),
  Tir/Perception (Dame)… » — **Tir est Machine et Perception est Masque**,
  pas Dame. Interprétation retenue : 4 OD de base dans 4 caractéristiques au
  choix du joueur parmi celles des aspects. Exemple codé : force, endurance,
  tir, perception. → `src/data/meta-armor.ts`
- **Défense/Réaction/Initiative : « la plus haute » (p.172) vs « au choix »
  (p.88)** : interprétation retenue = **au choix** (p.88, plus précise),
  avec repli sur « la plus haute » si aucun choix. → `src/engine/stats.ts`
- **Tableau des blessures (p.91)** : ligne 1 colonne 1 = « Mort » alors que la
  ligne 6 colonne 6 = « Rien ! juste l'agonie » — codé tel quel, à vérifier
  (perte 1D6+1D6 impossible à « Mort » pour une 2ᵉ mise à l'agonie ?).

## 2. Coûts et automatisations partielles

- **Coûts PE par usage** (ex. Watchtower « 1 PE par tir supplémentaire »
  FAQ p.455, fléau répulsif « 1/action », fusil laser « 1/tir ») :
  `coutActivationPE()` ne déduit que le coût d'activation (premier entier) ;
  les coûts par usage sont à câbler sur des actions dédiées. →
  `src/store/characterStore.ts`
- **Shrine : maintenance par tour** (payer les PE chaque tour, FAQ p.455) :
  pas de mécanique de tour automatique. L'activation déduit 1 PE une fois.
- **Évolutions Paladin (150/200/250 PG, p.140)** : les effets de CdF sont
  appliqués automatiquement si `gloire >= seuilPG`, mais l'UI de déclaration
  des évolutions (et le slotage d'armes dans les bras, champ `slotee` défini
  mais sans UI) n'existe pas.
- **Niveaux de modules (niv 2/3)** : le champ `niveau` existe mais l'achat
  progressif (niveaux précédents requis, p.428) n'est pas modélisé.

## 3. Données d'arsenal partiellement intégrées

Le digest PARTIE 4 (annexe 2) contient tout ; seule une sélection est codée :

- **Armes** : 5 profils codés (pistolet de service, marteau-épieu, fusil
  d'assaut, lance-grenade léger + 3 munitions, grenade shrapnel) sur les
  ~40 armes et ~17 modes secondaires du livre. → `src/data/weapons.ts`
- **Modules** : 5 codés (fumigène, flash, blindage drone, lame de bras,
  TACCOM) sur les 72 modules. → `src/data/modules.ts`
- **Overdrives** : les 15 types d'OD (grille 10/30/50/70/100 PG) avec leurs
  bonus par palier ne sont pas en données — seuls les niveaux sont portés
  (`Overdrive { trait, niveau }`) et seuls les effets « +1 réussite » et
  les bonus de stats dérivées (+1/niveau) sont exploités. Les paliers à
  effets de règle (ex. OD Force = +3 dégâts chacun, OD Endurance niv 3 =
  +6 PS en armure, OD Hargne niv 3 = ne meurt pas à 0 PS…) ne sont PAS
  automatisés. → annexe « Modules d'OVERDRIVE »
- **Améliorations d'armes à distance** (18, PG 10-30) : type
  `WeaponUpgrade` défini, aucune donnée ni UI.
- **Grenades intelligentes** : seul le profil shrapnel est codé (flashbang,
  IEM, anti-blindage, explosive manquants).
- **Nods** (soin/armure/énergie, 3D6 restaurés) : compteur d'équipement de
  mission affiché, aucune action d'usage.
- **Véhicules** (p.447+) : hors scope (non extraits du digest).

## 4. Mécaniques de jeu non implémentées (itération 1 : feuille en jeu)

- **Tableau des blessures aléatoires (p.91)** : pas de tirage 2D6 ni
  d'application automatique des malus (les blessures sont ajoutables à la
  main comme `Condition`).
- **Implant cybernétique (20 PG, −3 PEs) / thérapie (100 PG, p.91)** :
  pas d'actions dédiées ; le retrait de condition est manuel.
- **Test d'espoir (p.96)** : pas d'automatisation du −1D6 PEs sur échec.
- **Héroïsme (p.96-97)** : les 5 usages (ignorer agonie, relance, dégâts max,
  combo supplémentaire) et les **Cartes du Destin** (3 points) ne sont pas
  câblés — la jauge +/− existe seule.
- **Points de contact (p.95)** : calculés mais pas de gestion de dépense
  par lieu (1/2/3/4/6 pts) ni de récupération entre missions.
- **Initiative en phase de conflit (p.86)** : pas de tracker (3D6 + score,
  embuscade +10, bandes à initiative 1, retarder son tour).
- **Dégâts environnementaux (p.92)** : chute, feu, noyade (20 × Endurance s),
  gaz/poisons, accidents de véhicule — rien d'automatisé.
- **Côté PNJ** : bandes (cohésion/débordement), salopards, patrons, colosses,
  points faibles, boucliers — le flag `colosse` existe dans `applyDamage`
  (tranches de 10) mais aucune UI de PNJ. Cibles long terme.
- **Styles à effets de dés** (akimbo cumul, pilonnage +1D6/tour, puissant
  sacrifice de dés…) : les styles ne portent que les modificateurs de stats
  (défense/réaction) ; les mécaniques de dés sont MJ/manuels.
- **Dégâts des armes avec OD** (annexe) : « +Force » est affiché mais les
  OD de Force (+3 chacun) et les autres OD (+1) ne sont pas ajoutés
  automatiquement aux dégâts de contact.

## 5. Schéma / technique

- **`migrate()` du persist** : vide — première migration à écrire au
  prochain breaking change du schéma (`knight-sheet-v1`). →
  `src/store/characterStore.ts`
- **`coutActivationPE()`** : parsing par premier entier ; à remplacer par
  un champ structuré `coutPEActivation` / `coutPEUsage` quand les coûts
  composés seront gérés.
- **Équipement multi-mains** : `equiperArme` ne gère pas la contrainte
  deux-mains/deux-armes (akimbo/ambidextre vérifient les armes réellement
  en main — FAQ p.453) ni les armes slotées « considérées en main ».
- **Export/import de personnage** : `remplacerPersonnage` existe, pas d'UI.

---
*Généré pour l'itération 1 (Paladin, feuille en jeu). Chaque point cité
peut être fermé en ajoutant la donnée/l'action correspondante + un test.*
