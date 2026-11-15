/**
 * Les 22 lames du tarot — étape 3 de création (règles pp.114-122).
 * Bonus standard : 1 point d'aspect + 3 points à répartir dans les
 * caractéristiques liées, sauf mention contraire (Maison-Dieu : 2 aspects
 * libres ; Fou : 6 points de caractéristiques, sans aspect).
 * Incompatibilité de tirage aléatoire : Arcane sans nom ↔ Maison-Dieu.
 */
export interface Lame {
  numero: string;
  nom: string;
  aspect: string | null; // 'Chair' | 'Bête' | 'Machine' | 'Dame' | 'Masque' | null
  avantage: string;
  inconvénient: string;
}

export const LAMES_TAROT: Lame[] = [
  { numero: 'I', nom: 'Le Bateleur', aspect: 'Dame', avantage: 'Infatigable : pas de PS perdus pour dégâts à l\u2019armure (1 PS/tranche de 5 PA)', inconvénient: 'Colérique : −3 dés aux tests Sang-Froid pour se calmer' },
  { numero: 'II', nom: 'La Papesse', aspect: 'Masque', avantage: 'Connaissance secrète : difficulté −1 sur jets Savoir d\u2019un type de connaissance choisi', inconvénient: 'Curiosité maladive : 1×/séance, le MJ impose un intérêt (1D6 h)' },
  { numero: 'III', nom: 'L\u2019Impératrice', aspect: 'Machine', avantage: 'Mémoire efficace : 1×/séance, demander un savoir au MJ', inconvénient: 'Esprit de contradiction : contredire tout argument douteux 1×/partie' },
  { numero: 'IV', nom: 'L\u2019Empereur', aspect: 'Dame', avantage: 'Magnétique : +1 réussite auto. sur jets base Aura avec humains', inconvénient: 'Présomptueux : vantard, s\u2019attaque à plus fort (MJ)' },
  { numero: 'V', nom: 'Le Pape', aspect: 'Machine', avantage: 'Forteresse spirituelle : +5 points d\u2019espoir (total)', inconvénient: 'Fanatique : roleplay (obtus, prosélyte)' },
  { numero: 'VI', nom: 'L\u2019Amoureux', aspect: 'Bête', avantage: 'Aisance : ignore l\u2019effet lourd des armes (à tenir à 2 mains quand même)', inconvénient: 'Graveleux : difficulté +1 sur Parole/Aura de séduction' },
  { numero: 'VII', nom: 'Le Chariot', aspect: 'Bête', avantage: 'Sûr de soi : +1 réussite auto. sur jets base Parole avec humains', inconvénient: 'Ennemi juré : un puissant ennemi dans une organisation rivale' },
  { numero: 'VIII', nom: 'La Justice', aspect: 'Machine', avantage: 'Bon sens : +1 réussite auto. contre manipulation ; échec critique → échec normal', inconvénient: 'Trop prudent : initiative sur 2D6 au lieu de 3D6' },
  { numero: 'IX', nom: 'L\u2019Ermite', aspect: 'Machine', avantage: 'Esprit d\u2019acier : −1 point d\u2019espoir perdu (toutes sources)', inconvénient: 'Solitaire : difficulté +1 quand il participe à un test d\u2019aide' },
  { numero: 'X', nom: 'La Roue-de-Fortune', aspect: 'Bête', avantage: 'Chanceux : 1×/partie, relancer gratuitement tous les dés d\u2019un test raté', inconvénient: 'Mauvaises intuitions : 1×/partie, le MJ fait échouer un test Instinct/Perception' },
  { numero: 'XI', nom: 'La Force', aspect: 'Chair', avantage: 'Dur à cuir : +5 points de santé (total)', inconvénient: 'Forcené : 1×/partie, attaque obligatoire si l\u2019équipe tergiverse' },
  { numero: 'XII', nom: 'Le Pendu', aspect: 'Chair', avantage: 'Code moral : motivation mineure « respect du code »', inconvénient: 'Sacrifice total : pas de motivation majeure' },
  { numero: 'XIII', nom: 'L\u2019Arcane sans nom (la Mort)', aspect: 'Masque', avantage: 'Trompe la mort : à l\u2019agonie, ignore « mort » sur la table des blessures (1×/mission)', inconvénient: 'Vétéran : 50 ans et +, aspects plafonnés à 7' },
  { numero: 'XIV', nom: 'La Tempérance', aspect: 'Chair', avantage: 'Guérison rapide : récupération de PS ×2 rapide ; +3 PS soignés (soins, nanoM, nods)', inconvénient: 'Immunité déficiente : maladies/poisons = dégâts automatiquement maximaux' },
  { numero: 'XV', nom: 'Le Diable', aspect: 'Bête', avantage: 'Instinct animal : +10 initiative en embuscade ; garde défense/réaction en attaque surprise/dos', inconvénient: 'Brute : Machine plafonnée à 5' },
  { numero: 'XVI', nom: 'La Maison-Dieu', aspect: null, avantage: 'Soif d\u2019apprendre : 1×/partie à Camelot, apprendre d\u2019un PJ : +1 carac. pour XP ÷2', inconvénient: 'Amnésique : passé secret écrit par le MJ, avantages choisis par lui' },
  { numero: 'XVII', nom: 'L\u2019Étoile', aspect: 'Masque', avantage: 'Rêves prémonitoires : 1×/partie, indice sibyllin du MJ pendant le sommeil', inconvénient: 'Cauchemars : 1D6 en dormant ; impair = 0 PS récupéré et −1 PEs' },
  { numero: 'XVIII', nom: 'La Lune', aspect: 'Masque', avantage: 'Menteur professionnel : difficulté −1 sur jet Parole combo Discrétion', inconvénient: 'Lunatique : 1×/partie, humeur imposée par le MJ' },
  { numero: 'XIX', nom: 'Le Soleil', aspect: 'Dame', avantage: 'Rayonnement : les PJ qui l\u2019aident gagnent +1 dé (même en mode héroïque)', inconvénient: 'Égoïste : jamais adjuvant en mode héroïque (mais agit normalement)' },
  { numero: 'XX', nom: 'Le Jugement', aspect: 'Dame', avantage: 'Empathie : +1 réussite auto. base Instinct pour déceler les émotions, ignore les échecs critiques', inconvénient: 'Prisonnier : micro-explosif Tarasque ; motivation majeure « Retrouver la liberté » bloque PEs' },
  { numero: 'XXI', nom: 'Le Monde', aspect: 'Chair', avantage: 'Créateur-né : motivation mineure « Réaliser une œuvre »', inconvénient: 'Porte-malheur : 1×/partie, le MJ transforme un test raté en échec critique (cumulable entre PJ)' },
  { numero: '—', nom: 'Le Fou', aspect: null, avantage: 'Chevalier véritable : mode héroïque dès 4 points d\u2019héroïsme (max 6) ; tout acte malveillant = −1 héroïsme', inconvénient: 'Trou mental : phobie ou trouble compulsif (roleplay, malus possible)' },
];
