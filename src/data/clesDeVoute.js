// Cles de voute : le choix qui change la facon de jouer un champion.
//
// Pourquoi elles existent. Mesure du systeme d'Empreintes avant refonte :
//   • 32 champions, UN seul jeu de noms de noeuds — aucune identite
//   • 46 noeuds sur 384 ne faisaient pas ce que leur branche annoncait ;
//     17 champions sur 32 n'ont aucun effet a jet, donc toute leur branche
//     Emprise retombait sur de la puissance : une seconde branche Force
//     deguisee
//   • 19 repartitions legales a 6★ R5, mais 32 points d'ecart de puissance
//     entre la meilleure et la pire : il y avait UNE bonne reponse et
//     dix-huit pieges
//
// Regler les pourcentages n'y aurait rien changé : le probleme etait
// structurel. Une cle de voute n'est donc jamais un chiffre en plus — c'est un
// changement de forme, et on ne peut en allumer qu'UNE SEULE.
//
// Chaque cle se ramene a un ARCHETYPE, et chaque archetype a exactement un
// point d'accroche dans le moteur. C'est ce qui rend quatre-vingt-seize cles
// testables au lieu d'ingerables : il n'y a que dix comportements a verifier,
// le reste est de la donnee.

/**
 * Les dix archetypes. `accroche` nomme l'endroit unique du moteur qui les lit
 * — si un jour deux endroits lisent le meme archetype, c'est que la promesse
 * de ce fichier est rompue.
 */
export const ARCHETYPES={
  amorce:{defaut:2,accroche:'createBattle',
    resume:valeur=>`Commence le combat avec ${valeur} point(s) de ressource.`},
  elan:{defaut:25,accroche:'finCastSkill',
    resume:valeur=>`Atteindre le plafond de ressource rend ${valeur} % de jauge.`},
  ferveur:{defaut:.04,accroche:'hit',
    resume:valeur=>`+${Math.round(valeur*100)} % de dégâts et de soins par point de ressource.`},
  persistance:{defaut:1,accroche:'mastery',
    resume:valeur=>`Tout ce que le champion applique dure ${valeur} tour de plus.`},
  contagion:{defaut:1,accroche:'debuff',
    resume:valeur=>`Chaque malus posé se propage à ${valeur} ennemi de plus.`},
  sacrifice:{defaut:.12,accroche:'createBattle',
    resume:valeur=>`Commence au plafond de ressource, mais perd ${Math.round(valeur*100)} % de PV maximum.`},
  acharnement:{defaut:.25,accroche:'hit',
    resume:valeur=>`+${Math.round(valeur*100)} % de dégâts sur une cible sous 40 % de PV.`},
  vampirisme:{defaut:.12,accroche:'hit',
    resume:valeur=>`Récupère ${Math.round(valeur*100)} % des dégâts infligés en PV.`},
  egide:{defaut:.25,accroche:'shield',
    resume:valeur=>`Les boucliers posés sont ${Math.round(valeur*100)} % plus grands.`},
  devouement:{defaut:.20,accroche:'heal',
    resume:valeur=>`Les soins prodigués sont ${Math.round(valeur*100)} % plus grands, et le surplus devient un bouclier au lieu d’être perdu.`}
};

/**
 * Trois cles par champion, ecrites dans SON vocabulaire.
 *
 * Le nom et le texte parlent de sa mecanique ; l'archetype dit au moteur quoi
 * faire. C'est la meme separation que pour les ressources : le champion
 * declare, le moteur execute, et rien n'est ecrit deux fois.
 */
const C=(id,archetype,nom,texte,valeur)=>({id,archetype,nom,texte,valeur});

