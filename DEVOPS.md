# Devops — Knight Sheet (itération 10)

## Variables d'environnement

| Variable | Rôle | Défaut |
|---|---|---|
| `SHEET_PASSWORD` | Sas d'entrée (login) + dérive le secret HMAC des sessions | — (obligatoire en prod) |
| `KNIGHT_DB_PATH` | Chemin du fichier SQLite | `/data/knight.db` (volume Docker) |

## Base de données

- SQLite (`better-sqlite3`), fichier unique + WAL. **Monté en volume Docker** :
  `docker run -v knight-data:/data ...` (ou bind mount).
- Schéma versionné : table `schema_version` (v1). Migration = incrémenter
  `migrer()` dans `src/lib/db.ts`.
- Tables : `accounts` (seed automatique des 4 comptes au premier lancement :
  nuncyco=`mj`, bigboy/xcypher/albatar=`joueur`), `chevaliers` (JSON de fiche
  versionné + accountId), `adversaires`, `sessions_combat` (par compte).

## Sauvegarde / restauration

```bash
# sauvegarde
docker exec knight-app cp /data/knight.db /data/knight.db.bak
# ou à froid (recette) : copier le volume
docker run --rm -v knight-data:/data -v $PWD:/backup alpine cp /data/knight.db /backup/

# restauration : replacer le fichier dans le volume puis redémarrer
```

## localStorage

Plus aucune source de vérité depuis l'itération 10 : il ne garde que les
préférences UI (`knight-cinematique`, `knight-compte`). Les fiches vivent en
SQLite ; export/import JSON reste disponible en secours (page Identité).

## Routes API

| Route | Description |
|---|---|
| `POST /api/login` | Sas : mot de passe → cookie HMAC |
| `GET/POST /api/comptes` | Liste / sélection de compte (cookie re-signé avec accountId) |
| `GET/PUT/DELETE /api/chevaliers` | CRUD fiches (garde scellement vérifiée côté API — 403 si édition interdite) |
| `PUT/GET /api/session` | Session de combat par compte (historique persisté) |
| `POST /api/logout` | Purge du cookie HMAC → retour au sas |

## À venir (it. 10 lot 6+)

- Migration réelle localStorage → serveur au premier login (import JSON proposé).
- Sauvegarde de la session de combat (debounce) + adversaires.
- ` Necromancer/Sarcophage` + générateur d'arme de prestige.


## Recette standard de déploiement (8 points — prompt v13 §2)

1. Login → « Qui joue ? » → l'accueil n'affiche que LES fiches du compte.
2. Écriture (PS −1) visible dans `GET /api/chevaliers?accountId=X`.
3. Recharge (F5) → état revenu du serveur.
4. Rebuild `deploy.sh` → fiche survit (volume).
5. Session de combat persistée (`sessions_combat`) — historique après reload.
6. Isolation : compte A ne voit jamais les fiches de B.
7. Bandeau « non sauvegardé » sur coupure API.
8. `./backup.sh` → `integrity ok`.


## Traçabilité « toute écriture → API » (prompt v15 §0)

Principe : un **subscriber unique** (`src/lib/sync.ts`, branché au montage du
layout) écoute TOUTE mutation du store et pousse :
- la **fiche active** → `PUT /api/chevaliers` (debounce 800 ms) ;
- la **session de combat** → `PUT /api/session` (debounce 300 ms).

