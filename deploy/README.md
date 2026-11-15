# Déploiement Knight Sheet (stack Docker `knight`)

App Next.js 14 **100 % front** (état en `localStorage`) : pas de base, pas de
volume, pas de sauvegarde côté serveur. Le Dockerfile, le compose et ce dossier
`deploy/` sont **versionnés dans le dépôt** ; seul `.env` reste local (gitignoré).

## Modèle

Même modèle que Biblio, mais en stack **autonome** : projet compose `knight`,
image `knight-sheet:<sha>`, conteneur `knight-app`, port `127.0.0.1:8011`.
Aucun partage de réseau, de volume ou de compose avec biblio/honcho/foundry.

| Élément | Valeur |
|---|---|
| Source | `https://github.com/mjjdr946-sketch/knight-sheet` (public) |
| Répertoire serveur | `/opt/knight` |
| Port hôte | `${KNIGHT_PORT:-8011}` sur `127.0.0.1` only |
| Port conteneur | `3000` |
| Image | `node:20-alpine`, multi-stage, `output: 'standalone'`, non-root |
| TLS | Caddy **système** (mode `host`) ou conteneur `knight-caddy` (mode `bundled`) |

## Installation initiale

```bash
git clone https://github.com/mjjdr946-sketch/knight-sheet.git /opt/knight
cd /opt/knight
cp .env.example .env && chmod 600 .env
./deploy/deploy.sh                        # origin/main
```

Puis, pour HTTPS via le Caddy système :

```bash
cp -a /etc/caddy/Caddyfile /etc/caddy/Caddyfile.bak.$(date +%Y%m%d-%H%M%S)
cat deploy/caddy-host.conf >> /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
systemctl reload caddy
```

Le DNS (`knight-nunnun.duckdns.org`) doit résoudre **avant** le reload, sinon
Let's Encrypt échoue et Caddy retente avec backoff.

## Mise à jour (itération suivante)

```bash
cd /opt/knight && ./deploy/deploy.sh            # dernière origin/main
cd /opt/knight && ./deploy/deploy.sh <sha>      # commit précis
```

Rollback = redéployer le SHA précédent (les images restent taguées par SHA).

## Accès protégé (mot de passe, itération 4)

Le site est fermé par un middleware Next.js qui compare à `SHEET_PASSWORD`.

> ⚠️ **Correction après vérification sur le VPS** : le brief annonçait une
> variable de **BUILD**. C'est faux pour cette version de Next — testé avec deux
> conteneurs issus de la *même* image :
> - image construite avec le mot de passe, conteneur lancé **sans** variable
>   → page protégée en **200** : le site est **complètement ouvert** (fail-open) ;
> - conteneur lancé avec une autre valeur → seule la valeur **runtime** est
>   acceptée (401 avec celle du build).
>
> Conséquence : `SHEET_PASSWORD` est injectée **à l'exécution** par Compose
> (`${SHEET_PASSWORD:?…}` → `docker compose up` échoue si elle manque). Le secret
> de build reste en place (défense en profondeur + garde-fou : pas d'image sans
> secret), mais il n'est pas ce qui protège le site.

- Le mot de passe vit **uniquement** dans `/opt/knight/.env` (mode 600, root).
  `deploy.sh` l'écrit aussi dans `.sheet_password` (600, ignoré par git et par le
  contexte Docker) monté comme **secret BuildKit** le temps du build, puis
  supprimé.
- Il est donc présent dans la configuration du conteneur (`docker inspect` →
  `Config.Env`), comme `BIBLIO_TOKEN` pour Biblio : lisible par root sur l'hôte
  uniquement, jamais dans l'image ni dans le dépôt. C'est le prix d'un secret
  runtime lu par le middleware.
- `deploy.sh` vérifie explicitement que la variable est **présente dans le
  conteneur** (`docker exec knight-app sh -c '[ -n "$SHEET_PASSWORD" ]'`) : c'est
  le contrôle qui empêche le scénario fail-open.
- **Fail-closed** : sans `SHEET_PASSWORD` (ou < 16 caractères) `deploy.sh`
  s'arrête, Compose refuse de démarrer (`${SHEET_PASSWORD:?}`), et le build
  échoue si le secret manque.
- `deploy.sh` vérifie à chaque déploiement : `/login` → 200, page protégée sans
  cookie → 3xx, mauvais mot de passe → 401, bon mot de passe → cookie
  (`HttpOnly` + `Secure`) puis page protégée → 200, et le même parcours de bout
  en bout **à travers Caddy** en HTTPS.
- Session : cookie `sheet-auth`, 30 jours. **Le cookie contient le mot de passe
  en clair** (choix du dev) : en cas de fuite du cookie, le secret est exposé —
  à remplacer par un HMAC dérivé côté serveur (proposé à l'itération suivante).

```bash
# lire le mot de passe (ne jamais le coller dans un chat)
ssh biblio-vps 'grep ^SHEET_PASSWORD= /opt/knight/.env | cut -d= -f2-'
# le changer : éditer .env puis redéployer (rebuild obligatoire)
ssh biblio-vps 'cd /opt/knight && ./deploy/deploy.sh'
```

## Mode TLS `bundled`

`KNIGHT_TLS_MODE=bundled` démarre `knight-caddy` (profil `tls`) sur
`127.0.0.1:8080/8443` — 80/443 étant tenus par le Caddy système. Utile pour
rendre la stack portable sur une machine où 80/443 sont libres (alors mettre
`KNIGHT_CADDY_BIND_IP=0.0.0.0` et 80/443).

## Exploitation

```bash
docker logs -f knight-app            # logs (json-file, 5 × 10 Mo)
docker inspect -f '{{.State.Health.Status}}' knight-app
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8011/
docker compose down                  # arrêt (aucune donnée à perdre)
```

⚠️ Ne jamais lancer un second Caddy conteneurisé sur 80/443 sur ce VPS :
conflit avec le Caddy système qui sert foundry-nunnun / biblio-nunnun.

## Notes

- `next.config.mjs` porte `output: 'standalone'` (ajouté par devops) ; le
  Dockerfile **échoue** s'il manque et `deploy.sh` le réajoute au besoin.
- `deploy.sh` refuse de travailler sur un arbre sale après reset et ne fait
  jamais `down -v` ni `prune`.