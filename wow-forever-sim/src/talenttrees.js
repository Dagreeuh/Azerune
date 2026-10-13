// Arbres de talents du chasseur dans WoW Forever : disposition, rangs, prérequis et règles de points.
//
// Disposition : grille de Classic (4 colonnes, 7 rangées, 5 points par rangée). Les talents qui
// réutilisent un sort de Classic dans le client gardent sa place (Improved Tracking reprend
// Monster Slaying, Deadly Aspects Improved Aspect of the Hawk, Survival Tactics Trap Mastery) ;
// les rangées des nouveaux talents viennent des guides de la bêta. Reste à confirmer en jeu.
//
// `desc` : texte du talent ; « {a/b/c} » donne la valeur de chaque rang.
// `sim` : le talent change le DPS simulé (ses valeurs suivent l’onglet Hypothèses).

export const TALENT_TREES = [
  {
    id: 'bm',
    name: 'Maîtrise des bêtes',
    talents: [
      { id: 'deadlyAspects', name: 'Deadly Aspects', row: 0, col: 1, max: 1, icon: 'ability_mount_pinktiger', sim: true,
        desc: 'Sous Aspect of the Beast, vos attaques automatiques peuvent déclencher Quick Strikes : +30 % de vitesse d’attaque en mêlée pendant 12 s.' },
      { id: 'enduranceTraining', name: 'Endurance Training', row: 0, col: 2, max: 5, icon: 'spell_nature_reincarnation',
        desc: '+{3/6/9/12/15} % de points de vie pour votre familier et +{1/2/3/4/5} % pour vous.' },
      { id: 'focusedFire', name: 'Focused Fire', row: 1, col: 0, max: 2, icon: 'ability_hunter_silenthunter', sim: true,
        desc: '+{2/4} % de dégâts tant que votre familier est actif.' },
      { id: 'improvedAspectOfTheMonkey', name: 'Improved Aspect of the Monkey', row: 1, col: 1, max: 5, icon: 'ability_hunter_aspectofthemonkey',
        desc: '+{1/2/3/4/5} % d’esquive sous Aspect of the Monkey.' },
      { id: 'pathfinding', name: 'Pathfinding', row: 1, col: 2, max: 2, icon: 'ability_mount_jungletiger',
        desc: '+{3/6} % de vitesse sous Aspect of the Cheetah et Aspect of the Pack.' },
      { id: 'improvedRevivePet', name: 'Improved Revive Pet', row: 1, col: 3, max: 2, icon: 'ability_hunter_beastsoothe',
        desc: 'Revive Pet : −{3/6} s d’incantation et −{20/40} % de mana.' },
      { id: 'bestialSwiftness', name: 'Bestial Swiftness', row: 2, col: 1, max: 1, icon: 'ability_druid_dash',
        desc: '+30 % de vitesse de déplacement pour votre familier en extérieur.' },
      { id: 'unleashedFury', name: 'Unleashed Fury', row: 2, col: 2, max: 5, icon: 'ability_bullrush',
        desc: '+{4/8/12/16/20} % de dégâts de mêlée pour votre familier.' },
      { id: 'improvedMendPet', name: 'Improved Mend Pet', row: 3, col: 1, max: 2, icon: 'ability_hunter_mendpet',
        desc: 'Mend Pet a {15/50} % de chances de dissiper un effet néfaste du familier.' },
      { id: 'ferocity', name: 'Ferocity', row: 3, col: 2, max: 5, icon: 'inv_misc_monsterclaw_04',
        desc: '+{3/6/9/12/15} % de chances de coup critique pour votre familier.' },
      { id: 'summonHawk', name: 'Summon Hawk', row: 3, col: 3, max: 1, icon: 'ability_hunter_pet_owl',
        desc: 'Un faucon vient attaquer votre cible à vos côtés.' },
      { id: 'spiritBond', name: 'Spirit Bond', row: 4, col: 0, max: 2, icon: 'ability_druid_demoralizingroar',
        desc: 'Vous et votre familier récupérez {1/2} % de vos points de vie toutes les 10 s.' },
      { id: 'intimidation', name: 'Intimidation', row: 4, col: 1, max: 1, icon: 'ability_devour',
        desc: 'Votre familier intimide la cible, qui est étourdie 3 s.' },
      { id: 'bestialDiscipline', name: 'Bestial Discipline', row: 4, col: 3, max: 2, icon: 'spell_nature_abolishmagic',
        desc: '+{10/20} % de régénération de focus pour votre familier.' },
      { id: 'frenzy', name: 'Frenzy', row: 5, col: 2, max: 5, icon: 'inv_misc_monsterclaw_03', req: 'ferocity',
        desc: 'Après un coup critique, votre familier a {20/40/60/80/100} % de chances de gagner +30 % de vitesse d’attaque pendant 8 s.' },
      { id: 'bestialWrath', name: 'Bestial Wrath', row: 6, col: 1, max: 1, icon: 'ability_druid_ferociousbite', req: 'intimidation',
        desc: 'Votre familier entre en rage : +50 % de dégâts pendant 18 s, insensible à la peur et aux contrôles.' },
    ],
  },
  {
    id: 'mm',
    name: 'Précision',
    talents: [
      { id: 'improvedConcussiveShot', name: 'Improved Concussive Shot', row: 0, col: 0, max: 5, icon: 'spell_frost_stun',
        desc: 'Concussive Shot a {4/8/12/16/20} % de chances d’étourdir la cible 3 s.' },
      { id: 'lethalAttacks', name: 'Lethal Attacks', row: 0, col: 1, max: 5, icon: 'ability_searingarrow', sim: true,
        desc: '+{1/2/3/4/5} % de chances de coup critique avec toutes les attaques.' },
      { id: 'hawkEye', name: 'Hawk Eye', row: 0, col: 2, max: 3, icon: 'ability_townwatch',
        desc: '+{2/4/6} m de portée pour vos tirs.' },
      { id: 'improvedStings', name: 'Improved Stings', row: 1, col: 0, max: 3, icon: 'ability_hunter_quickshot',
        desc: '+{6/12/18} % d’efficacité pour vos piqûres.' },
      { id: 'efficiency', name: 'Efficiency', row: 1, col: 1, max: 5, icon: 'spell_frost_wizardmark',
        desc: '−{2/4/6/8/10} % de coût en mana pour vos tirs et vos piqûres.' },
      { id: 'carefulAim', name: 'Careful Aim', row: 1, col: 2, max: 5, icon: 'ability_hunter_zenarchery',
        desc: 'Une part de votre Intelligence s’ajoute à votre puissance d’attaque à distance.' },
      { id: 'aimedShot', name: 'Aimed Shot', row: 2, col: 0, max: 1, icon: 'inv_spear_07',
        desc: 'Tir visé : dégâts à distance importants, 3 s d’incantation.' },
      { id: 'improvedArcaneShot', name: 'Improved Arcane Shot', row: 2, col: 1, max: 5, icon: 'ability_impalingbolt',
        desc: '−{0,2/0,4/0,6/0,8/1} s de recharge pour Arcane Shot.' },
      { id: 'rapidKilling', name: 'Rapid Killing', row: 2, col: 2, max: 2, icon: 'ability_hunter_rapidkilling',
        desc: '−{1/2} min de recharge pour Rapid Fire ; après une victime qui rapporte de l’expérience, votre tir suivant fait +{10/20} % de dégâts.' },
      { id: 'rapidRecuperation', name: 'Rapid Recuperation', row: 3, col: 0, max: 2, icon: 'ability_hunter_rapidregeneration',
        desc: 'Vous récupérez du mana pendant Rapid Fire.' },
      { id: 'mortalShots', name: 'Mortal Shots', row: 3, col: 2, max: 5, icon: 'ability_piercedamage',
        desc: '+{6/12/18/24/30} % de dégâts critiques pour vos tirs.' },
      { id: 'scatterShot', name: 'Scatter Shot', row: 4, col: 0, max: 1, icon: 'ability_golemstormbolt',
        desc: 'Tir de dispersion : désoriente la cible 4 s.' },
      { id: 'trueshotAura', name: 'Trueshot Aura', row: 4, col: 1, max: 1, icon: 'ability_trueshot',
        desc: 'Aura : augmente la puissance d’attaque du groupe.' },
      { id: 'barrage', name: 'Barrage', row: 4, col: 2, max: 3, icon: 'ability_upgrademoonglaive',
        desc: '+{5/10/15} % de dégâts pour Multi-Shot et Volley.' },
      { id: 'loneWolf', name: 'Lone Wolf', row: 5, col: 2, max: 2, icon: 'ability_mount_whitedirewolf',
        desc: '+{10/20} % de dégâts quand aucun familier n’est actif.' },
      { id: 'sniperShot', name: 'Sniper Shot', row: 6, col: 1, max: 1, icon: 'ability_hunter_snipershot', req: 'trueshotAura',
        desc: 'Tir de précision : 4 s d’incantation, 15 s de recharge, gros dégâts.' },
    ],
  },
  {
    id: 'sv',
    name: 'Survie',
    talents: [
      { id: 'improvedTracking', name: 'Improved Tracking', row: 0, col: 0, max: 5, icon: 'ability_tracking', sim: true,
        desc: '+{1/2/3/4/5} % de dégâts contre le type de créature que vous pistez.' },
      { id: 'deflection', name: 'Deflection', row: 0, col: 2, max: 5, icon: 'ability_parry',
        desc: '+{1/2/3/4/5} % de chances de parer.' },
      { id: 'entrapment', name: 'Entrapment', row: 1, col: 0, max: 5, icon: 'spell_nature_stranglevines',
        desc: 'Vos pièges ont {5/10/15/20/25} % de chances d’immobiliser les ennemis pris dedans.' },
      { id: 'savageStrikes', name: 'Savage Strikes', row: 1, col: 1, max: 2, icon: 'ability_racial_bloodrage', sim: true,
        desc: '+{10/20} % de chances de coup critique pour Raptor Strike, Mongoose Bite, Strider Kick et Counterattack.' },
      { id: 'survivalist', name: 'Survivalist', row: 1, col: 2, max: 5, icon: 'spell_shadow_twilight',
        desc: '+{2/4/6/8/10} % de points de vie.' },
      { id: 'cleverTraps', name: 'Clever Traps', row: 2, col: 0, max: 2, icon: 'spell_nature_timestop', sim: true,
        desc: '+{15/30} % de dégâts et de durée pour vos pièges.' },
      { id: 'surefooted', name: 'Surefooted', row: 2, col: 1, max: 3, icon: 'ability_kick', sim: true,
        desc: '+{1/2/3} % de chances de toucher avec toutes les attaques et les sorts.' },
      { id: 'deterrence', name: 'Deterrence', row: 2, col: 2, max: 1, icon: 'ability_whirlwind',
        desc: '+25 % d’esquive et de parade pendant 10 s.' },
      { id: 'improvedWingClip', name: 'Improved Wing Clip', row: 2, col: 3, max: 3, icon: 'ability_rogue_trip',
        desc: 'Wing Clip a {4/8/12} % de chances d’immobiliser la cible 5 s.' },
      { id: 'survivalTactics', name: 'Survival Tactics', row: 3, col: 0, max: 2, icon: 'ability_ensnare', sim: true,
        desc: '+{5/10} % de chances de toucher pour vos pièges.' },
      { id: 'predatorsEdge', name: 'Predator’s Edge', row: 3, col: 1, max: 5, icon: 'ability_hunter_combatexperience', sim: true,
        desc: '+{6/12/18/24/30} % de dégâts critiques pour vos techniques de mêlée et +{10/20/30/40/50} % de dégâts pour votre main gauche.' },
      { id: 'counterattack', name: 'Counterattack', row: 3, col: 2, max: 1, icon: 'ability_warrior_challange', req: 'deterrence', sim: true,
        desc: 'Après une parade : contre-attaque inévitable (50 % des dégâts de l’arme et un bonus), qui immobilise la cible 5 s.' },
      { id: 'improvedFeignDeath', name: 'Improved Feign Death', row: 3, col: 3, max: 2, icon: 'ability_rogue_feigndeath',
        desc: '−{2/4} % de chances que Feign Death soit résistée.' },
      { id: 'resourcefulness', name: 'Resourcefulness', row: 4, col: 0, max: 2, icon: 'ability_hunter_resourcefulness', sim: true,
        desc: '−{30/60} % de coût en mana pour vos techniques de mêlée et vos pièges.' },
      { id: 'exposePrey', name: 'Expose Prey', row: 4, col: 1, max: 2, icon: 'ability_hunter_markedfordeath', sim: true,
        desc: 'Vos attaques contre une cible marquée par Hunter’s Mark ont {5/10} % de chances de rendre Mongoose Bite utilisable.' },
      { id: 'striderKick', name: 'Strider Kick', row: 4, col: 2, max: 1, icon: 'ability_hunter_pet_tallstrider', sim: true,
        desc: 'Coup de pied : 100 % des dégâts de l’arme, 8 s de recharge. +30 % de vitesse de déplacement pendant 3 s.' },
      { id: 'survivalistsDiscipline', name: 'Survivalist’s Discipline', row: 4, col: 3, max: 1, icon: 'ability_hunter_survivalinstincts', sim: true,
        desc: '−40 % de temps de recharge pour vos pièges.' },
      { id: 'lightningReflexes', name: 'Lightning Reflexes', row: 5, col: 2, max: 5, icon: 'spell_nature_invisibilty', sim: true,
        desc: '+{2/4/6/8/10} % d’Agilité.' },
      { id: 'laceratingStrikes', name: 'Lacerating Strikes', row: 6, col: 1, max: 1, icon: 'ability_druid_lacerate', sim: true,
        desc: 'Mongoose Bite fait saigner la cible : 40 % de ses dégâts en plus, sur 21 s.' },
    ],
  },
];

