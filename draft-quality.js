// RE:DRAFT quality guardrails — roster-aware integrity checks.
(() => {
  const cfg=pos=>window.REDRAFT_ROSTER?(+window.REDRAFT_ROSTER[pos]||0):({QB:1,RB:2,WR:2,TE:1,FLEX:1,K:1,DST:1,BENCH:6}[pos]||0);
  const count=(team,pos)=>(rosters?.[team]||[]).filter(p=>p.pos===pos).length;
  const limit=pos=>window.REDRAFT_MAX_NEED?window.REDRAFT_MAX_NEED(pos):({QB:2,RB:7,WR:7,TE:3,K:1,DST:1}[pos]||99);
  window.redraftAudit=()=>{
    const issues=[];const total=window.REDRAFT_ROUNDS||15;
    (rosters||[]).forEach((r,t)=>{
      ['QB','RB','WR','TE','K','DST'].forEach(pos=>{if(count(t,pos)>limit(pos))issues.push(`Team ${t+1}: too many ${pos}s (${count(t,pos)})`)});
      ['QB','RB','WR','TE','K','DST'].forEach(pos=>{if(cfg(pos)>0&&count(t,pos)<cfg(pos))issues.push(`Team ${t+1}: missing ${pos} starter`)});
      const flexEligible=count(t,'RB')+count(t,'WR')+count(t,'TE');const baseFlex=cfg('RB')+cfg('WR')+cfg('TE');if(cfg('FLEX')>0&&flexEligible<baseFlex+cfg('FLEX'))issues.push(`Team ${t+1}: missing FLEX depth`);
      if(r.length!==total)issues.push(`Team ${t+1}: roster has ${r.length}/${total} players`);
      const ids=r.map(p=>p.id),dup=ids.filter((id,i)=>ids.indexOf(id)!==i);if(dup.length)issues.push(`Team ${t+1}: duplicate player id ${dup[0]}`);
    });
    const drafted=(picks||[]).map(x=>x.p.id),duplicateDrafts=drafted.filter((id,i)=>drafted.indexOf(id)!==i);if(duplicateDrafts.length)issues.push(`Draft board duplicate player id ${duplicateDrafts[0]}`);
    const expected=(rosters||[]).length*total;if(drafted.length!==expected)issues.push(`Draft ended at ${drafted.length}/${expected} picks`);
    return {ok:issues.length===0,issues,picks:drafted.length,expected};
  };
  const oldFinish=window.finish;if(typeof oldFinish==='function')window.finish=function(){oldFinish();const audit=window.redraftAudit(),report=document.getElementById('report');if(report){const box=document.createElement('p');box.style.fontSize='11px';box.innerHTML=audit.ok?'<b>Draft integrity:</b> Passed roster, slot, length, and duplicate checks.':`<b>Draft integrity:</b> ${audit.issues.join(' · ')}`;report.appendChild(box)}};
})();