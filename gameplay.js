// RE:DRAFT gameplay realism layer — 2017 MVP
(() => {
  const counts=(t,pos)=>rosters[t].filter(p=>p.pos===pos).length;
  const round=()=>Math.floor(pick/n)+1;
  function target(pos,r){
    if(pos==='QB') return r<6?0:1;
    if(pos==='RB') return r<=5?2:r<=10?4:5;
    if(pos==='WR') return r<=5?2:r<=10?4:5;
    if(pos==='TE') return r<5?0:r<=10?1:2;
    if(pos==='K'||pos==='DST') return r<13?0:1;
    return 0;
  }
  function maxAt(pos){return ({QB:2,RB:6,WR:6,TE:2,K:1,DST:1}[pos]||6)}
  function scarcity(pos){const a=avail.filter(p=>p.pos===pos).sort((a,b)=>a.adp-b.adp);if(a.length<2)return 0;return Math.max(0,7-(a[1].adp-a[0].adp));}
  function missingStarter(t,pos){return counts(t,pos)<({QB:1,RB:2,WR:2,TE:1,K:1,DST:1}[pos]||0)}
  window.cpu=function(t){
    const r=round(), overall=pick+1;
    let pool=avail.slice().sort((a,b)=>a.adp-b.adp).slice(0,Math.min(r<5?28:45,avail.length));
    let scored=pool.map(p=>{
      const have=counts(t,p.pos), want=target(p.pos,r);
      if(have>=maxAt(p.pos)) return {p,s:9999};
      if((p.pos==='K'||p.pos==='DST')&&r<12) return {p,s:9999};
      if(p.pos==='QB'&&have>=1&&r<11) return {p,s:9999};
      if(p.pos==='TE'&&have>=1&&r<9) return {p,s:9999};
      // Penalize reaches using historical ADP, but allow realistic draft-day variance.
      const delta=p.adp-overall;
      let market=Math.abs(delta)*0.58;
      if(delta>18)market+=(delta-18)*0.48;
      let need=have<want?-7:have===want?0:4;
      if((p.pos==='RB'||p.pos==='WR')&&r<=8&&have<3)need-=3;
      let value=delta<-10?-4:delta<-5?-2:0;
      let scarce=-Math.min(3,scarcity(p.pos)*0.3);
      // In the final rounds, complete a legal-looking starting lineup.
      let completion=0;
      if(r>=13&&missingStarter(t,p.pos)) completion-=18;
      if(r===15&&missingStarter(t,'K')&&p.pos==='K') completion-=25;
      if(r>=14&&missingStarter(t,'DST')&&p.pos==='DST') completion-=22;
      let personality=((t*17+p.id*7)%13-6)*0.45;
      let noise=(Math.random()-0.5)*(r<4?6:r<9?11:17);
      return {p,s:market+need+value+scarce+completion+personality+noise};
    }).sort((a,b)=>a.s-b.s);
    let choice=scored.find(x=>x.s<9999)?.p || pool[0] || avail[0];
    take(choice,t);
  };
})();