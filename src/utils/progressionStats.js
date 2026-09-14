// Statistiques de progression permanentes, lues par les hauts faits.
//
// Les hauts faits designent leur compteur par un chemin en clair, par exemple
// 'lifetime.combat.damageDealt' ou 'champions.1.skillUses.guardianStrike'. Un
// chemin qui ne resout pas renvoie 0 sans erreur : le haut fait reste
// simplement bloque a zero. La forme est donc un contrat, verifie par
// tests/achievements.contract.test.js.

const nombre=valeur=>{const n=Number(valeur);return Number.isFinite(n)?n:0};

/** Forme de reference des statistiques permanentes. */
export const emptyProgressionStats=()=>({
  version:1,
  lifetime:{
    battles:{completed:0,won:0,autoWins:0,manualWins:0,flawlessWins:0},
    combat:{damageDealt:0,damageTaken:0,healingDone:0,mitigation:0,dotDamageDealt:0,
            shieldAbsorbed:0,criticalDamage:0,enemiesDefeated:0,bossesDefeated:0},
    summons:{total:0,multi10:0,newHeroes:0,duplicates:0,rarity4:0,rarity5:0,pity:0,
             gemsSpent:0,stonesSpent:0},
    forge:{upgrades:0,recycles:0,sales:0,transfers:0,equipped:0,goldSpent:0,essenceSpent:0},
    activities:{campaignWins:0,expeditionWins:0,raidWins:0,mythicWins:0},
    chronicles:{relicsFound:0,activated:0,uniqueWeaponsForged:0}
  },
  records:{mythicHighest:0},
  champions:{},
  processed:{}
});

/** Metriques cumulees par champion, hors utilisations de competences. */
export const CHAMPION_METRICS=['damage','healing','mitigation'];

export const emptyChampionStat=()=>({damage:0,healing:0,mitigation:0,skillUses:{}});

/**
 * Cumule le rapport de combat dans les statistiques par champion.
 *
 * `combatStats` est indexe par identifiant de champion et porte deja `damage`,
 * `healing`, `mitigation` et `skillUses` — c'est exactement ce que lisent les
 * 104 hauts faits de maitrise. L'agregation annoncee par la v1.51.2 manquait :
 * `champions` etait initialise a {} et jamais ecrit.
 *
 * Fonction pure : ni l'entree ni les objets imbriques ne sont modifies.
 */
export function mergeChampionStats(champions,combatStats){
  const suivant={...(champions||{})};
  Object.entries(combatStats||{}).forEach(([championId,ligne])=>{
    if(!ligne||typeof ligne!=='object')return;
    const actuel=suivant[championId]||emptyChampionStat();
    const skillUses={...(actuel.skillUses||{})};
    Object.entries(ligne.skillUses||{}).forEach(([effet,uses])=>{
      skillUses[effet]=nombre(skillUses[effet])+Math.max(0,nombre(uses));
    });
    suivant[championId]={
      ...CHAMPION_METRICS.reduce((acc,cle)=>
        ({...acc,[cle]:nombre(actuel[cle])+Math.max(0,nombre(ligne[cle]))}),{}),
      skillUses
    };
  });
  return suivant;
}
