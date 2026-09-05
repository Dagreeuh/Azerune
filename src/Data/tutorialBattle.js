export const TUTORIAL_STARTERS=[1,19,20];
export const TUTORIAL_ENEMIES=[
 {id:'tutorial-scout',name:'Éclaireur de brume',icon:'👤',element:'Eau',hp:360,atk:18,def:9,spd:86,accuracy:10,resistance:10},
 {id:'tutorial-guard',name:'Gardien protégé',icon:'🛡️',element:'Nature',hp:520,atk:16,def:14,spd:80,accuracy:10,resistance:10},
 {id:'tutorial-wisp',name:'Feu follet',icon:'🔥',element:'Feu',hp:340,atk:17,def:8,spd:92,accuracy:10,resistance:10}
];
export const TUTORIAL_STATS={
 1:{hp:300,atk:30,def:32,spd:94,crit:5,critDamage:50,accuracy:10,resistance:25},
 19:{hp:245,atk:34,def:18,spd:105,crit:5,critDamage:50,accuracy:15,resistance:20},
 20:{hp:250,atk:44,def:18,spd:102,crit:5,critDamage:50,accuracy:25,resistance:15}
};
export const TUTORIAL_STEPS=[
 {type:'player',actorId:1,targetId:'enemy:0',skillIndex:0,title:'Attaque et Défense',text:'Sélectionne l’Éclaireur, puis utilise Heurt runique. Les dégâts utilisent réellement la Défense de Thorgar.'},
 {type:'enemy',actorId:'enemy:0',title:'Riposte réelle',text:'L’Éclaireur agit avec les règles normales : Attaque, Défense, affinité et boucliers.'},
 {type:'player',actorId:1,targetId:19,skillIndex:1,title:'Protection liée',text:'Utilise Serment du gardien sur Sylven. Une partie des prochains dégâts sera réellement redirigée.'},
 {type:'enemy',actorId:'enemy:2',title:'Redirection',text:'Le Feu follet attaque. Observe la redirection vers Thorgar dans le journal.'},
 {type:'player',actorId:20,targetId:'enemy:1',skillIndex:1,title:'Bouclier partiellement détruit',text:'Utilise Armure exposée sur le Gardien protégé. Le bouclier est endommagé selon les dégâts, pas supprimé arbitrairement.'},
 {type:'affinity',title:'Affinités offensives',text:'Ouvre le rappel. Les attaques utilisent le cycle élémentaire, les soins et boucliers n’utilisent aucune pénalité d’affinité.'},
 {type:'player',actorId:19,targetId:1,skillIndex:1,title:'Soin préparé',text:'Pose Graine purifiante sur Thorgar. Le soin dépend des PV de Sylven et reste plafonné aux PV maximums.'},
 {type:'player',actorId:1,skillIndex:2,title:'Troisième sort temporaire',text:'Utilise Rempart ancestral. Le troisième sort est exceptionnellement débloqué dans ce tutoriel uniquement.',tutorialUltimate:true},
 {type:'enemy',actorId:'enemy:0',title:'Absorption réelle',text:'L’attaque ennemie est absorbée par les boucliers créés par Rempart ancestral.'},
 {type:'player',actorId:19,skillIndex:2,title:'Soin, purification et Régénération',text:'Utilise Floraison préparée. Les Graines se déclenchent et la Régénération est appliquée avec sa vraie durée.',tutorialUltimate:true},
 {type:'player',actorId:20,targetId:'enemy:1',skillIndex:2,title:'Exécution ardente',text:'Utilise le troisième sort de Korga sur la cible exposée. Le bonus d’exécution vient du moteur réel.',tutorialUltimate:true}
];
export function resolveTutorialTarget(step,battle){
 if(typeof step.targetId==='number')return step.targetId;
 if(typeof step.targetId!=='string')return null;
 const [side,index]=step.targetId.split(':');
 const pool=side==='ally'?battle.allies:battle.enemies;
 return pool?.[Number(index)]?.id??null;
}
export function resolveTutorialActor(step,battle){
 if(typeof step.actorId==='number')return step.actorId;
 if(typeof step.actorId!=='string')return null;
 const [side,index]=step.actorId.split(':');
 const pool=side==='ally'?battle.allies:battle.enemies;
 return pool?.[Number(index)]?.id??null;
}
