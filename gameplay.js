// RE:DRAFT gameplay realism layer — roster-aware 2017 MVP
(() => {
  const counts=(t,pos)=>rosters[t].filter(p=>p.pos===pos).length;
  const round=()=>Math.floor(pick/n)+1;
  const cfg=pos=>window.REDRAFT_ROSTER?(+window.REDRAFT_ROSTER[pos]||0):({QB:1,RB:2,WR:2,TE:1,FLEX:1,K:1,DST:1,BENCH:6}[pos]||0);
  const rounds=()=>window.REDRAFT_ROUNDS||15;
  function starterNeed(pos){return cfg(pos)}
  function target(pos,r){
    const total=rounds(),pct=r/Math.max(1,total),start=starterNeed(pos),flex=['RB','WR','TE'].includes(pos)?cfg('FLEX'):0;
    if(pos==='K'||pos==='DST')return pct<.78?0:start;
    if(pos==='QB')return pct<.34?0:start;
    if(pos==='TE')return pct<.28?0:start;
    if(pos==='RB'||pos==='WR'){if(pct<.35)return Math.min(start,2);if(pct<.68)return start+Math.ceil(flex/2);return start+flex+Math.ceil(cfg('BENCH')*.28)}
    return start;
  }
  function maxAt(pos){if(window.REDRAFT_MAX_NEED)return window.REDRAFT_MAX_NEED(pos);return({QB:2,RB:6,WR:6,TE:2,K:1,DST:1}[pos]||6)}
  function scarcity(pos){const a=avail.filter(p=>p.pos===pos).sort((a,b)=>a.adp-b.adp);if(a.length<2)return 0;return Math.max(0,7-(a[1].adp-a[0].adp))}
  function missingStarter(t,pos){return counts(t,pos)<starterNeed(pos)}
  window.cpu=function(t){
    const r=round(),overall=pick+1,total=rounds(),late=r>=Math.max(1,total-2);
    let pool=avail.slice().sort((a,b)=>a.adp-b.adp).slice(0,Math.min(r<5?30:50,avail.length));
    let scored=pool.map(p=>{
      const have=counts(t,p.pos),want=target(p.pos,r);if(have>=maxAt(p.pos))return{p,s:9999};
      if((p.pos==='K'||p.pos==='DST')&&r<Math.max(2,total-3))return{p,s:9999};
      if(p.pos==='QB'&&have>=starterNeed('QB')&&r<Math.ceil(total*.72))return{p,s:9999};
      if(p.pos==='TE'&&have>=starterNeed('TE')&&r<Math.ceil(total*.58))return{p,s:9999};
      const delta=p.adp-overall;let market=Math.abs(delta)*.58;if(delta>18)market+=(delta-18)*.48;
      let need=have<want?-7:have===want?0:4;if((p.pos==='RB'||p.pos==='WR')&&r<=Math.ceil(total*.55)&&have<Math.max(2,starterNeed(p.pos)))need-=3;
      let value=delta<-10?-4:delta<-5?-2:0,scarce=-Math.min(3,scarcity(p.pos)*.3),completion=0;
      if(late&&missingStarter(t,p.pos))completion-=22;
      if(r===total&&missingStarter(t,'K')&&p.pos==='K')completion-=35;
      if(r>=total-1&&missingStarter(t,'DST')&&p.pos==='DST')completion-=30;
      let personality=((t*17+p.id*7)%13-6)*.45,noise=(Math.random()-.5)*(r<4?6:r<Math.ceil(total*.6)?11:17);
      return{p,s:market+need+value+scarce+completion+personality+noise};
    }).sort((a,b)=>a.s-b.s);
    take((scored.find(x=>x.s<9999)||{}).p||pool[0]||avail[0],t);
  };
})();