const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
let drafts=0,picksTested=0;
for(let year=2000;year<=2026;year++)for(const variant of ['default','two-qb','no-k-dst'])for(let seed=1;seed<=3;seed++){
 const players=require(`../data/seasons/${year}.json`).players.map(p=>({...p,adp:p.pprAdp??p.standardAdp??p.adp})),n=variant==='no-k-dst'?10:seed%2?12:10;
 const cfg=variant==='two-qb'?{QB:2,RB:2,WR:2,TE:1,FLEX:1,K:1,DST:1,BENCH:5}:variant==='no-k-dst'?{QB:1,RB:2,WR:3,TE:1,FLEX:2,K:0,DST:0,BENCH:6}:{QB:1,RB:2,WR:2,TE:1,FLEX:1,K:1,DST:1,BENCH:6};
 const total=Object.values(cfg).reduce((a,b)=>a+b,0),context={avail:players.map(p=>({...p})),rosters:Array.from({length:n},()=>[]),n,pick:0,window:{REDRAFT_ROSTER:cfg,REDRAFT_ROUNDS:total,REDRAFT_MAX_NEED:pos=>pos==='K'||pos==='DST'?cfg[pos]:pos==='QB'?Math.max(cfg.QB,2):cfg[pos]+cfg.FLEX+cfg.BENCH}};
 vm.createContext(context);vm.runInContext(fs.readFileSync(require.resolve('../gameplay.js'),'utf8'),context);let state=seed*year;const rng=()=>((state=Math.imul(state,1664525)+1013904223>>>0)/4294967296);
 const drafted=new Set();for(let pick=0;pick<n*total;pick++){context.pick=pick;const r=Math.floor(pick/n),t=r%2?n-1-pick%n:pick%n,p=context.window.REDRAFT_CPU_CHOICE(t,rng);assert(p,`${year} ${variant} seed ${seed} pick ${pick} pool exhausted; roster ${JSON.stringify(context.rosters[t].map(p=>p.pos))}; available ${JSON.stringify(context.avail.map(p=>p.pos))}`);assert(!drafted.has(p.id));drafted.add(p.id);context.rosters[t].push(p);context.avail=context.avail.filter(x=>x.id!==p.id);picksTested++}
 for(const roster of context.rosters){assert.equal(roster.length,total);const count=pos=>roster.filter(p=>p.pos===pos).length;for(const pos of ['QB','RB','WR','TE','K','DST'])assert(count(pos)>=cfg[pos],`${year} ${variant} missing ${pos}`);assert(['RB','WR','TE'].reduce((s,pos)=>s+Math.max(0,count(pos)-cfg[pos]),0)>=cfg.FLEX);assert.equal(count('K'),cfg.K,`${year} ${variant} K`);assert.equal(count('DST'),cfg.DST,`${year} ${variant} DST`);assert(count('QB')<=Math.max(cfg.QB,2));}
 assert.equal(context.avail.length+drafted.size,players.length);assert.equal(new Set(players.filter(p=>p.pos==='DST').map(p=>p.team)).size,players.filter(p=>p.pos==='DST').length);drafts++;
}
console.log(JSON.stringify({passed:true,drafts,picksTested,seasons:27,configurations:3,seeds:3}));