export const CLES_DE_VOUTE={
  1:[C('thorgar-serment','persistance','Serment inébranlable','Le Serment du gardien et le Rempart ancestral tiennent un tour de plus.'),
     C('thorgar-runes','egide','Runes de rempart','Thorgar protège plus large : ses boucliers sont nettement plus grands.'),
     C('thorgar-sang','vampirisme','Sang runique','Chaque coup porté lui rend une part de ses PV : il tient seul plus longtemps.')],
  3:[C('kaelen-proie','persistance','Proie marquée à vie','La Traque et tout ce que Kaelen pose durent un tour de plus.'),
     C('kaelen-curee','acharnement','Curée','Une proie sous 40 % de PV subit des dégâts nettement supérieurs.'),
     C('kaelen-affut','elan','Affût','Traquer sa proie jusqu’au bout rend de la jauge : Kaelen rejoue plus vite.')],
  7:[C('vaeloria-cadence','elan','Cadence parfaite','Boucler la Danse des lames rend de la jauge en plus du tour bonus.'),
     C('vaeloria-ivresse','ferveur','Ivresse du duel','Chaque étape de Danse déjà posée augmente ses dégâts.'),
     C('vaeloria-mise-a-mort','acharnement','Mise à mort','Ses lames déchirent les cibles déjà affaiblies.')],
  8:[C('brom-elan','amorce','Élan tellurique','Brom entre en combat avec 2 Impacts déjà accumulés.'),
     C('brom-onde','contagion','Onde de choc','Ce que Brom applique se propage à un second ennemi.'),
     C('brom-fracture','persistance','Fracture durable','Défense et Vitesse réduites tiennent un tour de plus.')],
  19:[C('sylven-seve','devouement','Sève abondante','Les Graines et la Floraison rendent nettement plus de PV.'),
      C('sylven-racines','persistance','Racines profondes','Régénération et Graines tiennent un tour de plus.'),
      C('sylven-semis','amorce','Semis précoce','Sylven commence le combat avec 2 Graines déjà posées.')],
  20:[C('korga-execution','acharnement','Exécution ardente','Une cible sous 40 % de PV subit des dégâts nettement supérieurs.'),
      C('korga-carnage','vampirisme','Carnage','Briser les boucliers lui rend des PV.'),
      C('korga-expose','persistance','Armure durablement exposée','Exposé et Défense réduite tiennent un tour de plus.')],
  21:[C('nerissa-maree','elan','Marée montante','Remplir le Reflux rend de la jauge à Nerissa.'),
      C('nerissa-ressac','amorce','Ressac','Elle entre en combat avec du Reflux déjà stocké.',20),
      C('nerissa-courant','persistance','Courant tenace','Vitesse réduite et Reflux tiennent un tour de plus.')],
  22:[C('malvek-peste','contagion','Peste rampante','La peste de Malvek ne tient pas en place : chaque affliction qu’il pose gagne un second porteur.'),
      C('malvek-virulence','ferveur','Virulence galopante','Plus la Virulence monte, plus ses coups font mal.'),
      C('malvek-necrose','persistance','Nécrose lente','Poison et Virulence tiennent un tour de plus.')],
  23:[C('aurelis-sanctuaire','egide','Sanctuaire élargi','Les Égides d’Aurelis sont nettement plus grandes.'),
      C('aurelis-veille','persistance','Veille prolongée','Les boucliers et bénédictions tiennent un tour de plus.'),
      C('aurelis-secours','amorce','Secours immédiat','L’Égide de secours est prête dès le premier tour, et rechargée.')],
  24:[C('vexil-fievre','ferveur','Fièvre arcanique','Chaque Instabilité augmente ses dégâts — jouer près de la rupture paie.'),
      C('vexil-rupture','sacrifice','Rupture assumée','Vexil commence à l’Instabilité maximale, au prix de ses PV.'),
      C('vexil-decharge','elan','Décharge','Atteindre l’Instabilité critique lui rend de la jauge.')],
  25:[C('maerys-rempart','egide','Rempart des marées','Ses boucliers de Marée haute sont nettement plus grands.'),
      C('maerys-flux','persistance','Flux continu','Provocation et Attaque réduite tiennent un tour de plus.'),
      C('maerys-ressac','vampirisme','Ressac vital','La marée revient toujours : chaque coup porté par Maerys lui rend une part de ses PV.')],
  26:[C('ignovar-incendie','contagion','Incendie','Chaque Brûlure posée gagne un second porteur.'),
      C('ignovar-fournaise','ferveur','Fournaise','Chaque Braise accumulée augmente ses dégâts.'),
      C('ignovar-etincelle','amorce','Étincelle','Il entre en combat avec 2 Braises déjà prêtes.')],
  27:[C('elowen-jardin','persistance','Jardin éternel','Le Jardin vivant et ses ronces tiennent un tour de plus.'),
      C('elowen-seve','devouement','Sève nourricière','Le Jardin rend nettement plus de PV.'),
      C('elowen-ronces','contagion','Ronces envahissantes','Chaque entrave gagne un second porteur.')],
  28:[C('seraphiel-jugement','ferveur','Jugement implacable','Chaque Condamnation accumulée augmente ses dégâts.'),
      C('seraphiel-sentence','amorce','Sentence anticipée','Il entre en combat avec 2 Condamnations.'),
      C('seraphiel-aube','acharnement','Aube sans pitié','Le jugement ne s’attarde pas sur les condamnés : Seraphiel frappe bien plus fort une cible déjà à terre.')],
  29:[C('morghast-catalyse','contagion','Catalyse propagée','Les fioles de Morghast éclaboussent : chaque affliction posée trouve une seconde victime, et ses réactions suivent.'),
      C('morghast-macerationa','persistance','Macération','Poisons, Brûlures et Saignements tiennent un tour de plus.'),
      C('morghast-fleau','ferveur','Fléau concentré','Ses réactions frappent plus fort à mesure qu’il accumule.')],
  30:[C('caelion-ancrage','persistance','Ancrage prolongé','L’Ancrage temporel et ce qu’il pose tiennent un tour de plus.'),
      C('caelion-remontee','elan','Remontée du sable','Ancrer un allié rend de la jauge à Caelion.'),
      C('caelion-retour','devouement','Retour généreux','Le Retour temporel ramène l’allié avec bien plus de PV.')],
  9:[C('velomoteur-croisade','sacrifice','Croisade','Il entre en combat à 5 Puissances sacrées, au prix de ses PV.'),
     C('velomoteur-zele','ferveur','Zèle','Chaque Puissance sacrée accumulée augmente ses dégâts.'),
     C('velomoteur-verdict','elan','Verdict imminent','Atteindre 5 charges lui rend de la jauge.')],
  10:[C('dagcat-traque','amorce','Traque farouche','Dagcat entre en combat avec 2 points de combo.'),
      C('dagcat-mise-a-mort','acharnement','Mise à mort','Ses griffes déchirent les proies déjà affaiblies.'),
      C('dagcat-hemorragie','contagion','Hémorragie','Chaque Saignement posé gagne un second porteur.')],
  11:[C('mobeen-embuscade','amorce','Embuscade','Il ouvre le combat avec 2 points de combo.'),
      C('mobeen-egorgement','acharnement','Égorgement','Une lame dans le dos d’un blessé : Mobeen inflige bien davantage sous 40 % de PV.'),
      C('mobeen-ombre','elan','Pas de l’ombre','Préparer son ouverture lui rend de la jauge.')],
  12:[C('lelianna-expiation','devouement','Expiation abondante','Les soins d’Expiation sont nettement plus grands.'),
      C('lelianna-bouclier','egide','Mot de pouvoir renforcé','Ses boucliers sont nettement plus grands.'),
      C('lelianna-penitence','persistance','Pénitence prolongée','Expiation et boucliers tiennent un tour de plus.')],
  13:[C('saylich-affut','amorce','Affût','Saylich commence avec 2 charges de Visée.'),
      C('saylich-coup-de-grace','acharnement','Coup de grâce','Saylich garde une balle pour la fin : une cible sous 40 % de PV subit bien davantage.'),
      C('saylich-concentration','ferveur','Concentration','Chaque charge de Visée augmente ses dégâts.')],
  14:[C('brilith-surcharge','sacrifice','Surcharge arcanique','Elle entre en combat aux Charges maximales, au prix de ses PV.'),
      C('brilith-resonance','ferveur','Résonance','Chaque Charge arcanique augmente ses dégâts.'),
      C('brilith-barrage','elan','Barrage imminent','Atteindre 4 Charges lui rend de la jauge.')],
  15:[C('hicho-maree','devouement','Marée nourricière','Le Totem et ses vagues rendent nettement plus de PV.'),
      C('hicho-totem','persistance','Totem ancré','Le Totem et ses effets tiennent un tour de plus.'),
      C('hicho-esprits','amorce','Esprits présents','Le Totem est déjà posé au premier tour.',1)],
  16:[C('nashoba-epidemie','contagion','Épidémie','Chaque Blessure purulente gagne un second porteur.'),
      C('nashoba-charnier','amorce','Charnier','Il entre en combat avec 2 Blessures déjà semées.'),
      C('nashoba-apocalypse','acharnement','Apocalypse','Les morts réclament leur dû : Nashoba achève bien plus vite une cible sous 40 % de PV.')],
  17:[C('histeria-corruption','contagion','Corruption rampante','La Corruption d’Histéria déborde d’elle-même : chaque affliction posée s’étend à un ennemi de plus.'),
      C('histeria-agonie','persistance','Agonie prolongée','Agonie et Corruption tiennent un tour de plus.'),
      C('histeria-extase','ferveur','Extase montante','Plus elle accumule, plus ses afflictions frappent fort.')],
  18:[C('mathanae-pacte','sacrifice','Pacte démoniaque','Il entre en combat aux Fragments maximaux, au prix de ses PV.'),
      C('mathanae-egide','egide','Égide infernale','Les boucliers de Métamorphose sont nettement plus grands.'),
      C('mathanae-tourment','vampirisme','Tourment partagé','Le démon prélève sa part : chaque entaille infligée par Mathanae le régénère.')],
  31:[C('vharok-maelstrom','ferveur','Maelström grondant','Chaque cumul de Maelström augmente ses dégâts.'),
      C('vharok-decharge','elan','Décharge imminente','Atteindre 5 cumuls lui rend de la jauge.'),
      C('vharok-tempete','amorce','Tempête levée','Il entre en combat avec 2 cumuls de Maelström.')],
  32:[C('ragnhild-soif','vampirisme','Soif de sang','Elle récupère bien davantage de PV sur chaque coup porté.',.20),
      C('ragnhild-execution','acharnement','Exécution','Ragnhild sent le sang : sa hache s’abat bien plus fort sur une cible déjà affaiblie.'),
      C('ragnhild-temerite','sacrifice','Témérité permanente','Elle commence renforcée, au prix d’une part de ses PV.')],
  33:[C('sivrane-blizzard','contagion','Blizzard','Chaque cumul de Givre gagne un second porteur.'),
      C('sivrane-gel','persistance','Gel profond','Givre et Ralentissement tiennent un tour de plus.'),
      C('sivrane-fracture','ferveur','Fracture imminente','Plus le Givre monte, plus ses traits frappent fort.')],
  34:[C('yunmei-renouveau','devouement','Renouveau abondant','Ses brumes rendent nettement plus de PV.'),
      C('yunmei-brume','persistance','Brume tenace','Régénération et purifications tiennent un tour de plus.'),
      C('yunmei-voile','egide','Voile de brume','Les protections qu’elle pose sont nettement plus grandes.')],
  35:[C('aszhal-plaie','persistance','Plaie béante','Les Plaies temporelles et ses amplifications tiennent un tour de plus.'),
      C('aszhal-prescience','ferveur','Prescience aiguisée','Plus il ouvre de Plaies, plus ses propres coups portent.'),
      C('aszhal-eons','elan','Souffle pressé','Ouvrir les Plaies lui rend de la jauge.')],
  36:[C('nyxaris-incantation','amorce','Incantation prête','Nyxaris entre en combat avec 2 Charges.'),
      C('nyxaris-desintegration','ferveur','Désintégration','Chaque Charge accumulée augmente ses dégâts.'),
      C('nyxaris-eternite','sacrifice','Éternité empruntée','Elle commence aux Charges maximales, au prix de ses PV.')]
};

/** Les trois cles d'un champion, valeur d'archetype resolue. */
export function clesDuChampion(heroId){
  return(CLES_DE_VOUTE[heroId]||[]).map(cle=>{
    const archetype=ARCHETYPES[cle.archetype];
    const valeur=cle.valeur??archetype.defaut;
    return{...cle,valeur,accroche:archetype.accroche,effet:archetype.resume(valeur)};
  });
}

/** La cle allumee par un champion, ou null. Une seule, jamais deux. */
export function cleAllumee(heroId,lit=[]){
  const cles=clesDuChampion(heroId);
  return cles.find(cle=>(lit||[]).includes(`cle:${heroId}:${cle.id}`))||null;
}

/** Identifiant de noeud d'une cle, tel qu'il est stocke dans la sauvegarde. */
export const cleNodeId=(heroId,cleId)=>`cle:${heroId}:${cleId}`;

/** Ce que le moteur lit : {archetype, valeur} ou null. */
export function bonusDeCle(heroId,lit=[]){
  const cle=cleAllumee(heroId,lit);
  return cle?{archetype:cle.archetype,valeur:cle.valeur,nom:cle.nom}:null;
}
