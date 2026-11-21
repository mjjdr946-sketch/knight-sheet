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
