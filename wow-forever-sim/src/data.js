// Données du sim Survie mêlée — WoW Forever.
// Chaque valeur incertaine porte un niveau de fiabilité (`conf`) et ses sources (`src`),
// pour pouvoir la corriger dès qu'un tooltip change en bêta.

export const DATA_INFO = {
  updated: '2026-10-12',
  build: '1.60.1.70338',
  note: 'Bêta WoW Forever (fin le 21 octobre, sortie le 4 novembre 2026). Les chiffres peuvent encore changer.',
};

export const CONFIDENCE = {
  client: { label: 'Client', desc: 'Lu dans les données du client Forever (build 1.60.1.70338) exportées par wowsims/gamedata, la même source que Wowhead.' },
  officiel: { label: 'Officiel', desc: 'Notes de développement ou article Blizzard.' },
  communaute: { label: 'Communauté', desc: 'Datamining ou guides de la bêta, sources concordantes ou presque.' },
  classic: { label: 'Classic', desc: 'Valeur de Classic Era reprise faute de donnée Forever.' },
  estime: { label: 'Estimé', desc: 'Hypothèse du sim, à vérifier en jeu.' },
};

export const SOURCES = {
  gamedata: {
    label: 'wowsims/gamedata — sorts et objets lus dans le client WoW Forever (build 1.60.1.70338, 12 octobre 2026)',
    url: 'https://github.com/wowsims/gamedata',
  },
  wowheadForever: {
    label: 'Wowhead — base de données WoW Forever',
    url: 'https://www.wowhead.com/forever',
  },
  devnotes: {
    label: 'Blizzard — Forever Beta Development Notes (8 octobre 2026)',
    url: 'https://us.forums.blizzard.com/en/wow/t/wow-forever-beta-development-notes-%E2%80%93-updated-october-8/2360696/4',
  },
  deepdive: {
    label: 'Blizzard — Class Deep Dives : Hunter and Druid',
    url: 'https://worldofwarcraft.blizzard.com/en-us/news/24301515',
  },
  wowsims: {
    label: 'wowsims/sod — table d’attaque Classic et stats de base (code open source)',
    url: 'https://github.com/wowsims/sod',
  },
  magey: {
    label: 'magey/classic-warrior — Attack table (Classic)',
    url: 'https://github.com/magey/classic-warrior/wiki/Attack-table',
  },
  mobalytics: {
    label: 'Mobalytics — Survival Hunter Guide (Forever)',
    url: 'https://mobalytics.gg/wow-forever/classes/survival-hunter-guide',
  },
  icyveins: {
    label: 'Icy Veins — Survival Hunter mêlée (Forever)',
    url: 'https://www.icy-veins.com/wow-forever/survival-hunter-melee-dps-pve-guide',
  },
  classicwowgg: {
    label: 'classicwow.gg — Survival Hunter Overview & Changes (Forever)',
    url: 'https://classicwow.gg/forever/guides/hunter/survival',
  },
  wclboxMongoose: {
    label: 'WCLBox — Mongoose Bite, rangs Forever vs Classic',
    url: 'https://wowforever.wclbox.com/en/fashu/hunter/hunter-mongoose-bite',
  },
  wfTalents: {
    label: 'WoW Forever Talents — talents et sorts du chasseur',
    url: 'https://wowforevertalents.com/hunter/',
  },
  striderKick: {
    label: 'WoW Forever Talents — Strider Kick',
    url: 'https://wowforevertalents.com/hunter/talents/strider-kick/',
  },
  foreverdb: {
    label: 'ForeverDB — stats et conversions',
    url: 'https://foreverdb.net/stats',
  },
  itemization: {
    label: 'EndGame Tools — itemisation Forever (toucher et crit unifiés)',
    url: 'https://endgametools.com/en/wow-forever/news/wow-forever-itemization',
  },
  foreverchanges: {
    label: 'ForeverChanges — changements du chasseur vs Classic',
    url: 'https://foreverchanges.pro/class/hunter',
  },
  counterattack: {
    label: 'The Forever Era — Counterattack',
    url: 'https://theforeverera.com/en/spells/hunter/counterattack/',
  },
  leprestore: {
    label: 'LepreStore — Survival Hunter niveau 30 (2M vs ambidextrie)',
    url: 'https://leprestore.com/guides/world-of-warcraft-forever/wow-forever-survival-hunter-guide-best-builds-race-professions/',
  },
  mmonster: {
    label: 'MMOnster — Rotation trainer chasseur (coûts niveau 30)',
    url: 'https://mmonster.co/wow-forever/tools/rotation-trainer/hunter',
  },
  forevergithub: {
    label: 'classic-hunter/forever-hunter — wiki « Forever Beta Changes »',
    url: 'https://github.com/classic-hunter/forever-hunter/wiki/Forever-Beta-Changes',
  },
};

export const LEVELS = [60, 30];

// Stats de base d’un chasseur humain (wowsims). Niveau 30 interpolé entre 25 et 40.
export const BASE_STATS = {
  60: { str: 55, agi: 125, sta: 90, int: 65, spi: 70, mana: 1720 },
  30: { str: 34, agi: 64, sta: 49, int: 38, spi: 41, mana: 776 },
};

