// RE:DRAFT quality guardrails — catches broken roster construction during play.
(() => {
  const LIMITS={QB:2,RB:7,WR:7,TE:3,K:1,DST:1};
  const count=(team,pos)=>(rosters?.[team]||[]).filter(p=>p.pos===pos).length;
  window.redraftAudit=()=>{
    const issues=[];
    (rosters||[]).forEach((r,t)=>{
      Object.entries(LIMITS).forEach(([pos,max])=>{if(count(t,pos)>max)issues.push(`Team ${t+1}: ${count(t,pos)} ${pos}s`)});
      const ids=r.map(p=>p.id), dup=ids.filter((id,i)=>ids.indexOf(id)!==i);
      if(dup.length)issues.push(`Team ${t+1}: duplicate player id ${dup[0]}`);
    });
    const drafted=(picks||[]).map(x=>x.p.id);
    const duplicateDrafts=drafted.filter((id,i)=>drafted.indexOf(id)!==i);
    if(duplicateDrafts.length)issues.push(`Draft board duplicate player id ${duplicateDrafts[0]}`);
    return {ok:issues.length===0,issues,picks:(picks||[]).length};
  };
  const oldFinish=window.finish;
  if(typeof oldFinish==='function') window.finish=function(){
    oldFinish();
    const audit=window.redraftAudit();
    const report=document.getElementById('report');
    if(report){
      const box=document.createElement('p');
      box.style.fontSize='11px';
      box.innerHTML=audit.ok?'<b>Draft integrity:</b> Passed roster/duplicate checks.':`<b>Draft integrity:</b> ${audit.issues.join(' · ')}`;
      report.appendChild(box);
    }
  };
})();