Toutes les actions passent donc par l'API, y compris : création wizard
(`ajouterFiche`), achats d'équipement (`configurerLongbow`, `ajouterArme`),
capacités (`activerTypeWarrior`, `basculerGhost`, `utiliserImpulsion`,
`utiliserCapacitePE`, `reparerPA`, `activerGoliath`), XP (`ajouterXP`),
scellement/déverrouillage, jauges, dégâts, adversaire (via l'état de session).
Le générateur d'identité (fiche neuve `ajouterFiche`) est couvert par le même
subscriber dès l'ajout.

Vérification recette : créer un chevalier complet au wizard → `GET
/api/chevaliers?accountId=X` contient la fiche enrichie (armes, modules, XP).


## Backup GitHub hors site (prompt v16 §7)

1. Créer le repo privé : `curl -X POST -H "Authorization: Bearer $TOKEN" https://api.github.com/user/repos -d '{"name":"knight-sheet-backups","private":true}'`
2. Token : PAT fine-grained, scope `contents:write` sur CE repo uniquement — rotation périodique, jamais commité.
3. `deploy/backup-github.sh` : après `backup.sh`, push du snapshot daté (`knight-YYYYMMDD-HHMM.db`).
4. Cron quotidien à la suite du backup 03:30 : `30 3 * * * /opt/knight/backup.sh && /opt/knight/deploy/backup-github.sh /data/knight.db`
5. Rétention : historique de commits du repo (revert = restaurer un snapshot).


## Remise à plat (itération 17 — prompt v19)

**L'IA DevOps lancera elle-même le script** lors du déploiement de cette
version — aucune action manuelle de NunnuN :

1. Déployer la nouvelle version (le fichier `scripts/reset-db.mjs` est dans
   le repo).
2. **Lancer le reset** :
   ```bash
   node /opt/knight/scripts/reset-db.mjs /data/knight.db
   ```
   → RESET COMPLET : vide `chevaliers` / `adversaires` / `sessions_combat`
   ET `accounts` (zéro chevalier, zéro compte — on reprend réellement à
   zéro). Les comptes sont créés par les joueurs sur « Qui joue ? »
   (libre-service).
3. Redémarrer le conteneur.
4. Vérifier : au premier chargement, la modale « 🛠 Mise à jour effectuée »
   purge le localStorage (acquittement versionné `knight-migration-ack` —
   elle ne revient PAS au rechargement suivant) ; « Qui joue ? » affiche
   « Aucun compte encore — crée le tien » (0 compte en base).
5. Recette des 8 points de persistance à rejouer sur la base propre.

Compte-rendu attendu de DevOps : sortie du script (compte des lignes
supprimées par table), confirmation du redémarrage, résultat de la recette.


## Signature exacte de `DELETE /api/chevaliers` (recette, scripts)

Le `DELETE` lit les paramètres en **QUERY STRING** — un body (même
`{accountId, ficheId}`) renvoie **400 « paramètres manquants »** :

```bash
# OK — query string :
curl -X DELETE "https://<host>/api/chevaliers?accountId=<accountId>&id=<ficheId>"
# → {"ok":true}

# KO — body ignoré (message « paramètres manquants », 400) :
curl -X DELETE "https://<host>/api/chevaliers" -d '{"accountId":"…","ficheId":"…"}'
```

- `accountId` = id du compte propriétaire (isolation vérifiée côté API) ;
- `id` = **id de la fiche** (le champ `ficheId` n'existe pas dans la route).
Scripts de recette : utiliser la forme query string.

# Audit de câblage action UI → store → endpoint (IT. 21 §1, prompt v21-22)

Chaque ligne est prouvée par la garde de source des tests (315 tests) et par
les E2E Playwright (7 specs). Toute action passe par le subscriber sync
(`brancherSync()` dans le layout) qui pousse en PUT avec debounce 800 ms —
le bandeau « non sauvegardé » n’apparaît QUE sur un statut != 2xx ou une
exception (IT. 21 mise en garde 2 — le faux positif venait de la garde
scellement en liste POSITIVE, remplacée par la liste INVERSE
`CHAMPS_STRUCTURELS` : tout champ hors identité de création est de jeu).

- `activerCapacite` — Feuille — Capacités de classe → store + engine → PUT via sync (jauges)
- `activerModule` — Équipement › Mon armure — activer/désactiver → store (débit PE) → PUT via sync (modules/jauges)
- `ajouterXP` — Feuille — Ajouter des XP → store (paliers 150/200/250) → PUT via sync (gloire/xpJournal)
- `basculerArmure` — Combat — Déployer / Replier Guardian, Shrine, Watchtower → store + PUT via sync → PUT /api/chevaliers (armureDeployee)
- `basculerFavori` — Dés / Combat — ★ favoris → store → PUT via sync (fiche)
- `changerArmure` — Méta-armure — changement à la volée → store (classe suit la méta-armure, IT. 20) → PUT via sync (metaArmor/classe)
- `chargerFiche` — Accueil / Feuille → store → PUT via sync
- `declarerStyle` — Combat — postures → store → PUT via sync (conditions)
- `depenserContacts` — Attributs — dépense de contacts → store → PUT via sync (session)
- `depenserPEUsage` — Combat / Feuille — capacités → store → PUT via sync (jauges)
- `desinstallerModule` — Méta-armure — retirer un module → store → PUT via sync (modules)
- `deverrouiller` — Feuille — 🔓 Déverrouiller (modale custom IT. 21) → store (scelle: false) → PUT via sync (scelle)
- `dupliquerFiche` — Accueil — carte chevalier → store (persist + PUT via sync) → PUT /api/chevaliers
- `frapperAdversaire` — Combat — attaque → store + engine → PUT via sync (fiche + session)
- `installerModule` — Méta-armure — installer un module → store (slots vérifiés) → PUT via sync (modules)
- `journaliserJet` — Combat — chaque jet → store → PUT via sync (session)
- `memoriserOpposition` — Combat — opposition → store → PUT via sync (session)
- `monterAspect` — Attributs — liste déroulante aspect (IT. 21 §4/§5) → store (débit gloire + journal) → PUT via sync (aspects/gloire/xpJournal)
- `monterTrait` — Attributs — liste déroulante trait (IT. 21 §5) → store (débit gloire + journal) → PUT via sync (traits/gloire/xpJournal)
- `passerAuTourSuivant` — Combat — Tour suivant → store → PUT via sync (session)
- `payerMaintenanceShrine` — Combat — maintenance Shrine → store → PUT via sync (jauges)
- `poserImplant` — Identité — poser un implant → store → PUT via sync (conditions)
- `remplacerPersonnage` — Accueil / layout (chargement serveur) → store → —
- `resetCombat` — Combat — Reset combat → store → PUT via sync (session)
- `setChoixDerive` — Attributs — valeurs dérivées au choix → store → PUT via sync (choixDerivees)
- `subirDegats` — Combat — Encaisser → store → PUT via sync (jauges/conditions)
- `supprimerFiche` — Accueil — carte chevalier → store + DELETE via sync → DELETE /api/chevaliers?accountId&id
- `testerEspoir` — Combat — Test d’espoir → store → PUT via sync (jauges/PEs)
- `tirerBlessureAgonie` — Combat — blessures → store → PUT via sync (conditions)
- `utiliserHeroisme` — Header — Héroïsme → store → PUT via sync (jauges)
