/**
 * Échelle de progression : quinze joueurs réels, du premier combat au plafond.
 *
 * Une première version mesurait la difficulté en multipliant les statistiques
 * d'une équipe de fin de jeu par un coefficient. Fausse route : la puissance
 * d'équipe ne descend pas sous 2 425 quoi qu'on fasse, parce que Vitesse,
 * Précision et Résistance n'y sont pas multipliées. Tout contenu facile
 * répondait donc « il faut 3 200 de puissance » — le plancher de l'instrument,
 * pas une mesure du jeu.
 *
 * On sonde désormais avec de VRAIS joueurs : un niveau, des étoiles, le butin
 * de la zone qu'ils farment. Le résultat se lit alors directement — « il faut
 * en être là », pas « il faut ce nombre ».
 */
export const ECHELLE=[
 {nom:'débuts (n1, 3★)',            zone:1, difficulte:'normal',   niveau:1,  etoiles:3, niveauObjet:0,  competences:1},
 {nom:'zone 1 finie (n10)',         zone:1, difficulte:'normal',   niveau:10, etoiles:3, niveauObjet:0,  competences:1},
 {nom:'zone 2 (n15, 4★)',           zone:2, difficulte:'normal',   niveau:15, etoiles:4, niveauObjet:0,  competences:1},
 {nom:'zone 3 (n20, +3)',           zone:3, difficulte:'normal',   niveau:20, etoiles:4, niveauObjet:3,  competences:2},
 {nom:'zone 4 (n25, +3)',           zone:4, difficulte:'normal',   niveau:25, etoiles:4, niveauObjet:3,  competences:2},
 {nom:'zone 5 (n30, +6)',           zone:5, difficulte:'normal',   niveau:30, etoiles:4, niveauObjet:6,  competences:3},
 {nom:'zone 6 (n35, 5★, +6)',       zone:6, difficulte:'normal',   niveau:35, etoiles:5, niveauObjet:6,  competences:3},
 {nom:'zone 7 (n40, +9)',           zone:7, difficulte:'normal',   niveau:40, etoiles:5, niveauObjet:9,  competences:4},
 {nom:'zone 8 (n45, +9)',           zone:8, difficulte:'normal',   niveau:45, etoiles:5, niveauObjet:9,  competences:4},
 {nom:'zone 9 (n50, +12)',          zone:9, difficulte:'normal',   niveau:50, etoiles:5, niveauObjet:12, competences:'max'},
 {nom:'zone 10 (n55, 6★, +12)',     zone:10,difficulte:'normal',   niveau:55, etoiles:6, niveauObjet:12, competences:'max'},
 {nom:'normale finie (n60, +15)',   zone:10,difficulte:'normal',   niveau:60, etoiles:6, niveauObjet:15, competences:'max'},
 {nom:'difficile en cours (rés.1)', zone:10,difficulte:'hard',     niveau:60, etoiles:6, niveauObjet:12, competences:'max', resonance:1, empreintes:true},
 {nom:'difficile finie (rés.3)',    zone:10,difficulte:'hard',     niveau:60, etoiles:6, niveauObjet:15, competences:'max', resonance:3, empreintes:true},
 {nom:'PLAFOND hardcore (rés.5)',   zone:10,difficulte:'hardcore', niveau:60, etoiles:6, niveauObjet:15, competences:'max', resonance:5, empreintes:true}
];
