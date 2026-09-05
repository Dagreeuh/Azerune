import{CONTINENTS,DIFFICULTIES,createMission}from'./src/data/campaign.js';
const rows=[];
for(const difficulty of DIFFICULTIES)for(const continent of CONTINENTS)for(const stage of continent.stages){const m=createMission(difficulty,continent,stage);const total=m.enemies.reduce((a,e)=>a+e.hp+e.atk*5+e.def*4+e.spd,0);rows.push({difficulty:difficulty.id,continent:continent.id,stage:Number(stage.id),boss:m.boss,recommended:m.recommended,total,gold:m.reward.gold,gems:m.reward.gems});}
let monotonic=true,bossJumps=[];
for(const difficulty of DIFFICULTIES)for(const continent of CONTINENTS){const group=rows.filter(r=>r.difficulty===difficulty.id&&r.continent===continent.id);for(let i=1;i<group.length;i++)if(group[i].recommended<group[i-1].recommended)monotonic=false;bossJumps.push({difficulty:difficulty.id,continent:continent.id,jump:Number((group[4].recommended/group[3].recommended).toFixed(2))});}
const result={missions:rows.length,monotonic,bossJumps,range:{min:Math.min(...rows.map(r=>r.recommended)),max:Math.max(...rows.map(r=>r.recommended))}};
console.log(JSON.stringify(result,null,2));if(rows.length!==80||!monotonic||bossJumps.some(x=>x.jump>1.45))process.exit(1);
