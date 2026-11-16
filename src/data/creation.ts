/**
 * Données de création (assistant, prompt v8) — étapes 2/4/5 du chapitre 5.
 * Sources : digest PARTIE 1 (pp.111-126). Bonus simplifiés : les archétypes à
 * choix Combat/Tir pointent Combat (le MJ peut ajuster).
 */
export interface Archetype { id: string; nom: string; traits: string[]; bonus: string }
export interface HautFait { id: string; nom: string; aspect: string; trait: string; bonus: string }
export interface Blason { id: string; nom: string; voeu: string }

const bonusTrait = (t: string) => `+1 ${t}`;

export const ARCHETYPES: Archetype[] = [
  { id: 'rebut', nom: 'Rebut', traits: ['deplacement', 'endurance'], bonus: '+1 deplacement, +1 endurance' },
  { id: 'citoyen', nom: 'Citoyen', traits: ['technique', 'discretion'], bonus: '+1 technique, +1 discretion' },
  { id: 'territoires-libres', nom: 'Habitant des territoires libres', traits: ['savoir', 'parole'], bonus: '+1 savoir, +1 parole' },
  { id: 'celebrete', nom: 'Célébrité', traits: ['aura', 'parole'], bonus: '+1 aura, +1 parole' },
  { id: 'survivant', nom: 'Survivant', traits: ['endurance', 'hargne'], bonus: '+1 endurance, +1 hargne' },
  { id: 'societe-secrete', nom: 'Membre d’une société secrète', traits: ['savoir'], bonus: '+1 savoir, +1 savoir' },
  { id: 'agent-nodachi', nom: 'Agent du Nodachi', traits: ['combat'], bonus: '+1 combat, +1 combat' },
  { id: 'service-secret', nom: 'Membre d’un service secret', traits: ['combat', 'discretion'], bonus: '+1 combat, +1 discretion' },
  { id: 'genie', nom: 'Génie', traits: ['savoir', 'technique'], bonus: '+1 savoir, +1 technique' },
  { id: 'artiste', nom: 'Artiste', traits: ['hargne', 'aura'], bonus: '+1 hargne, +1 aura' },
  { id: 'independant', nom: 'Indépendant', traits: ['perception', 'instinct'], bonus: '+1 perception, +1 instinct' },
  { id: 'religieux', nom: 'Religieux', traits: ['sangfroid', 'hargne'], bonus: '+1 sangfroid, +1 hargne' },
  { id: 'leader', nom: 'Leader', traits: ['aura', 'instinct'], bonus: '+1 aura, +1 instinct' },
  { id: 'hors-la-loi', nom: 'Hors-la-loi', traits: ['sangfroid', 'discretion'], bonus: '+1 sangfroid, +1 discretion' },
  { id: 'voyageur', nom: 'Voyageur', traits: ['deplacement', 'perception'], bonus: '+1 deplacement, +1 perception' },
  { id: 'combattant', nom: 'Combattant', traits: ['combat', 'tir'], bonus: '+1 combat, +1 tir' },
  { id: 'force-nature', nom: 'Force de la nature', traits: ['force', 'endurance'], bonus: '+1 force, +1 endurance' },
];

export const HAUTS_FATS: HautFait[] = [
  { id: 'combat-titans', nom: 'Combat de titans', aspect: 'chair', trait: 'force', bonus: '+1 chair, +2 pts liés' },
  { id: 'territoire-ennemi', nom: 'En territoire ennemi', aspect: 'bete', trait: 'hargne', bonus: '+1 bete, +2 pts liés' },
  { id: 'peste-rouge', nom: 'Survivant de la peste rouge', aspect: 'chair', trait: 'endurance', bonus: '+1 chair, +2 pts liés' },
  { id: 'torture-tenebres', nom: 'Torturé dans les ténèbres', aspect: 'chair', trait: 'endurance', bonus: '+1 chair, +2 pts liés' },
  { id: 'renouveau-espoir', nom: 'Le renouveau de l’espoir', aspect: 'bete', trait: 'hargne', bonus: '+1 bete, +2 pts liés' },
  { id: 'heros-guerre', nom: 'Héros de guerre', aspect: 'bete', trait: 'combat', bonus: '+1 bete, +2 pts liés' },
  { id: 'premiere-arche', nom: 'Construction de la première arche', aspect: 'machine', trait: 'savoir', bonus: '+1 machine, +2 pts liés' },
  { id: 'meta-armure', nom: 'Conception de la première méta-armure', aspect: 'machine', trait: 'technique', bonus: '+1 machine, +2 pts liés' },
  { id: 'tache-dissimulee', nom: 'Découverte d’une tache dissimulée', aspect: 'masque', trait: 'perception', bonus: '+1 masque, +2 pts liés' },
  { id: 'tueur-tenebres', nom: 'Tueur de ténèbres', aspect: 'masque', trait: 'discretion', bonus: '+1 masque, +2 pts liés' },
  { id: 'guide', nom: 'Guide', aspect: 'dame', trait: 'parole', bonus: '+1 dame, +2 pts liés' },
  { id: 'creation-knight', nom: 'Création du Knight', aspect: 'dame', trait: 'aura', bonus: '+1 dame, +2 pts liés' },
  { id: 'defenseur-art', nom: 'Défenseur de l’art', aspect: 'bete', trait: 'hargne', bonus: '+1 bete, +2 pts liés' },
  { id: 'sauveur', nom: 'Sauveur', aspect: 'masque', trait: 'perception', bonus: '+1 masque, +2 pts liés' },
];

export const BLASONS: Blason[] = [
  { id: 'corbeau', nom: 'Le Corbeau', voeu: 'Participer à la résolution d’un crime' },
  { id: 'taureau', nom: 'Le Taureau', voeu: 'Respecter le code d’honneur du Knight' },
  { id: 'lion', nom: 'Le Lion', voeu: 'Ne jamais fuir un ennemi qui met des innocents en danger' },
  { id: 'dragon', nom: 'Le Dragon', voeu: 'Respecter la loi locale et ne jamais mentir' },
  { id: 'ours', nom: 'L’Ours', voeu: 'Empêcher la mort d’un être humain' },
  { id: 'cerf', nom: 'Le Cerf', voeu: 'Obéir aux ordres des chevaliers et d’Arthur' },
  { id: 'aigle', nom: 'L’Aigle', voeu: 'Faire respecter le code d’honneur' },
  { id: 'sanglier', nom: 'Le Sanglier', voeu: 'Accomplir les objectifs, coûte que coûte' },
  { id: 'serpent', nom: 'Le Serpent', voeu: 'Découvrir les secrets de l’Anathème' },
  { id: 'loup', nom: 'Le Loup', voeu: 'Protéger un chevalier en danger' },
];