export const RACES = {
  orc: {
    name: 'Orc',
    offsets: { str: 3, agi: -3, sta: 2, int: -3, spi: 3 },
    skill: { axe: 5 },
    cooldown: 'bloodFury',
    note: 'Spécialisation hache (+5 compétence), Fureur sanguinaire.',
  },
  troll: {
    name: 'Troll',
    offsets: { str: 1, agi: 2, sta: 1, int: -4, spi: 1 },
    skill: {},
    cooldown: 'berserking',
    note: 'Berserker (+10 % de hâte à pleine vie).',
  },
  tauren: {
    name: 'Tauren',
    offsets: { str: 5, agi: -5, sta: 2, int: -5, spi: 2 },
    skill: {},
    note: 'Pas de racial offensif en mêlée.',
  },
  nightelf: {
    name: 'Elfe de la nuit',
    offsets: { str: -3, agi: 5, sta: -1, int: 0, spi: 0 },
    skill: {},
    note: 'Pas de racial offensif en mêlée.',
  },
  dwarf: {
    name: 'Nain',
    offsets: { str: 2, agi: -4, sta: 3, int: -1, spi: -1 },
    skill: {},
    note: 'Spécialisation armes à feu : distance uniquement.',
  },
  human: {
    name: 'Humain',
    offsets: {},
    skill: { sword: 5, mace: 5 },
    note: 'Si la combinaison existe dans Forever : +5 épée et masse.',
  },
};

export const WEAPON_TYPES = {
  axe: 'Hache',
  sword: 'Épée',
  mace: 'Masse',
  polearm: 'Arme d’hast',
  staff: 'Bâton',
  dagger: 'Dague',
  fist: 'Arme de pugilat',
};

export const ENCHANTS = {
  none: { name: 'Aucun' },
  crusader: { name: 'Croisé', conf: 'classic' },
  agility: { name: 'Agilité (+15, 2M : +25)', conf: 'classic' },
  strength: { name: 'Force (+15)', conf: 'classic' },
  counterweight: { name: 'Contrepoids (+3 % hâte)', conf: 'classic' },
};

export const ON_USE_PRESETS = {
  none: { name: 'Aucun' },
  earthstrike: { name: 'Frappe-terre (+280 PA, 20 s / 2 min)', type: 'ap', value: 280, duration: 20, cd: 120 },
  kiss: { name: 'Baiser de l’araignée (+20 % hâte, 15 s / 2 min)', type: 'haste', value: 20, duration: 15, cd: 120 },
  custom: { name: 'Personnalisé', type: 'ap', value: 200, duration: 20, cd: 120 },
};

