# Tooltips chiffrés, effets de frappe, et trois correctifs

## Les tooltips disent enfin le calcul

Le tooltip d'un sort annonçait une puissance brute — « Dégâts 0,88 » — sans dire
de quelle statistique elle partait ni ce que valaient les bonus qui font
l'essentiel de certains kits.

Il montre désormais :

- **Le calcul** : « 90 % d'Attaque », avec la valeur vivante de la statistique.
- **Ce que la maîtrise ajoute**, séparément du ratio de base.
- **Les dégâts attendus contre la cible visée**, et la valeur en critique.
- **La formule complète** : mitigation 100 / (100 + DÉF × 3), variance ±8 %,
  critique ×1,5, affinité ×1,30 ou ×0,75.
- **Les bonus conditionnels**, un à un : « +12 % par charge d'Instabilité »,
  « ×1,65 sur cible Exposée », « +18 % par cumul de Virulence »…

Les soins et boucliers partent des PV maximum, et le tooltip le dit — quatre
sorts frappent avec la Défense au lieu de l'Attaque, et il le dit aussi.

## Aszhal — Prescience s'appliquait bien, mais restait invisible

Vérification faite, le moteur applique correctement Prescience. Le problème
était ailleurs : les trois sorts d'Aszhal posent le **même** renfort interne, et
la pastille affichait « Dégâts + » pour les trois. Comme Prescience se pose sur
**un autre champion**, en regardant Aszhal on ne voyait jamais rien se passer.

Chaque renfort porte maintenant son nom : **Prescience**, **Puissance d'ébène**,
**Souffle des éons**.

## Yunmei — la barre de ressource a disparu

Elle affichait « Aucune 0/5 » et rien ne l'incrémentait jamais : c'était un repli
générique servi à tout champion sans mécanique. L'identité de Yunmei déclarait
pourtant déjà `resource: 'Aucune'` — la donnée était juste, l'écran l'ignorait.

Corrigé pour elle, Aszhal et Ragnhild, qui étaient dans le même cas.

## Les effets de frappe

Les effets fonctionnaient, mais **une attaque ne ressemblait jamais à une
attaque** : l'élément décidait de la forme, si bien qu'un coup d'épée d'un
champion Nature affichait des bulles de venin.

L'élément **teinte** désormais, la frappe donne la forme : une entaille pour un
coup simple, une onde de choc pour une frappe lourde, une déflagration pour une
attaque de zone. Les allures élémentaires — Brasier, Givre, Venin, Ombre —
restent réservées aux sorts qui posent vraiment ces effets.

Impacts et entailles ont aussi été agrandis et éclaircis : ils se voient.

## Sous le capot

Le module de calcul est confronté au moteur par un test de contrat : il lit le
code du moteur, en extrait tous les bonus conditionnels, et vérifie qu'aucun ne
manque à la table — ni l'inverse. Une table recopiée à la main dérive toujours.

Ce test a d'ailleurs trouvé un trou pendant son écriture : `arcaneBarrage`
recevait un bonus du moteur que ma table ne décrivait pas. Il a fallu trois
versions de l'extracteur, deux pièges m'ayant échappé : une condition peut
nommer plusieurs sorts d'un coup, et la garde utile n'est pas toujours le `if`
le plus proche.

23 tests nouveaux. 18 mutations appliquées, 18 tuées — dont une que j'avais mal
écrite : elle ajoutait une clé déjà présente dans le même objet, donc sans effet.

## Ce qui reste

Trois champions — Malvek, Sivrane, Seraphiel — ont une ressource qui vit sur
**l'ennemi** (Virulence, Givre, Condamnation). Leur barre affiche donc leur
propre compteur, resté à zéro. Ce n'est pas le même défaut que Yunmei — la
ressource existe — mais elle est lue au mauvais endroit.

**1 288 tests, 51 fichiers.**
