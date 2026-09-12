// Cadence des animations en boucle.
//
// Les cadres d'attente d'un champion font souvent PIVOTER le personnage : sur
// les feuilles de Lelianna et d'Hicho, les derniers cadres de l'idle les
// montrent de dos. Rejouée du premier au dernier puis reprise au premier, une
// telle série fait tourner le champion en rond sans fin, avec un saut sec au
// bouclage.
//
// En aller-retour, la série se referme sur elle-même : le personnage tourne
// d'un côté, puis revient. Une rotation devient un balancement, et il n'y a
// plus de saut — le dernier cadre joué est toujours voisin du suivant.
export const allerRetour=cadres=>
  !Array.isArray(cadres)||cadres.length<3
    ? (cadres||[])
    // On ne répète NI le premier NI le dernier cadre : les rejouer marquerait
    // un temps d'arrêt aux deux extrémités du balancement.
    : [...cadres,...cadres.slice(1,-1).reverse()];

// Combien de cadres d'attente employer réellement.
//
// Sur les feuilles reçues, la rangée « Idle » n'est pas une boucle d'attente :
// c'est un TOUR DE PRÉSENTATION — face, trois-quarts, dos. Jouée en entier,
// elle fait pivoter le champion sans fin, dos à l'ennemi une fois sur deux.
// `attente` permet de n'en garder que les premières poses, celles de face.
// Sans valeur, on garde tout : c'est à l'auteur de la feuille de trancher.
export const cadresAttente=(cadres,attente)=>{
  if(!Array.isArray(cadres))return[];
  const n=Number(attente);
  return n>0?cadres.slice(0,Math.min(n,cadres.length)):cadres;
};

// Les animations qui se jouent une fois — frappe, sort, mort — gardent leur
// sens de lecture : un coup d'épée qui revient en arrière n'a aucun sens.
export const BOUCLEES=['repos','marche'];
export const enBoucle=nom=>BOUCLEES.includes(nom);