// Paramètres de mécanique : tout est modifiable dans l’onglet « Hypothèses ».
// `value` peut dépendre du niveau ({ 60: x, 30: y }).
export const MECHANICS = [
  // Formules de base
  { key: 'agiPerCrit', group: 'Formules', label: 'Agilité pour 1 % de crit', value: { 60: 52.9, 30: 24.0 }, step: 0.1, conf: 'communaute', src: ['foreverdb', 'wowsims'], note: 'ForeverDB mesure ~52,9 au niveau 60 (spéculatif) et ~24,0 au niveau 30.' },
  { key: 'baseCrit', group: 'Formules', label: 'Crit de base (sans Agilité), %', value: 0, step: 0.1, conf: 'classic', src: ['wowsims', 'foreverdb'], note: 'Non datamineable dans Forever : la bêta doit le mesurer.' },
  { key: 'apPerAgi', group: 'Formules', label: 'PA de mêlée par point d’Agilité', value: 1, step: 0.1, conf: 'communaute', src: ['itemization', 'foreverdb'] },
  { key: 'apPerStr', group: 'Formules', label: 'PA de mêlée par point de Force', value: 1, step: 0.1, conf: 'communaute', src: ['icyveins'] },
  { key: 'apPerDps', group: 'Formules', label: 'PA pour 1 DPS d’arme', value: 14, step: 1, conf: 'communaute', src: ['foreverdb'] },
  { key: 'gcd', group: 'Formules', label: 'Temps de recharge global (s)', value: 1.5, step: 0.1, conf: 'client', src: ['gamedata'], note: 'GCD de 1,5 s sur Mongoose Bite, Strider Kick, Counterattack et Lacerate.' },
  { key: 'reaction', group: 'Formules', label: 'Temps de réaction aux procs (s)', value: 0.2, step: 0.05, conf: 'estime', src: [], note: 'Délai entre un proc (Expose Prey, esquive) et la Morsure.' },
  { key: 'glancing', group: 'Formules', label: 'Coups érafles sur les attaques blanches', value: true, conf: 'classic', src: ['magey', 'wowsims'] },
  { key: 'critSuppression', group: 'Formules', label: 'Réduction de crit contre un boss +3', value: true, conf: 'classic', src: ['magey', 'wowsims'] },
  { key: 'dwMissPenalty', group: 'Formules', label: 'Pénalité de raté ambidextrie (blanc), %', value: 19, step: 1, conf: 'classic', src: ['wowsims'] },
  { key: 'ohPenalty', group: 'Formules', label: 'Dégâts de la main gauche, % (avant talents)', value: 50, step: 1, conf: 'classic', src: ['wowsims'] },
  { key: 'normSpeed2h', group: 'Formules', label: 'Vitesse normalisée, arme à deux mains (s)', value: 3.3, step: 0.1, conf: 'estime', src: ['gamedata'], note: 'Mongoose Bite, Strider Kick et Counterattack utilisent des « dégâts d’arme normalisés » dans le client. Valeurs standard de WoW.' },
  { key: 'normSpeed1h', group: 'Formules', label: 'Vitesse normalisée, arme à une main (s)', value: 2.4, step: 0.1, conf: 'estime', src: ['gamedata'] },
  { key: 'normSpeedDagger', group: 'Formules', label: 'Vitesse normalisée, dague (s)', value: 1.7, step: 0.1, conf: 'estime', src: ['gamedata'] },

  // Scores des objets (Forever affiche toucher, crit, hâte et expertise en scores)
  { key: 'hitRatingPerPct', group: 'Scores des objets', label: 'Score de toucher pour 1 %', value: { 60: 10, 30: 4.23 }, step: 0.01, conf: 'client', src: ['gamedata'], note: '1 % de toucher en Classic devient +10 en Forever (Pendentif croc d’Onyxia, Heaume Cœur-de-lion). Niveau 30 estimé (échelle de TBC).' },
  { key: 'critRatingPerPct', group: 'Scores des objets', label: 'Score de crit pour 1 %', value: { 60: 14, 30: 5.92 }, step: 0.01, conf: 'client', src: ['gamedata'], note: '1 % de crit en Classic devient +14 en Forever (Jambières en diablosaure). Niveau 30 estimé.' },
  { key: 'hasteRatingPerPct', group: 'Scores des objets', label: 'Score de hâte pour 1 %', value: { 60: 10, 30: 4.23 }, step: 0.01, conf: 'estime', src: [], note: 'Valeur du niveau 60 de TBC.' },
  { key: 'expertiseRatingPerPct', group: 'Scores des objets', label: 'Score d’expertise pour 1 % (esquive/parade)', value: { 60: 10, 30: 4.23 }, step: 0.01, conf: 'estime', src: ['itemization'], note: 'Valeur du niveau 60 de TBC (2,5 par point d’expertise, 0,25 % par point).' },

  // Raptor Strike
  { key: 'raptorBonus', group: 'Raptor Strike', label: 'Bonus de dégâts (dégâts d’arme + X)', value: { 60: 70, 30: 30 }, step: 1, conf: 'client', src: ['gamedata'], note: 'Rang 8 : arme + 70 ; rang 4 (niveau 30) : arme + 30. Dégâts d’arme non normalisés.' },
  { key: 'raptorMana', group: 'Raptor Strike', label: 'Coût en mana', value: { 60: 100, 30: 45 }, step: 1, conf: 'client', src: ['gamedata'] },
  { key: 'raptorCd', group: 'Raptor Strike', label: 'Recharge (s)', value: 6, step: 0.5, conf: 'client', src: ['gamedata'] },
  { key: 'raptorMode', group: 'Raptor Strike', label: 'Fonctionnement', value: 'nextSwing', options: { nextSwing: 'Prochaine attaque (comme en Classic)', instantOffGcd: 'Instantané (hors GCD)', instant: 'Instantané (déclenche le GCD)' }, conf: 'estime', src: ['gamedata'], note: 'Le client ne donne pas de GCD à Raptor Strike, comme à Frappe héroïque (coup sur la prochaine attaque). « Instantané hors GCD » reste possible.' },

  // Mongoose Bite
  { key: 'mongooseBonus', group: 'Mongoose Bite', label: 'Bonus de dégâts (dégâts d’arme normalisés + X)', value: { 60: 57, 30: 22 }, step: 1, conf: 'client', src: ['gamedata', 'wclboxMongoose'], note: 'Rang 4 : arme normalisée + 57 ; rang 2 (niveau 30) : + 22.' },
  { key: 'mongooseMana', group: 'Mongoose Bite', label: 'Coût en mana', value: { 60: 65, 30: 40 }, step: 1, conf: 'client', src: ['gamedata'] },
  { key: 'mongooseCd', group: 'Mongoose Bite', label: 'Recharge (s)', value: 5, step: 0.5, conf: 'client', src: ['gamedata'] },
  { key: 'dodgeWindow', group: 'Mongoose Bite', label: 'Fenêtre après une esquive (s)', value: 5, step: 0.5, conf: 'classic', src: ['wowsims'] },

  // Expose Prey
  { key: 'exposePreyChance', group: 'Expose Prey', label: 'Chance de proc par rang, %', value: 5, step: 0.5, conf: 'client', src: ['gamedata', 'mobalytics'], note: 'Le client donne 10 % au rang maximal, sur les attaques et techniques de mêlée et à distance.' },
  { key: 'exposePreyWindow', group: 'Expose Prey', label: 'Durée de la fenêtre Mongoose (s)', value: 10, step: 0.5, conf: 'officiel', src: ['devnotes'], note: 'Passée de 5 à 10 s le 8 octobre.' },
  { key: 'exposePreyOn', group: 'Expose Prey', label: 'Attaques qui peuvent déclencher', value: 'all', options: { all: 'Toutes les attaques qui touchent', white: 'Attaques automatiques seulement' }, conf: 'client', src: ['gamedata'] },

  // Lacerating Strikes
  { key: 'laceratingPct', group: 'Lacerating Strikes', label: 'Saignement, % des dégâts de la Morsure', value: 40, step: 1, conf: 'client', src: ['gamedata', 'deepdive'] },
  { key: 'laceratingDuration', group: 'Lacerating Strikes', label: 'Durée (s)', value: 21, step: 1, conf: 'client', src: ['gamedata'] },
  { key: 'laceratingTick', group: 'Lacerating Strikes', label: 'Intervalle entre tics (s)', value: 3, step: 0.5, conf: 'client', src: ['gamedata'] },
  { key: 'laceratingRefresh', group: 'Lacerating Strikes', label: 'Réapplication', value: 'replace', options: { replace: 'Remplace (le reste est perdu)', rolling: 'Cumule le reste dans le nouveau' }, conf: 'estime', src: [], note: 'Comportement non documenté. « Remplace » est l’hypothèse prudente.' },
  { key: 'laceratingCanCrit', group: 'Lacerating Strikes', label: 'Les tics peuvent critiquer', value: true, conf: 'client', src: ['gamedata'], note: 'Attribut « periodic can crit » dans le client.' },

  // Lacerate (technique)
  { key: 'lacerateTick', group: 'Lacerate', label: 'Dégâts par tic (7 tics en 21 s)', value: { 60: 58, 30: 28 }, step: 1, conf: 'client', src: ['gamedata'], note: 'Rang 4 : 58 par tic au niveau 60. Niveau 30 : rang 2 supposé appris.' },
  { key: 'lacerateMana', group: 'Lacerate', label: 'Coût en mana', value: { 60: 95, 30: 65 }, step: 1, conf: 'client', src: ['gamedata'] },
  { key: 'lacerateDuration', group: 'Lacerate', label: 'Durée (s)', value: 21, step: 1, conf: 'client', src: ['gamedata'] },

  // Strider Kick & Counterattack
  { key: 'striderWeaponPct', group: 'Strider Kick', label: 'Dégâts, % de l’arme normalisée', value: 100, step: 5, conf: 'client', src: ['gamedata', 'striderKick'] },
  { key: 'striderManaPct', group: 'Strider Kick', label: 'Coût, % du mana de base', value: 5.81, step: 0.01, conf: 'client', src: ['gamedata'] },
  { key: 'striderCd', group: 'Strider Kick', label: 'Recharge (s)', value: 8, step: 0.5, conf: 'client', src: ['gamedata'] },
  { key: 'counterWeaponPct', group: 'Counterattack', label: 'Dégâts, % de (arme normalisée + bonus)', value: 50, step: 5, conf: 'client', src: ['gamedata'] },
  { key: 'counterBonus', group: 'Counterattack', label: 'Bonus de dégâts', value: { 60: 110, 30: 40 }, step: 1, conf: 'client', src: ['gamedata'], note: 'Rang 4 au niveau 60, rang 2 au niveau 30.' },
  { key: 'counterMana', group: 'Counterattack', label: 'Coût en mana', value: { 60: 85, 30: 45 }, step: 1, conf: 'client', src: ['gamedata'] },
  { key: 'counterCd', group: 'Counterattack', label: 'Recharge (s)', value: 5, step: 0.5, conf: 'client', src: ['gamedata'] },

  // Piège d’immolation
  { key: 'trapDamage', group: 'Piège d’immolation', label: 'Dégâts de Feu totaux', value: { 60: 690, 30: 215 }, step: 5, conf: 'client', src: ['gamedata'], note: '5 tics de 138 (rang 5) ou de 43 (rang 2).' },
  { key: 'trapMana', group: 'Piège d’immolation', label: 'Coût en mana', value: { 60: 245, 30: 90 }, step: 5, conf: 'client', src: ['gamedata'] },
  { key: 'trapDuration', group: 'Piège d’immolation', label: 'Durée du DoT (s)', value: 15, step: 1, conf: 'client', src: ['gamedata'] },
  { key: 'trapCd', group: 'Piège d’immolation', label: 'Recharge (s)', value: 30, step: 1, conf: 'client', src: ['gamedata'], note: '30 s dans le client (15 s en Classic).' },
  { key: 'trapCanCrit', group: 'Piège d’immolation', label: 'Les tics peuvent critiquer (×1,5)', value: true, conf: 'client', src: ['gamedata'] },
  { key: 'trapArm', group: 'Piège d’immolation', label: 'Délai avant déclenchement (s)', value: 1, step: 0.5, conf: 'estime', src: [] },

  // Talents
  { key: 'savageStrikesPerRank', group: 'Talents', label: 'Savage Strikes, % par rang', value: 10, step: 0.5, conf: 'client', src: ['gamedata'], note: 'Le client donne +20 % de crit à Raptor Strike, Mongoose Bite et d’autres techniques de mêlée, pas aux attaques auto. Les guides de septembre parlaient de 2 % par rang.' },
  { key: 'savageStrikesMode', group: 'Talents', label: 'Savage Strikes, effet', value: 'crit', options: { crit: 'Crit des techniques de mêlée', damage: 'Tous les dégâts de mêlée' }, conf: 'client', src: ['gamedata'] },
  { key: 'predatorCritPerRank', group: 'Talents', label: 'Predator’s Edge, dégâts critiques % par rang', value: 6, step: 1, conf: 'client', src: ['gamedata'], note: '+30 % au rang maximal.' },
  { key: 'predatorOhPerRank', group: 'Talents', label: 'Predator’s Edge, dégâts main gauche % par rang', value: 10, step: 1, conf: 'client', src: ['gamedata'], note: '+50 % au rang maximal.' },
  { key: 'predatorScope', group: 'Talents', label: 'Predator’s Edge, coups concernés', value: 'abilities', options: { abilities: 'Techniques et saignements', all: 'Toutes les attaques de mêlée' }, conf: 'client', src: ['gamedata'], note: 'Le client l’applique à une liste de techniques du chasseur, pas aux attaques auto.' },
  { key: 'predatorCritMode', group: 'Talents', label: 'Predator’s Edge, application', value: 'bonus', options: { bonus: 'Sur le bonus de crit (200 % → 230 %)', total: 'Sur le total (200 % → 260 %)' }, conf: 'client', src: ['gamedata'], note: 'Modificateur « CRIT_DAMAGE_BONUS », comme Mortal Shots.' },
  { key: 'lightningReflexesPerRank', group: 'Talents', label: 'Lightning Reflexes, % Agilité par rang', value: 2, step: 0.5, conf: 'communaute', src: ['classicwowgg', 'wfTalents'], note: 'Absent de l’export du client : valeur des guides.' },
  { key: 'lethalAttacksPerRank', group: 'Talents', label: 'Lethal Attacks, % de crit par rang', value: 1, step: 0.5, conf: 'client', src: ['gamedata'] },
  { key: 'surefootedPerRank', group: 'Talents', label: 'Surefooted, % toucher par rang', value: 1, step: 0.5, conf: 'client', src: ['gamedata'], note: '+3 % au rang maximal.' },
  { key: 'resourcefulnessPerRank', group: 'Talents', label: 'Resourcefulness, % de mana économisé par rang', value: 30, step: 5, conf: 'client', src: ['gamedata'], note: '−60 % au rang maximal.' },
  { key: 'resourcefulnessProc', group: 'Talents', label: 'Resourcefulness, chance sur crit de garder 50 % de la regen (30 s), %', value: 0, step: 5, conf: 'estime', src: ['wfTalents'], note: 'Le client ne donne pas le taux.' },
  { key: 'cleverTrapsPerRank', group: 'Talents', label: 'Clever Traps, % dégâts des pièges par rang', value: 15, step: 5, conf: 'client', src: ['gamedata'], note: '+30 % au rang maximal.' },
  { key: 'survivalistsDiscipline', group: 'Talents', label: 'Survivalist’s Discipline, % de recharge des pièges', value: 40, step: 5, conf: 'client', src: ['gamedata'] },
  { key: 'survivalTacticsPerRank', group: 'Talents', label: 'Survival Tactics, % toucher des pièges par rang', value: 5, step: 1, conf: 'communaute', src: ['wfTalents', 'deepdive'], note: 'Les sources donnent 5 % ou 10 % au total.' },
  { key: 'improvedTrackingPerRank', group: 'Talents', label: 'Improved Tracking, % dégâts par rang (cible pistée)', value: 1, step: 0.5, conf: 'client', src: ['gamedata'], note: '+5 % au rang maximal.' },
  { key: 'focusedFirePerRank', group: 'Talents', label: 'Focused Fire, % dégâts par rang (familier actif)', value: 2, step: 0.5, conf: 'client', src: ['gamedata'], note: '+4 % au rang maximal.' },
  { key: 'deadlyAspectsChance', group: 'Talents', label: 'Deadly Aspects, chance sur attaque auto, %', value: 10, step: 0.5, conf: 'client', src: ['gamedata', 'foreverchanges'], note: 'Le talent ajoute 10 points de chance au proc « Quick Strikes » d’Aspect of the Beast. Chance de base inconnue.' },
  { key: 'deadlyAspectsHaste', group: 'Talents', label: 'Deadly Aspects, hâte de mêlée, %', value: 30, step: 1, conf: 'communaute', src: ['foreverchanges'] },
  { key: 'deadlyAspectsDuration', group: 'Talents', label: 'Deadly Aspects, durée (s)', value: 12, step: 1, conf: 'communaute', src: ['foreverchanges'] },

  // Aspects et raciaux
  { key: 'beastAp', group: 'Aspects et raciaux', label: 'Aspect of the Beast, PA de mêlée', value: { 60: 110, 30: 50 }, step: 5, conf: 'client', src: ['gamedata', 'forevergithub'], note: '4 rangs : 50 / 70 / 90 / 110.' },
  { key: 'bloodFuryPct', group: 'Aspects et raciaux', label: 'Fureur sanguinaire, % du PA de base', value: 25, step: 1, conf: 'classic', src: ['wowsims'] },
  { key: 'berserkingHaste', group: 'Aspects et raciaux', label: 'Berserker, % de hâte', value: 10, step: 1, conf: 'classic', src: ['wowsims'] },
  { key: 'windfuryChance', group: 'Aspects et raciaux', label: 'Totem Furie-des-vents, chance %', value: 20, step: 1, conf: 'classic', src: ['wowsims'] },
];