export const TALENT_ROWS = 7;
export const TALENT_COLS = 4;
export const POINTS_PER_ROW = 5;

const ALL = TALENT_TREES.flatMap((tree) => tree.talents.map((t) => ({ ...t, tree: tree.id })));
const BY_ID = new Map(ALL.map((t) => [t.id, t]));

export const allTalents = () => ALL;
export const talentDef = (id) => BY_ID.get(id) || null;
export const treeDef = (id) => TALENT_TREES.find((t) => t.id === id) || null;

// Un point par niveau à partir du niveau 10.
export function pointsAvailable(level) {
  return Math.max(0, Number(level) - 9);
}

const rankOf = (talents, id) => Math.max(0, Math.round(Number(talents?.[id]) || 0));

export function treePoints(talents, treeId, beforeRow = TALENT_ROWS) {
  return ALL.reduce((s, t) => s + (t.tree === treeId && t.row < beforeRow ? rankOf(talents, t.id) : 0), 0);
}

export function totalPoints(talents) {
  return ALL.reduce((s, t) => s + rankOf(talents, t.id), 0);
}

// Raison qui empêche d’ajouter un point (null si possible).
export function addBlocker(talents, id, level) {
  const t = BY_ID.get(id);
  if (!t) return 'Talent inconnu.';
  const rank = rankOf(talents, id);
  if (rank >= t.max) return 'Rang maximal atteint.';
  if (totalPoints(talents) >= pointsAvailable(level)) return `Plus de points disponibles au niveau ${level}.`;
  const need = t.row * POINTS_PER_ROW;
  if (treePoints(talents, t.tree, t.row) < need) return `Nécessite ${need} points en ${treeDef(t.tree).name}.`;
  if (t.req) {
    const r = BY_ID.get(t.req);
    if (rankOf(talents, r.id) < r.max) return `Nécessite ${r.max} point${r.max > 1 ? 's' : ''} en ${r.name}.`;
  }
  return null;
}

