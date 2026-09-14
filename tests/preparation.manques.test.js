import{describe,it,expect,vi}from'vitest';
import React from'react';
import{renderToStaticMarkup}from'react-dom/server';
import{HEROES}from'../src/data/heroes';
import{createRaidMission}from'../src/data/raids';
import{assessTeamForMission}from'../src/utils/stats';

/**
 * La fenêtre de préparation dit-elle ce qui manque à l'équipe ?
 *
 * Elle n'affichait que deux nombres : la puissance de l'équipe et une
 * « puissance recommandée ». Or aucun nombre ne peut dire « il te manque un
 * soigneur » — et c'est ce qui décide. Mesuré : contre le raid, une équipe
 * composée gagne là où l'équipe des quatre champions LES PLUS PUISSANTS perd,
 * avec jusqu'à trois fois moins de puissance affichée.
 *
 * On ne réaffiche PAS de probabilité de victoire : « tu gagnes 17 fois sur
 * 20 » avait été retiré volontairement, parce que l'annoncer supprime la seule
 * question qui fait qu'un combat vaut d'être joué. On affiche les manques, que
 * `assessTeamForMission` calculait déjà sans que cet écran les montre.
 */
const STATS={hp:900,atk:120,def:60,spd:100,crit:10,critDamage:50,
  accuracy:30,resistance:20,setEffects:[]};
const stats=()=>({...STATS});
const SANS_SOIN=[1,3,7,9];

describe('les manques de composition sont calculés et affichés',()=>{
  it('une équipe sans soin est signalée sur un raid',()=>{
    const mission=createRaidMission('heartforge',6);
    const bilan=assessTeamForMission(SANS_SOIN,HEROES,stats,mission);
    expect(bilan.gaps.join(' ')).toMatch(/soin/i);
  });

  it('la fenêtre de préparation rend ces manques',async()=>{
    const mission=createRaidMission('heartforge',6);
    const manques=assessTeamForMission(SANS_SOIN,HEROES,stats,mission).gaps;
    expect(manques.length).toBeGreaterThan(0);
    vi.doMock('../src/store/GameContext',()=>({
      useGame:()=>({HEROES,owned:HEROES.map(h=>h.id),team:SANS_SOIN,teamPresets:[],
        activeTeamSlot:null,selectTeamPreset:()=>{},teamPower:()=>1234,
        assessMission:()=>({gaps:manques}),gems:0,gold:0,hearthstones:0,bloodFragments:0,
        forgeEssence:0,summonerProfile:{name:'Test',level:1,xp:0},summonerXpRequired:()=>100,
        setSummonerName:()=>{},unlocks:{},battleSession:null,preparationMission:mission,
        cancelMissionPreparation:()=>{},confirmMissionPreparation:()=>({ok:true}),
        pendingMission:null,dismissPendingMission:()=>{},replaceBattleWithPending:()=>{}}),
      GameProvider:({children})=>children}));
    const{default:Layout}=await import('../src/components/Layout');
    const html=renderToStaticMarkup(React.createElement(Layout,{page:'home',setPage:()=>{}},null));
    expect(html).toContain('prep-manques');
    manques.forEach(manque=>expect(html).toContain(manque));
    // Pas de probabilite de victoire : la decision de conception tient.
    expect(html).not.toMatch(/fois sur \d+/);
    vi.doUnmock('../src/store/GameContext');
  });
});
