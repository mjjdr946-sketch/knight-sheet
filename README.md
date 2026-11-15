# Knight — Feuille de personnage

Application web mobile-first : feuille de personnage interactive et
assistant de calcul pour le JDR **Knight** (Antre Monde Éditions).
Itération 1 = Paladin ; architecture générique multi-classes.

## Stack

Next.js 14 (App Router) · TypeScript strict · Tailwind CSS · Zustand (persist
localStorage) · Framer Motion · Vitest.

## Démarrage

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # suite Vitest
npm run build      # build production
```

## Accès protégé (prompt v6 §5)

Un mot de passe unique partagé protège l'app via un middleware Next.js
(`middleware.ts`). Définir la variable d'environnement **au build** :

```bash
SHEET_PASSWORD="votre-secret" npm run build
```

- Si `SHEET_PASSWORD` n'est pas défini (dev local), l'accès est libre.
- Le cookie de session (`sheet-auth`, httpOnly) dure 30 jours.
- Aucune donnée de personnage ne transite côté serveur (tout reste en
  localStorage du navigateur) → pas de comptes utilisateurs, un secret
  partagé suffit pour un usage personnel.
- Message d'échec volontairement générique (« Accès refusé »).

## Déploiement (Docker, VPS)

Voir `deploy/` (stack Docker `knight`, Caddy, `deploy.sh`). Penser à
passer `SHEET_PASSWORD` comme build-arg / variable d'environnement du
conteneur.

## Architecture

- `src/types/` — modèle générique (`Modifier` = pivot multi-classes)
- `src/engine/` — fonctions pures testées (stats, dégâts, dés, attaque,
  héroïsme, blessures, équipement) ; aucune dépendance React
- `src/data/` — règles extraites du digest (arsenal, tarot, méta-armures…)
- `src/store/` — Zustand persistant (`knight-sheet-v1`, schéma versionné),
  slots de personnages, session de combat
- `app/personnage/` — onglets Combat / Matériel / Attributs / Armure / Identité
- `TODO-RULES.md` — inventaire des placeholders et règles non implémentées

La source de vérité est `knight-rules-reference.md` (digest fourni) :
**aucune règle n'est inventée** — les manques sont des placeholders listés.
