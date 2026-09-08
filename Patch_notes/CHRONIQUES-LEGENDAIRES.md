# Chroniques légendaires — les armes Uniques se méritent enfin

## En bref

Une arme Unique se forgeait en **trois clics**. Les « 80 Lingots volcaniques »
annoncés par les étapes n'étaient comptés par rien, et vaincre un Adversaire
légendaire ne comptait nulle part.

Désormais : une relique très rare ouvre la Chronique, puis **20 à 60 passages**
de farm réel, puis un boss caché à vaincre, puis l'arme. Et les reliques tombent
assez souvent pour qu'on la vive.

## Ce qui était creux

Le bouton « Valider l'étape » n'avait **aucune condition**. On cliquait trois
fois et l'arme était forgée. Les matériaux des textes d'étape étaient de
l'ambiance : la fonction qui devait les compter existait, mais n'était appelée
nulle part dans le jeu.

Et vaincre Aeralion, Arkhéon, la Chasseuse de la Dernière Lune ou Thalassyr ne
produisait rien du tout — c'était la seule activité du jeu dont la victoire
n'était enregistrée nulle part.

## Les Vestiges

Sept matériaux, chacun lié à une Chronique et à une activité. Ils **ne tombent
que si la Chronique est active** : c'est le signal que la chasse a commencé.

Le rendement suit le niveau du contenu — monter en difficulté raccourcit la
quête.

| Chronique | Ce qu'il faut réunir | Passages |
|---|---|---|
| Marteau du Cœur-Monde | 80 Lingots + 25 Cœurs incendiaires | 25 à 27 (Raid) |
| Lame du Prince-Tempête | 100 Éclats de tempête | 25 à 50 (Mythic+) |
| Bâton des Astres Brisés | 40 Fragments du Bâton | 20 à 40 (Mythic+) |
| Cendre-Sépulcrale | 50 Âmes enchaînées | 25 à 50 (Mythic+) |
| Alambic du Fléau | 60 Catalyseurs | 30 à 60 (Mythic+) |
| Égide des Mille Marées | 50 Perles abyssales | 25 (Adversaire légendaire) |

Le journal affiche une barre de progression par exigence, et le bouton reste
grisé tant que le compte n'y est pas. Valider consomme les Vestiges.

## Chaque étape exige vraiment quelque chose

Les conditions s'appuient toutes sur des compteurs qui existaient déjà — aucun
nouveau suivi de combat.

- **Les deux Liens du Prince-Tempête** doivent être possédés ensemble. C'est la
  structure exacte de Thunderfury, et un seul Lien ne fait plus rien avancer.
- **Les Essences mythiques et de forge** sont réellement vérifiées.
- **Les victoires sur les Adversaires légendaires** sont enregistrées.
- **« Catalyse parfaite »** demande 750 000 dégâts d'affliction cumulés — un
  compteur qui existait déjà, et qui colle à l'Alambic du Fléau.

## Les reliques tombent plus souvent

Le calcul faisait mal : avec les anciens taux, il fallait **462 à 1 386
passages** pour une chance sur deux d'obtenir une seule relique — et **2 022**
pour les deux Liens de Thunderfury. À dix passages par jour, quatre à sept mois
pour seulement *ouvrir* une Chronique. « Très rare » avait fini par vouloir dire
« jamais ».

Les taux visent maintenant une chance sur deux entre **116 et 198 passages** du
contenu le plus haut. Une relique reste sous une chance sur deux cents par
passage — c'est toujours une légende, mais une légende qu'on peut vivre.

## L'arme en vaut la peine

Mesuré, à maîtrise maximale, sur huit attaques :

| Arme | Dégâts sur 8 coups | Puissance |
|---|---|---|
| Lame du Prince-Tempête | +278 % | +39 % |
| Marteau du Cœur-Monde | +124 % | +42 % |
| Bâton des Astres Brisés | +109 % | +32 % |
| Arc de la Dernière Éclipse | +104 % | +51 % |
| Alambic du Fléau | +69 % | +44 % |
| Cendre-Sépulcrale | +59 % | +46 % |
| Égide des Mille Marées | +53 % | +31 % |

Entre +31 % et +51 % de puissance, plus le déclenchement par-dessus. Derrière une
relique à moins de 0,5 % et cinquante passages de farm, une arme tiède aurait
été une trahison.

## Ce qui reste ouvert

**Sept armes pour trente-six champions.** Vingt-deux champions n'ont aucune arme
Unique atteignable, et rien ne le dit au joueur. C'est le vrai manque de ce côté.

**Aucun signal quand une relique tombe.** Une légendaire qui s'ouvre mérite mieux
qu'une ligne de butin.

## Sous le capot

33 tests nouveaux. Le plus utile a trouvé un bug pendant son écriture : il
vérifie que chaque victoire exigée par une Chronique est réellement enregistrée
par le jeu. La Chasseuse de la Dernière Lune a pour identifiant `huntress` ; la
condition attendait `chasseuse`. La Chronique de l'Arc serait restée bloquée
pour toujours, sans erreur ni message.

25 mutations appliquées, 25 tuées. Deux avaient survécu, dont celle qui perdait
les victoires au rechargement de la sauvegarde — mon test vérifiait qu'une
sauvegarde vide rend un objet vide, ce qui ne prouve rien.

Audit complet : `Audit/RAPPORT-CHRONIQUES-LEGENDAIRES.md`.

**1 182 tests, 46 fichiers.**
