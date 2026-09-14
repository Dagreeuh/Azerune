export const TUTORIAL_STARTERS=[1,19,20];
// Combat court : le tutoriel doit se terminer en une dizaine d'actions.
// Avec les anciens points de vie, il en fallait une cinquantaine, dont plus de
// quarante apres la derniere consigne — la partie la plus longue du tutoriel
// etait celle qui n'enseignait rien.
export const TUTORIAL_ENEMIES=[
 {id:'tutorial-scout',name:'Éclaireur de brume',icon:'👤',element:'Eau',hp:75,atk:18,def:9,spd:86,accuracy:10,resistance:10},
 {id:'tutorial-guard',name:'Gardien protégé',icon:'🛡️',element:'Nature',hp:100,atk:16,def:14,spd:80,accuracy:10,resistance:10},
 {id:'tutorial-wisp',name:'Feu follet',icon:'🔥',element:'Feu',hp:65,atk:17,def:8,spd:92,accuracy:10,resistance:10}
];
export const TUTORIAL_STATS={
 1:{hp:300,atk:30,def:32,spd:94,crit:5,critDamage:50,accuracy:10,resistance:25},
 19:{hp:245,atk:34,def:18,spd:105,crit:5,critDamage:50,accuracy:15,resistance:20},
 20:{hp:250,atk:44,def:18,spd:102,crit:5,critDamage:50,accuracy:25,resistance:15}
};
export const TUTORIAL_STEPS=[
 {type:'player',actorId:1,targetId:'enemy:0',skillIndex:0,title:'Attaquer',text:'Sélectionne l’Éclaireur, puis utilise Heurt runique. Les dégâts utilisent réellement la Défense de Thorgar.'},
 {type:'enemy',actorId:'enemy:0',title:'La riposte',text:'L’Éclaireur agit avec les règles normales : Attaque, Défense, affinité et boucliers.'},
 {type:'player',actorId:1,targetId:19,skillIndex:1,title:'Protéger un allié',text:'Utilise Serment du gardien sur Sylven. Une partie des dégâts qu’elle subira sera redirigée vers Thorgar.'},
 {type:'affinity',title:'Les affinités',text:'Ouvre le rappel. Les attaques suivent le cycle élémentaire ; les soins et boucliers n’en dépendent pas.'},
 {type:'player',actorId:19,targetId:1,skillIndex:1,title:'Soigner',text:'Pose Graine purifiante sur Thorgar. Le soin dépend des PV de Sylven et ne dépasse jamais les PV maximums.'},
 {type:'player',actorId:20,targetId:'enemy:1',skillIndex:1,title:'Briser un bouclier',text:'Utilise Armure exposée sur le Gardien protégé. Le bouclier est entamé selon les dégâts, pas supprimé d’un coup.'}
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
