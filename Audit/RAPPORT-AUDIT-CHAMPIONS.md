# Audit fonctionnel des 26 champions - Azerune v1.42.1

## Résumé

- 26 champions contrôlés, soit 78 compétences.
- 78 identifiants de compétences sont reconnus par le moteur.
- 18 kits sont fonctionnels avec seulement des écarts mineurs d'affichage ou de description.
- 8 kits nécessitent une correction fonctionnelle ou de Résonance IV.
- Le transport des statistiques, des sets actifs, de la Résonance et des armes Uniques vers le combat est valide.

## Anomalies prioritaires

### Vaeloria
La Danse compte trois changements de compétence, mais ne vérifie pas que les trois compétences distinctes ont réellement été utilisées. Une rotation 1, 2, 1 peut donc déclencher le tour bonus. Le bonus annoncé de Résonance IV sur la jauge n'est pas distinct du fonctionnement normal.

### Mobeen
Disparition garantit actuellement le critique uniquement à Éviscération. Estoc perfide lancé après Disparition ne consomme pas l'ouverture et ne reçoit pas le critique annoncé pour la première frappe.

### Brilith
Orbe d'annihilation applique ses dégâts avant de placer les quatre Charges arcaniques. Les dégâts de l'Orbe ne profitent donc pas des quatre charges, contrairement à la description « génère 4 charges puis frappe ».

### Seraphiel
Le hotfix corrige la génération et la consommation de Condamnation. Il reste un écart de Résonance IV : la fiche annonce qu'une petite partie de la puissance est conservée après Jugement, mais le moteur remet toujours la ressource à zéro.

### Ignovar
La fiche de Résonance IV annonce une détonation supplémentaire, mais Embrasement utilise le même calcul aux niveaux de Résonance inférieurs. Aucun bonus spécifique de Résonance IV n'est appliqué à l'explosion.

### Morghast
Les réactions fonctionnent, mais le gain annoncé à la Résonance IV n'est pas appliqué. Les valeurs des réactions à deux ou trois afflictions sont identiques quel que soit le niveau de Résonance.

### Caelion
Retour temporel réduit les délais de la même façon à tous les niveaux. La réduction supplémentaire annoncée à la Résonance IV n'est pas présente.

### Nashoba
La Goule attaque au début d'une compétence seulement lorsqu'une cible ennemie individuelle est sélectionnée. Une compétence de zone ou utilitaire peut donc faire perdre une occasion d'attaque de la Goule. La Résonance IV ajoute bien une attaque potentielle à Apocalypse.

## Champions validés

### Thorgar
Lien, redirection, bouclier renforcé sur l'allié lié et dégâts basés sur la Défense fonctionnent. La redirection ne peut pas tuer Thorgar, ce qui est cohérent avec un gardien protecteur.

### Kaelen
Marque, Traque, accélération sur les attaques alliées et finisseur renforcé fonctionnent. La Résonance IV augmente correctement la jauge gagnée.

### Brom
Accumulation des Impacts, consommation, Défense réduite, Vitesse réduite et Étourdissement préparé fonctionnent.

### Sylven
Graine, déclenchement sous 50 % de PV, purification, Floraison et Régénération fonctionnent. La Résonance IV renforce le soin de la Graine.

### Korga
Les interactions avec les boucliers, l'Exposition et l'exécution fonctionnent.

### Nerissa
Le retrait de jauge est stocké puis redistribué. La Résonance IV augmente correctement la réserve issue d'Éclat de reflux.

### Malvek
Virulence, Poison, progression des cumuls et amplification de Dague virulente fonctionnent.

### Aurelis
Boucliers ciblés, Sanctuaire et Égide de secours fonctionnent. Les compétences de protection rechargent volontairement l'Égide.

### Vexil
Instabilité, amplification, chance d'Étourdissement et contrecoup à forte charge fonctionnent. La Résonance IV renforce l'amplification sans augmenter le contrecoup.

### Maerys
Le hotfix initialise Marée haute et applique désormais les effets défensifs et offensifs des postures.

### Elowen
Jardin vivant, soins, Régénération, ralentissement et Prison renforcée fonctionnent.

### Vélomoteur
Génération de Puissance sacrée, Tempête de zone, bonus du Verdict et conservation d'une charge en Résonance IV fonctionnent.

### Dagcat
Points de combo, Saignement, prolongation et finisseur fonctionnent. La Résonance IV prolonge davantage le Saignement.

### Lelianna
Bouclier, Expiation, conversion de 35 % des dégâts et Pénitence à trois impacts fonctionnent. Le soin est calculé à partir du total des trois impacts, ce qui produit le même total attendu.

### Saylich
Visée, critique garanti, pénétration et consommation de la préparation fonctionnent.

### Hicho
Totem, soin périodique au tour des alliés, soin ciblé renforcé et prolongation par Marée ancestrale fonctionnent.

### Histéria
Agonie croissante, Corruption de zone et déclenchement immédiat par Extase fonctionnent. La Résonance IV renforce le déclenchement.

### Mathanae
Fragments gagnés en frappant et en encaissant, Provocation, soin personnel, Défense et boucliers d'équipe fonctionnent. La Résonance IV améliore le rendement.

## Points transversaux

- Le set Vol de vie reçoit bien `lifestealSet` depuis le calcul d'équipement et soigne de 25 % des dégâts directs réellement infligés.
- Les effets périodiques ne déclenchent pas le Vol de vie, ce qui évite les boucles de soin.
- Les niveaux de Résonance arrivent correctement dans les unités de combat.
- Les armes Uniques équipées sont transmises au moteur.
- Les ressources personnelles persistent entre les vagues Mythic+.
- Les états temporaires et cooldowns sont conservés lors du changement de vague.

## Correctif recommandé v1.42.2

1. Remplacer la Danse de Vaeloria par un suivi réel des trois compétences distinctes.
2. Faire consommer Disparition par la première attaque offensive de Mobeen et garantir son critique.
3. Appliquer les quatre Charges avant les dégâts d'Orbe d'annihilation.
4. Conserver une charge de Condamnation après Jugement en Résonance IV.
5. Ajouter la détonation supplémentaire d'Ignovar en Résonance IV.
6. Renforcer les réactions de Morghast en Résonance IV.
7. Ajouter une réduction de cooldown supplémentaire à Caelion en Résonance IV.
8. Faire agir la Goule de Nashoba sur toute compétence offensive valide, y compris les compétences de zone.