// Talents utiles au sim. `need` = points requis dans l’arbre (pour l’affichage).
export const TALENTS = [
  { id: 'savageStrikes', tree: 'Survie', name: 'Savage Strikes', max: 2, need: 5, desc: '+Crit des techniques de mêlée (+20 % au rang maximal).' },
  { id: 'lightningReflexes', tree: 'Survie', name: 'Lightning Reflexes', max: 5, need: 25, desc: '+Agilité en %.' },
  { id: 'lethalAttacks', tree: 'Précision', name: 'Lethal Attacks', max: 5, need: 0, desc: '+1 % de crit par rang (physique et sorts).' },
  { id: 'surefooted', tree: 'Survie', name: 'Surefooted', max: 3, need: 10, desc: '+Toucher (unifié mêlée, distance, sorts).' },
  { id: 'predatorsEdge', tree: 'Survie', name: 'Predator’s Edge', max: 5, need: 10, desc: '+Dégâts critiques des techniques et +dégâts de la main gauche.' },
  { id: 'counterattack', tree: 'Survie', name: 'Counterattack', max: 1, need: 15, desc: 'Après une parade : 50 % de l’arme + bonus, inévitable.' },
  { id: 'resourcefulness', tree: 'Survie', name: 'Resourcefulness', max: 2, need: 20, desc: '−Coût en mana des techniques de mêlée et des pièges.' },
  { id: 'exposePrey', tree: 'Survie', name: 'Expose Prey', max: 2, need: 20, desc: 'Les attaques sur une cible marquée activent Mongoose Bite.' },
  { id: 'striderKick', tree: 'Survie', name: 'Strider Kick', max: 1, need: 20, desc: 'Coup de pied : 100 % de l’arme, 8 s de recharge.' },
  { id: 'laceratingStrikes', tree: 'Survie', name: 'Lacerating Strikes', max: 1, need: 30, minLevel: 40, desc: 'Mongoose Bite fait saigner : 40 % de ses dégâts en 21 s.' },
  { id: 'cleverTraps', tree: 'Survie', name: 'Clever Traps', max: 2, need: 10, desc: '+Dégâts du Piège d’immolation.' },
  { id: 'survivalistsDiscipline', tree: 'Survie', name: 'Survivalist’s Discipline', max: 1, need: 20, desc: '−Recharge des pièges.' },
  { id: 'survivalTactics', tree: 'Survie', name: 'Survival Tactics', max: 2, need: 10, desc: '+Toucher des pièges.' },
  { id: 'improvedTracking', tree: 'Survie', name: 'Improved Tracking', max: 5, need: 0, desc: '+Dégâts contre le type de créature pisté (hypothèse).' },
  { id: 'deadlyAspects', tree: 'Maîtrise des bêtes', name: 'Deadly Aspects', max: 1, need: 5, desc: 'Sous Aspect of the Beast : procs de +30 % de vitesse d’attaque.' },
  { id: 'focusedFire', tree: 'Maîtrise des bêtes', name: 'Focused Fire', max: 2, need: 0, desc: '+Dégâts tant que le familier est actif (valeur estimée).' },
];

