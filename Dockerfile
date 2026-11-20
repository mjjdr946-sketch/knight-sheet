# syntax=docker/dockerfile:1
# Knight Sheet — image de production (Next.js 14, output: 'standalone').
# L'app est 100 % front : aucune donnée serveur, l'état vit dans le localStorage.
FROM node:20-alpine AS deps
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
# --ignore-scripts : better-sqlite3 (it. 10) déclenche sinon un `node-gyp rebuild`
# (pas de toolchain en alpine). Le paquet embarque ses binaires N-API dans
# `prebuilds/` — dont linuxmusl-x64 pour cette image — chargés à l'exécution.
RUN npm ci --no-audit --no-fund --ignore-scripts

FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ARG GIT_SHA=dev
LABEL org.opencontainers.image.title="knight-sheet" \
      org.opencontainers.image.revision="${GIT_SHA}"
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Mot de passe d'accès (it. 4) : Next l'inline dans le middleware AU BUILD.
# Il est fourni par un SECRET BuildKit (jamais un ARG/ENV) → absent de
# l'historique, des métadonnées et de `docker inspect`. Le build ÉCHOUE si le
# secret est absent ou vide : impossible de produire une image sans mot de passe.
# 'output: standalone' est requis ; deploy.sh le garantit dans next.config.mjs.
# Cache-buster : un secret BuildKit n'invalide PAS le cache de build, donc
# changer le mot de passe ne reconstruirait rien (image à l'ancien secret).
# On passe le sha256 du mot de passe (pas le secret) pour casser le cache.
ARG SHEET_PASSWORD_HASH=dev
RUN --mount=type=secret,id=sheet_password,required=true \
    set -eux; \
    echo "secret hash: ${SHEET_PASSWORD_HASH:0:12}"; \
    test -s /run/secrets/sheet_password || { echo "❌ secret sheet_password absent ou vide" >&2; exit 1; }; \
    if [ ! -d public ]; then mkdir -p public; fi; \
    grep -q "standalone" next.config.mjs || { echo "❌ next.config.mjs sans output:'standalone'" >&2; exit 1; }; \
    SHEET_PASSWORD="$(cat /run/secrets/sheet_password)" npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
# Utilisateur non-root fourni par l'image (uid 1000).
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
# Données (it. 10) : SQLite dans /data. Le dossier est créé ICI avec le
# propriétaire `node` : un volume nommé monté sur un chemin inexistant naîtrait
# en root et le conteneur non-root ne pourrait pas écrire la base.
RUN mkdir -p /data && chown -R node:node /data
VOLUME ["/data"]
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.status<500?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]