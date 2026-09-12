# Rapport d'équilibrage — Mathanae (v1.66.0)

> « tu peux revoir le kit de Mathanae on m'avait dit qu'il était très fort »

On vous l'avait bien dit. Mathanae n'était pas seulement un bon tank :
**c'était le meilleur champion du jeu, tous rôles confondus.**

---

## 1. La mesure

Simulation A/B en paires appariées, **106 combats par champion**, sur six
missions de boss réelles de la campagne, générateur pseudo-aléatoire amorcé
(`mulberry32`) pour que chaque champion affronte exactement les mêmes
situations.

Point important : le premier jet mesurait tout le monde à **5★ niveau 50**,
ce qui flattait les champions rares et plaçait Mathanae 3ᵉ. La mesure retenue
utilise les **raretés et plafonds de niveau réels** — les conditions de jeu.
Le classement change complètement.

| Mesure | Mathanae | Moyenne du roster |
|---|---|---|
| Taux de victoire | **49,1 %** (± 9,5 à 95 %) | 20,2 % |
| Rang | **1er sur 32** | — |

Entre tanks, l'écart est encore plus net :

| Tank | Victoires |
|---|---|
| **Mathanae** | **49,1 %** |
| Maerys | 20,6 % |
| Thorgar | 16,5 % |
| Brom | 14,6 % |

**Trois fois** le tank suivant. Ce n'est pas un déséquilibre de réglage,
c'est un champion qui joue à un autre jeu.

---

## 2. Ce qui n'était PAS le problème

Avant de toucher au kit, j'ai vérifié sa fiche de statistiques. Selon la
formule de puissance pondérée du jeu, Mathanae est **8ᵉ sur 11 chez les 5★**.

Il n'est pas surstatté. Le problème vient du **cumul de son kit**, pas de ses
chiffres. Aucune statistique n'a donc été modifiée — et un test le verrouille
désormais, pour que personne (moi compris) ne « corrige » plus tard le mauvais
levier.

---

## 3. Où était le problème : le balayage des leviers

Chaque levier testé séparément, mêmes conditions, mêmes graines :

| Levier retiré | Taux de victoire | Écart |
|---|---|---|
| Kit d'origine | 49,1 % | — |
| Bouclier réduit | 45,3 % | −3,8 |
| Soin personnel réduit | 41,5 % | −7,6 |
| PV réduits | 45,3 % | −3,8 |
| **Les trois combinés (Z4)** | **31,1 %** | **−18,0** |

Ajouter par-dessus une coupe de statistiques ne gagnait que **0,9 point** de
plus. Confirmation chiffrée du point 2 : la fiche n'était pas le sujet, et on
l'a laissée intacte.

Le vrai coupable est un **empilement** : Sigil de tourment remplissait la
jauge de Fragments en deux lancers (1 Fragment **par cible**, donc 3 sur un
combat standard), et Métamorphose démoniaque convertissait ces Fragments en
un gros soin personnel **plus** un bouclier sur **toute l'équipe**. Mathanae
soignait, protégeait l'équipe entière, tenait le devant et frappait avec sa
Défense — il remplaçait à lui seul le soigneur de l'équipe.

---

## 4. Les trois retouches

### Sigil de tourment
- gain de Fragments **plafonné à 2 par lancer** (au lieu de 1 par cible) :
  il faut désormais **au moins trois lancers** pour remplir la jauge, contre
  deux avant ;
- renfort de Défense ramené à **2 tours** sur une recharge de 3. Trois tours
  sur une recharge de trois, c'était une Défense augmentée en permanence — et
  ses dégâts se calculent sur la Défense ;
- **la provocation de zone est conservée.** C'est son identité de tank, elle
  n'était pas le problème.

### Métamorphose démoniaque
- le bouclier ne couvre plus toute l'équipe mais **les 2 alliés les plus bas
  en pourcentage de PV**. Il reste un vrai filet de sécurité, il ne remplace
  plus un soigneur ;
- soin personnel ramené de 8 % + 6 %/Fragment à **5 % + 4 %/Fragment**. À
  cinq Fragments, il se rendait **38 %** de ses PV maximum d'un seul sort.

### Descriptions
Les textes des sorts promettaient encore l'ancien comportement (« gagne
1 Fragment par cible », « boucliers » à l'équipe). Ils ont été réécrits, et
**un test de contrat vérifie maintenant que le texte et le moteur disent la
même chose** : si quelqu'un change le plafond dans le moteur sans toucher à
la description, la suite échoue.

---

## 5. Résultat

**31,1 % de victoires, −18,0 points.**

Mathanae reste **le meilleur tank du jeu** — c'est voulu, il est 5★ et son
kit est le plus riche des tanks. Il n'est simplement plus le meilleur
champion du jeu, ni trois fois meilleur que ses pairs. L'écart avec Maerys
(20,6 %) redevient un écart de rareté, pas un gouffre.

---

## 6. Vérification

- `tests/mathanae.equilibrage.test.js` — 12 tests couvrant les trois
  retouches, les descriptions, et ce qui a été délibérément laissé intact.
- **17 mutations testées, 17 tuées** : retour à l'ancien plafond de
  Fragments, plafond à 3, Défense permanente, provocation restreinte à une
  seule cible, provocation supprimée, bouclier à toute l'équipe, bouclier aux
  3 plus bas, tri inversé, tri supprimé, ancien palier de soin, soin
  supprimé, statistiques gonflées, perte du scaling sur la Défense, et
  4 mutations de désynchronisation texte/moteur.
- Suite complète : **1305 tests, 52 fichiers, tous au vert**.

Une note sur le test de provocation : elle ne s'applique qu'à **60 %** par
cible (0,75 de base moins la pénalité d'affinité), donc le test vérifie le
**jet** et non le résultat — chaque ennemi est soit provoqué, soit nommé dans
le message de résistance. Restreindre le sort à la cible désignée laisserait
les deux autres absents des deux listes, et le test tombe.