export const TALENT_PRESETS = {
  60: {
    savageStrikes: 2, lightningReflexes: 5, surefooted: 3, predatorsEdge: 5, counterattack: 1,
    resourcefulness: 2, exposePrey: 2, striderKick: 1, laceratingStrikes: 1, cleverTraps: 0,
    survivalistsDiscipline: 0, survivalTactics: 0, improvedTracking: 0, deadlyAspects: 0, focusedFire: 0, lethalAttacks: 0,
  },
  30: {
    savageStrikes: 2, lightningReflexes: 0, surefooted: 0, predatorsEdge: 4, counterattack: 1,
    resourcefulness: 2, exposePrey: 2, striderKick: 1, laceratingStrikes: 0, cleverTraps: 0,
    survivalistsDiscipline: 0, survivalTactics: 0, improvedTracking: 0, deadlyAspects: 0, focusedFire: 0, lethalAttacks: 0,
  },
};

// Buffs, débuffs et consommables (valeurs Classic : leur présence dans Forever reste à confirmer).
// `group` = un seul actif par groupe. `stats` peut dépendre du niveau.
export const BUFFS = [
  { id: 'battleShout', cat: 'Raid', name: 'Cri de guerre', stats: { 60: { ap: 193 }, 30: { ap: 57 } } },
  { id: 'blessingOfMight', cat: 'Raid', name: 'Bénédiction de puissance', stats: { 60: { ap: 155 }, 30: { ap: 55 } } },
  { id: 'markOfTheWild', cat: 'Raid', name: 'Marque du fauve', stats: { 60: { str: 12, agi: 12, sta: 12, int: 12, spi: 12 }, 30: { str: 6, agi: 6, sta: 6, int: 6, spi: 6 } } },
  { id: 'blessingOfKings', cat: 'Raid', name: 'Bénédiction des rois (+10 % stats)', stats: { statPct: 10 } },
  { id: 'trueshotAura', cat: 'Raid', name: 'Aura de précision', stats: { 60: { ap: 100 }, 30: {} } },
  { id: 'leaderOfThePack', cat: 'Raid', name: 'Chef de la meute (+3 % crit)', stats: { crit: 3 } },
  { id: 'strengthOfEarth', cat: 'Raid', name: 'Totem de force de la terre', stats: { 60: { str: 61 }, 30: { str: 20 } } },
  { id: 'graceOfAir', cat: 'Raid', name: 'Totem de grâce aérienne', stats: { 60: { agi: 67 }, 30: {} } },
  { id: 'windfury', cat: 'Raid', name: 'Totem Furie-des-vents', stats: { 60: { windfuryAp: 315 }, 30: {} } },
  { id: 'blessingOfWisdom', cat: 'Raid', name: 'Bénédiction de sagesse', stats: { 60: { mp5: 30 }, 30: { mp5: 15 } } },

  { id: 'mongoose', cat: 'Consommables', group: 'agiElixir', name: 'Élixir de la mangouste (+25 Agi, +2 % crit)', stats: { agi: 25, crit: 2 } },
  { id: 'greaterAgility', cat: 'Consommables', group: 'agiElixir', name: 'Élixir d’agilité supérieure (+25 Agi)', stats: { agi: 25 } },
  { id: 'agilityElixir', cat: 'Consommables', group: 'agiElixir', name: 'Élixir d’agilité (+15 Agi)', stats: { agi: 15 } },
  { id: 'jujuPower', cat: 'Consommables', group: 'strElixir', name: 'Juju de pouvoir (+30 For)', stats: { str: 30 } },
  { id: 'giants', cat: 'Consommables', group: 'strElixir', name: 'Élixir des géants (+25 For)', stats: { str: 25 } },
  { id: 'jujuMight', cat: 'Consommables', group: 'apElixir', name: 'Juju de puissance (+40 PA)', stats: { ap: 40 } },
  { id: 'firewater', cat: 'Consommables', group: 'apElixir', name: 'Eau-de-feu des Tombe-hiver (+35 PA)', stats: { ap: 35 } },
  { id: 'dumplings', cat: 'Consommables', group: 'food', name: 'Boulettes du désert fumées (+20 For)', stats: { str: 20 } },
  { id: 'squid', cat: 'Consommables', group: 'food', name: 'Calmar grillé (+10 Agi)', stats: { agi: 10 } },
  { id: 'roids', cat: 'Consommables', group: 'scroll', name: 'R.O.I.D.S. (+25 For)', stats: { str: 25 } },
  { id: 'scorpok', cat: 'Consommables', group: 'scroll', name: 'Essai de scorpide broyé (+25 Agi)', stats: { agi: 25 } },
  { id: 'elementalStone', cat: 'Consommables', group: 'stone', name: 'Pierre à aiguiser élémentaire (+2 % crit)', stats: { crit: 2 } },
  { id: 'denseStone', cat: 'Consommables', group: 'stone', name: 'Pierre à aiguiser dense (+8 dégâts d’arme)', stats: { weaponDmg: 8 } },
  { id: 'manaPotion', cat: 'Consommables', name: 'Potions de mana majeures (1350–2250, 2 min)', stats: { manaPotion: 1 } },
  { id: 'manaRune', cat: 'Consommables', name: 'Runes démoniaques (900–1500, 2 min)', stats: { manaRune: 1 } },

  { id: 'rallyingCry', cat: 'Buffs de monde', name: 'Ralliement du tueur de dragon (+140 PA, +5 % crit)', stats: { ap: 140, crit: 5 } },
  { id: 'songflower', cat: 'Buffs de monde', name: 'Sérénade de Chantefleur (+5 % crit, +15 stats)', stats: { crit: 5, str: 15, agi: 15, sta: 15, int: 15, spi: 15 } },
  { id: 'zandalar', cat: 'Buffs de monde', name: 'Esprit de Zandalar (+15 % stats)', stats: { statPct: 15 } },
  { id: 'warchief', cat: 'Buffs de monde', name: 'Bénédiction du chef de guerre (+15 % hâte, 10 mp5)', stats: { haste: 15, mp5: 10 } },
  { id: 'fengus', cat: 'Buffs de monde', name: 'Férocité de Fengus (+200 PA)', stats: { ap: 200 } },

  { id: 'sunder', cat: 'Débuffs', name: 'Fracasser armure ×5', stats: { 60: { armorReduction: 2250 }, 30: { armorReduction: 900 } } },
  { id: 'faerieFire', cat: 'Débuffs', name: 'Lucioles', stats: { 60: { armorReduction: 505 }, 30: { armorReduction: 285 } } },
  { id: 'curseOfRecklessness', cat: 'Débuffs', name: 'Malédiction de témérité', stats: { 60: { armorReduction: 640 }, 30: { armorReduction: 290 } } },
];