// Raison qui empêche de retirer un point (null si possible) : comme en jeu, on ne peut pas retirer
// un point dont dépend un talent plus bas dans l’arbre.
export function removeBlocker(talents, id) {
  const t = BY_ID.get(id);
  if (!t) return 'Talent inconnu.';
  if (rankOf(talents, id) <= 0) return 'Aucun point à retirer.';
  for (const u of ALL) {
    if (u.tree !== t.tree || !rankOf(talents, u.id)) continue;
    if (u.req === id) return `${u.name} en dépend.`;
    if (u.row > t.row && treePoints(talents, t.tree, u.row) - 1 < u.row * POINTS_PER_ROW) {
      return `${u.name} demande ${u.row * POINTS_PER_ROW} points dans les rangées au-dessus.`;
    }
  }
  return null;
}

// Ce qui rend un build invalide (profil importé ou ancien) ; vide si tout va bien.
export function buildProblems(talents, level) {
  const out = [];
  const total = totalPoints(talents);
  if (total > pointsAvailable(level)) out.push(`${total} points dépensés pour ${pointsAvailable(level)} disponibles au niveau ${level}.`);
  for (const t of ALL) {
    const rank = rankOf(talents, t.id);
    if (!rank) continue;
    if (rank > t.max) out.push(`${t.name} : ${rank} points pour ${t.max} au maximum.`);
    const need = t.row * POINTS_PER_ROW;
    if (treePoints(talents, t.tree, t.row) < need) out.push(`${t.name} demande ${need} points en ${treeDef(t.tree).name} dans les rangées au-dessus.`);
    if (t.req && rankOf(talents, t.req) < BY_ID.get(t.req).max) out.push(`${t.name} demande ${BY_ID.get(t.req).name} au rang maximal.`);
  }
  return out;
}

