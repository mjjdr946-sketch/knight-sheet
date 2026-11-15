/**
 * Moteur — mécanique de dés, règles p.76-78 (spécification validée par NunnuN) :
 * - Nombre de dés = score de la caractéristique de base + celle du combo
 *   (ex. Déplacement 4 + Force 3 = 7 dés)
 * - Réussite = face PAIRE (2, 4, 6) par dé — 50 % par dé
 * - Toucher = réussites STRICTEMENT supérieures à la défense (contact) ou
 *   la réaction (tir) de la cible (règle p.86)
 * - Overdrives = réussites automatiques ajoutées
 * - Exploit = tous les dés pairs → relance ; échec critique = tous impairs
 * Fonctions pures : le générateur aléatoire est injectable (tests déterministes).
 */

/** Génère n dés à 6 faces via le générateur injecté (Math.random par défaut) */
export function lancerDes(n: number, rand: () => number = Math.random): number[] {
  const des: number[] = [];
  for (let i = 0; i < Math.max(0, n); i++) {
    des.push(1 + Math.floor(rand() * 6));
  }
  return des;
}

/** Réussite = face paire (2, 4, 6) — 50 % par dé (règle p.76-78) */
export function estReussite(de: number): boolean {
  return de % 2 === 0;
}

/** Compte les réussites (dés pairs) */
export function compterReussites(des: number[]): number {
  return des.filter(estReussite).length;
}

/** Exploit : tous les dés sont pairs (≥ 1 dé) — donne droit à une relance (p.77) */
export function estExploit(des: number[]): boolean {
  return des.length > 0 && des.every(estReussite);
}

/** Échec critique : tous les dés sont impairs (≥ 1 dé) (p.77) */
export function estEchecCritique(des: number[]): boolean {
  return des.length > 0 && des.every((d) => !estReussite(d));
}

/** Toucher : réussites strictement supérieures au seuil (défense/réaction — p.86) */
export function touche(reussites: number, seuil: number): boolean {
  return reussites > seuil;
}

export interface JetComplet {
  des: number[];
  reussites: number;
  /** réussites automatiques des overdrives (ajoutées aux dés) */
  reussitesAuto: number;
  /** réussites totales = dés + auto */
  total: number;
  exploit: boolean;
  echecCritique: boolean;
}

/** Jet complet : lance n dés, ajoute les réussites automatiques, détecte exploit/critique */
export function jetComplet(n: number, reussitesAuto: number, rand: () => number = Math.random): JetComplet {
  const des = lancerDes(n, rand);
  const reussites = compterReussites(des);
  return {
    des,
    reussites,
    reussitesAuto,
    total: reussites + reussitesAuto,
    exploit: estExploit(des),
    echecCritique: estEchecCritique(des),
  };
}

/**
 * Exploit (p.77) : relance de tous les dés — le résultat de la relance est
 * conservé. RÈGLES: à compléter — si la relance est elle-même un exploit,
 * le livre ne précise pas si elle se rejoue en cascade (une seule relance
 * appliquée ici, à trancher avec le livre papier).
 */
export function relanceExploit(desPrecedents: number[], rand: () => number = Math.random): JetComplet {
  const relance = lancerDes(desPrecedents.length, rand);
  const reussites = compterReussites(relance);
  return {
    des: relance,
    reussites,
    reussitesAuto: 0,
    total: reussites,
    exploit: estExploit(relance),
    echecCritique: estEchecCritique(relance),
  };
}

/** Jet de dégâts : n D6 + bonus fixe (règle p.89 ; la moyenne basse du livre peut remplacer le jet) */
export function jetDegats(nombreDes: number, bonus: number, rand: () => number = Math.random): { des: number[]; total: number } {
  const des = lancerDes(nombreDes, rand);
  return { des, total: des.reduce((a, b) => a + b, 0) + Math.max(0, bonus) };
}
