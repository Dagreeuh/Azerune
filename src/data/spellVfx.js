// Traduction d'un sort en effet visuel.
//
// Le moteur ne connait rien au rendu : il attache `skillEffect` et `element` a
// chaque evenement, et ce module decide seul a quoi cela ressemble. La fonction
// est pure, donc testable sans navigateur — et c'est la seule verite sur le
// sujet : l'ecran ne fait qu'appliquer ce qu'elle renvoie.
//
// Regle de lisibilite : une archetype par intention de jeu, pas une par sort.
// Trente-deux champions et cent sorts ne peuvent pas avoir cent animations sans
// que le combat devienne illisible — et sans que le fichier devienne
// ingerable. Le sort choisit l'archetype, l'element choisit la couleur.

/** Archetypes visuels. `layers` nomme les couches CSS a empiler. */
export const VFX_ARCHETYPES={
 slash:{label:'Entaille',layers:['streak','sparks'],impact:'cut'},
 heavy:{label:'Frappe lourde',layers:['shock','dust'],impact:'crush'},
 pierce:{label:'Trait',layers:['bolt','sparks'],impact:'pierce'},
 burst:{label:'Déflagration',layers:['ring','motes'],impact:'blast'},
 storm:{label:'Tempête',layers:['ring','streak','sparks'],impact:'blast'},
 frost:{label:'Givre',layers:['shards','motes'],impact:'freeze'},
 flame:{label:'Brasier',layers:['flames','motes'],impact:'burn'},
 venom:{label:'Venin',layers:['bubbles','motes'],impact:'rot'},
 shadow:{label:'Ombre',layers:['smoke','motes'],impact:'drain'},
 holy:{label:'Lumière',layers:['beam','motes'],impact:'radiant'},
 mend:{label:'Soins',layers:['bloom','motes'],impact:'mend'},
 ward:{label:'Protection',layers:['dome','motes'],impact:'ward'},
 buff:{label:'Renfort',layers:['rising','motes'],impact:'uplift'},
 control:{label:'Emprise',layers:['runes','shock'],impact:'lock'}
};

/** Couleurs par element. Deux teintes : le coeur et la trainee. */
export const ELEMENT_PALETTE={
 Feu:{core:'#fb923c',trail:'#7c2d12',glow:'#f97316'},
 Eau:{core:'#38bdf8',trail:'#0c4a6e',glow:'#0ea5e9'},
 Nature:{core:'#4ade80',trail:'#14532d',glow:'#22c55e'},
 Lumière:{core:'#fde68a',trail:'#78350f',glow:'#fbbf24'},
 Ombre:{core:'#c084fc',trail:'#3b0764',glow:'#a855f7'},
 Arcane:{core:'#818cf8',trail:'#1e1b4b',glow:'#6366f1'},
 neutral:{core:'#e2e8f0',trail:'#334155',glow:'#94a3b8'}
};
export const paletteFor=element=>ELEMENT_PALETTE[element]||ELEMENT_PALETTE.neutral;

/** Archetype impose par un effet precis, quand l'element ne suffit pas. */
const PAR_EFFET={
 // Soins, boucliers, renforts : l'intention prime sur l'element.
 healingSeed:'mend',seedBloom:'mend',livingGarden:'mend',totemHeal:'mend',healingTotem:'mend',
 totemTide:'mend',renewingMist:'mend',mistStrike:'mend',revival:'mend',atonementPenance:'mend',
 rescueShield:'ward',rescueSanctuary:'ward',guardianWall:'ward',atonementShield:'ward',
 guardianLink:'ward',soulMetamorphosis:'ward',
 // Controle : ce qui bloque doit se voir bloquer.
 impactQuake:'control',unstableStun:'control',gardenPrison:'control',frostShatter:'control',
 huntMark:'control',condemnStrip:'control',shieldExpose:'control',timeAnchor:'control',
 timeRestore:'buff',prepareAim:'buff',vanish:'buff',refluxRelease:'buff',furyRecklessness:'buff',
 // Formes reconnaissables.
 frostBolt:'frost',frostNova:'frost',
 emberBurn:'flame',emberSpread:'flame',emberDetonate:'flame',
 virulentPoison:'venom',virulentSpread:'venom',alchemyPoison:'venom',alchemyMix:'venom',
 alchemyCatalyst:'venom',festeringStrike:'venom',festeringSpread:'venom',apocalypse:'venom',
 agony:'shadow',corruption:'shadow',rapture:'shadow',soulSigil:'shadow',
 holyPowerStrike:'holy',holyPowerStorm:'holy',holyPowerVerdict:'holy',condemnJudgment:'holy',
 arcaneBlast:'burst',arcaneBarrage:'storm',arcaneOrb:'storm',
 bladeDance:'slash',bladeDanceDrain:'slash',bladeDanceStorm:'storm',
 impactStrike:'heavy',impactFracture:'heavy',guardianStrike:'heavy',shieldBreaker:'heavy',
 aimBuilder:'pierce',aimShot:'pierce',huntStrike:'pierce',huntFinish:'pierce'
};

/** Archetype deduit de l'element, quand rien de plus precis ne s'applique. */
const PAR_ELEMENT={Feu:'flame',Eau:'frost',Nature:'venom',Lumière:'holy',Ombre:'shadow',Arcane:'burst'};

/** Archetype deduit du type d'evenement, en dernier recours. */
const PAR_TYPE={heal:'mend',shield:'ward',dot:'venom',recoil:'shadow',ghoul:'shadow'};

/**
 * Effet visuel d'un evenement de combat.
 *
 * L'ordre de decision compte : le type d'evenement gagne pour les soins et les
 * boucliers (un soin doit ressembler a un soin, quel que soit l'element), puis
 * le sort nomme, puis l'element, puis une entaille neutre.
 */
export function vfxForEvent(event={}){
 const type=event.type||'damage';
 const archetypeId=(type!=='damage'&&PAR_TYPE[type])
  ||PAR_EFFET[event.skillEffect]
  ||PAR_ELEMENT[event.element]
  ||'slash';
 const archetype=VFX_ARCHETYPES[archetypeId]||VFX_ARCHETYPES.slash;
 const palette=paletteFor(event.element);
 // Un critique et une affinite efficace intensifient sans changer la forme :
 // le joueur doit reconnaitre le sort avant de lire sa puissance.
 const intensity=(event.critical?1.35:1)*(event.affinity==='effective'?1.15:event.affinity==='weak'?.85:1);
 return{id:archetypeId,...archetype,palette,
  intensity:Math.round(intensity*100)/100,
  duration:Math.round(520*(event.critical?1.2:1))};
}

/** Tous les archetypes existants, pour les verifications globales. */
export const archetypeIds=()=>Object.keys(VFX_ARCHETYPES);
/** Couches CSS distinctes utilisees par l'ensemble des archetypes. */
export const allLayers=()=>[...new Set(Object.values(VFX_ARCHETYPES).flatMap(entry=>entry.layers))];
export const allImpacts=()=>[...new Set(Object.values(VFX_ARCHETYPES).map(entry=>entry.impact))];