export const BUFF_PRESETS = {
  60: ['battleShout', 'markOfTheWild', 'trueshotAura', 'leaderOfThePack', 'mongoose', 'jujuPower', 'jujuMight', 'dumplings', 'elementalStone', 'manaPotion', 'sunder', 'faerieFire', 'curseOfRecklessness'],
  30: ['battleShout', 'markOfTheWild', 'agilityElixir', 'sunder'],
};

export const ROTATION_ABILITIES = {
  mongoose: { name: 'Mongoose Bite', desc: 'Pendant une fenêtre (Expose Prey ou esquive). Arme normalisée + bonus.' },
  raptor: { name: 'Raptor Strike', desc: 'Dégâts d’arme + bonus, 6 s de recharge.' },
  striderKick: { name: 'Strider Kick', desc: 'Talent : 100 % de l’arme normalisée, 8 s de recharge.' },
  lacerate: { name: 'Lacerate', desc: 'Saignement de 21 s, relancé quand il se termine.' },
  counterattack: { name: 'Counterattack', desc: 'Talent : après une parade (si vous êtes attaqué).' },
  immolation: { name: 'Piège d’immolation', desc: 'DoT de Feu, ne suit pas le PA.' },
};

export const SAMPLE_WEAPONS = {
  60: {
    twoHand: { name: 'Exemple 2M : Faucheuse d’arcanite (Classic)', min: 153, max: 256, speed: 3.8, type: 'axe' },
    mh: { name: 'Exemple MD : Charge sacrée de Dal’Rend (Classic)', min: 81, max: 151, speed: 2.8, type: 'sword' },
    oh: { name: 'Exemple MG : Gardien tribal de Dal’Rend (Classic)', min: 52, max: 98, speed: 1.8, type: 'sword' },
  },
  30: {
    twoHand: { name: 'Exemple 2M niveau 30', min: 60, max: 91, speed: 3.4, type: 'axe' },
    mh: { name: 'Exemple MD niveau 30', min: 26, max: 49, speed: 2.6, type: 'sword' },
    oh: { name: 'Exemple MG niveau 30', min: 19, max: 36, speed: 1.9, type: 'sword' },
  },
};

