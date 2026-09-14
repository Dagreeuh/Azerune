# Chroniques d'Azerune v1.69.0

## Deux affixes Mythic+ et cinq mécaniques qui ne faisaient rien

**Type :** correctifs
**Date :** 10 septembre 2026

Troisième volet de la battue « annoncé mais jamais appliqué », après les
champions (v1.67.0) et les Empreintes et armes Uniques (v1.68.0).

## Mythic+

- **Galvanisant** et **Détonant** ne se déclenchaient **jamais**. Tous deux
  réagissent à la mort d'un ennemi, et le code qui les déclenche comparait les
  morts d'après l'action… à eux-mêmes. La liste des nouvelles morts était donc
  toujours vide, dans toutes les saisons et à tous les niveaux. Les deux
  fonctionnent désormais, y compris quand l'ennemi meurt d'une contre-attaque.
- Les six autres affixes ont été vérifiés en simulation, chiffre par chiffre,
  contre la phrase affichée au joueur. Tous conformes.

## Mécaniques de zone et d'Expédition

Cinq mécaniques infligeaient bien leurs dégâts mais perdaient leur
renforcement ou leur soin à chaque tour, faute d'écrire sur la bonne copie de
l'unité :

- **Surchauffe** (Forges de Khaz-Drum) — l'Attaque ne montait pas.
- **Soif carmine** (Crypte Sanglante) — les ennemis ne récupéraient rien.
- **Esprits anciens** (Sanctuaire des Anciens) — les Esprits ne montaient pas.
- **Rempart de lave** (Raid) — le Gardien ne gagnait pas sa Défense.
- **Furie volcanique** et **Écho vengeur** — mêmes correctifs, sur des zones
  encore non jouables.

## Vérifications

Les quatre Expéditions et leurs treize rôles de serviteurs ont été vérifiés en
jeu, mécanique par mécanique. Les quatre Raids déclarent 34 champs, tous lus.

1 481 tests, 68 fichiers, tous au vert. 12 mutations testées sur ces
changements, 12 tuées.

Détail : `Audit/RAPPORT-EXPERIENCE-JOUEUR.md`, section 15.