// Texte d’un rang : « +{1/2/3} % » devient « +2 % » au rang 2 (rang 1 si aucun point).
export function rankText(desc, rank) {
  return desc.replace(/\{([^}]+)\}/g, (_, list) => {
    const values = list.split('/');
    return values[Math.min(values.length, Math.max(1, rank)) - 1];
  });
}

// Copie complète d’un build : tous les talents, à 0 par défaut.
export function fullBuild(partial = {}) {
  const out = {};
  for (const t of ALL) out[t.id] = Math.max(0, Math.min(t.max, Math.round(Number(partial[t.id]) || 0)));
  return out;
}

// Builds par défaut, valides dans l’arbre ci-dessus.
// Niveau 30 (21 points) : Survie jusqu’à Strider Kick ; Expose Prey et Resourcefulness sont trop bas.
// Niveau 60 (51 points) : Survie jusqu’à Lacerating Strikes, Deadly Aspects et Focused Fire,
// Lethal Attacks.
export const TALENT_BUILDS = {
  30: fullBuild({
    improvedTracking: 5, savageStrikes: 2, survivalist: 3, surefooted: 3, deterrence: 1, cleverTraps: 1,
    predatorsEdge: 4, counterattack: 1, striderKick: 1,
  }),
  60: fullBuild({
    improvedTracking: 5, savageStrikes: 2, survivalist: 5, surefooted: 3, deterrence: 1, cleverTraps: 2,
    predatorsEdge: 5, counterattack: 1, survivalTactics: 2, resourcefulness: 2, exposePrey: 2, striderKick: 1,
    lightningReflexes: 5, laceratingStrikes: 1,
    deadlyAspects: 1, enduranceTraining: 4, focusedFire: 2,
    lethalAttacks: 5, hawkEye: 2,
  }),
};
