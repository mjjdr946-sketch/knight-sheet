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

Le site est fermé par un middleware Next.js qui compare au **secret de build**
`SHEET_PASSWORD` (inliné dans le middleware par Next — ce n'est pas une variable
runtime : la changer exige un rebuild).

- Le mot de passe vit **uniquement** dans `/opt/knight/.env` (mode 600). Il n'est
  jamais passé en `--build-arg` : `deploy.sh` l'écrit dans `.sheet_password`
  (600, ignoré par git et par le contexte Docker), Compose le monte comme
  **secret BuildKit**, et le fichier est supprimé à la fin du script.
  → il n'apparaît ni dans `docker history`, ni dans `docker inspect`, ni dans
  les labels de l'image.
- **Fail-closed** : sans `SHEET_PASSWORD` (ou < 16 caractères) `deploy.sh`
  s'arrête, et le `Dockerfile` échoue si le secret manque. Une image sans mot de
  passe ne peut pas être produite par erreur.
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