export const GEAR_PRESETS = {
  60: { str: 90, agi: 180, sta: 150, int: 60, spi: 40, ap: 120, hit: 6, crit: 3, mp5: 0, haste: 0, expertise: 0, skill: 0 },
  30: { str: 30, agi: 60, sta: 50, int: 30, spi: 30, ap: 20, hit: 1, crit: 1, mp5: 0, haste: 0, expertise: 0, skill: 0 },
};

export const FIGHT_PRESETS = {
  60: { bossArmor: 3731 },
  30: { bossArmor: 1300 },
};

export function mechanicDefault(def, level) {
  const v = def.value;
  if (v !== null && typeof v === 'object') return v[level] ?? v[60];
  return v;
}

export function defaultMechanics(level) {
  const out = {};
  for (const def of MECHANICS) out[def.key] = mechanicDefault(def, level);
  return out;
}

export function defaultProfile(level = 60) {
  const w = SAMPLE_WEAPONS[level];
  return {
    name: level === 60 ? 'Survie 60 — 2M' : 'Survie 30 — bêta',
    level,
    race: 'orc',
    gear: { ...GEAR_PRESETS[level] },
    twoHand: true,
    mh: { min: w.twoHand.min, max: w.twoHand.max, speed: w.twoHand.speed, type: w.twoHand.type, enchant: 'crusader' },
    oh: { min: w.oh.min, max: w.oh.max, speed: w.oh.speed, type: w.oh.type, enchant: 'crusader' },
    talents: { ...TALENT_PRESETS[level] },
    buffs: [...BUFF_PRESETS[level]],
    aspect: 'beast',
    huntersMark: true,
    racial: true,
    trinkets: [{ preset: 'none' }, { preset: 'none' }],
    extraAttackChance: 0,
    rotation: [
      { id: 'mongoose', enabled: true, minMana: 0 },
      { id: 'raptor', enabled: true, minMana: 0 },
      { id: 'striderKick', enabled: true, minMana: 0 },
      { id: 'lacerate', enabled: true, minMana: 20 },
      { id: 'counterattack', enabled: true, minMana: 0 },
      { id: 'immolation', enabled: false, minMana: 30 },
    ],
    fight: {
      duration: 180,
      variance: 10,
      bossLevel: level + 3,
      bossArmor: FIGHT_PRESETS[level].bossArmor,
      behind: true,
      beingAttacked: false,
      bossSwing: 2.0,
      playerDodge: 5,
      playerParry: 5,
      trackedType: true,
    },
    pet: { enabled: false, dps: 0 },
    custom: { dmgPct: 0, crit: 0, ap: 0 },
    mechanics: defaultMechanics(level),
  };
}
