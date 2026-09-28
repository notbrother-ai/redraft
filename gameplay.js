// CPU choices use the selected season's market, remaining starter needs and bench capacity.
(() => {
  const positions=['QB','RB','WR','TE','K','DST'];
  window.REDRAFT_CPU_CHOICE=function(t,rng=Math.random){
    const cfg=window.REDRAFT_ROSTER,roster=rosters[t],counts=Object.fromEntries(positions.map(pos=>[pos,roster.filter(p=>p.pos===pos).length]));
    const total=window.REDRAFT_ROUNDS||15,remaining=total-roster.length,round=Math.floor(pick/n)+1;
    const missing=Object.fromEntries(positions.map(pos=>[pos,Math.max(0,cfg[pos]-counts[pos])]));
    const flexFilled=['RB','WR','TE'].reduce((s,pos)=>s+Math.max(0,counts[pos]-cfg[pos]),0),flexMissing=Math.max(0,cfg.FLEX-flexFilled);
    const needed=Object.values(missing).reduce((a,b)=>a+b,0)+flexMissing;
    const fills=p=>missing[p.pos]>0||(flexMissing>0&&['RB','WR','TE'].includes(p.pos));
    let pool=avail.filter(p=>counts[p.pos]<window.REDRAFT_MAX_NEED(p.pos));
    // Reserve the last available player at a position for teams still needing that starter.
    const supply=Object.fromEntries(positions.map(pos=>[pos,avail.filter(p=>p.pos===pos).length]));
    const demand=Object.fromEntries(positions.map(pos=>[pos,rosters.reduce((s,r)=>s+Math.max(0,cfg[pos]-r.filter(p=>p.pos===pos).length),0)]));
    pool=pool.filter(p=>missing[p.pos]>0||supply[p.pos]>demand[p.pos]);
    if(remaining<=needed)pool=pool.filter(fills);
    if(!pool.length)pool=avail.filter(p=>fills(p)&&counts[p.pos]<window.REDRAFT_MAX_NEED(p.pos));
    const scores=pool.map(p=>{
      let score=p.adp;const have=counts[p.pos];
      if(missing[p.pos]>0)score-=Math.min(18,round*1.5);
      if(['RB','WR'].includes(p.pos)&&have<2)score-=5;
      if(p.pos==='QB'&&have>=cfg.QB)score+=round<total*.7?90:25;
      if(p.pos==='TE'&&have>=cfg.TE)score+=round<total*.7?65:20;
      if(p.pos==='K'||p.pos==='DST')score+=round<total-2?180:0;
      score+=(rng()-.5)*(round<4?6:18);
      return{p,score};
    });scores.sort((a,b)=>a.score-b.score);return scores[0]?.p;
  };
  window.cpu=t=>take(window.REDRAFT_CPU_CHOICE(t),t);
})();
