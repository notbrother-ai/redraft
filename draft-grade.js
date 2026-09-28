// RE:DRAFT post-draft grade — evaluates process using only information available on draft day.
(() => {
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const letter=s=>s>=97?'A+':s>=93?'A':s>=90?'A-':s>=87?'B+':s>=83?'B':s>=80?'B-':s>=77?'C+':s>=73?'C':s>=70?'C-':s>=67?'D+':s>=63?'D':s>=60?'D-':'F';
  function grade(){
    if(window.REDRAFT_SEASON_META?.marketQuality==='results-proxy')return null;
    const mine=(picks||[]).map((x,i)=>({...x,overall:i+1})).filter(x=>x.t===user&&!x.p.unranked);if(!mine.length)return null;
    let value=0;const details=mine.map(x=>{const diff=x.overall-(x.p.adp||x.overall);value+=clamp(diff,-25,25);return{...x,diff}});
    const avg=value/mine.length;let score=82+avg*.55;
    const r=rosters[user]||[],c=pos=>r.filter(p=>p.pos===pos).length,cfg=pos=>window.REDRAFT_ROSTER?(+window.REDRAFT_ROSTER[pos]||0):({QB:1,RB:2,WR:2,TE:1,FLEX:1,K:1,DST:1}[pos]||0);
    ['QB','RB','WR','TE','K','DST'].forEach(pos=>{if(cfg(pos)>0&&c(pos)<cfg(pos))score-=8});
    if(cfg('FLEX')&&c('RB')+c('WR')+c('TE')<cfg('RB')+cfg('WR')+cfg('TE')+cfg('FLEX'))score-=7;
    score=clamp(Math.round(score),45,99);
    const best=details.slice().sort((a,b)=>b.diff-a.diff)[0],reach=details.slice().sort((a,b)=>a.diff-b.diff)[0];
    return{score,letter:letter(score),avg,best,reach,details};
  }
  window.redraftGrade=grade;
  const wait=()=>{if(typeof window.finish!=='function')return setTimeout(wait,30);if(window.finish.__gradePatched)return;const old=window.finish;window.finish=function(){old();const g=grade(),report=document.getElementById('report');if(!g||!report)return;const box=document.createElement('div');box.style.cssText='margin:14px 0;padding:14px;border:1px solid #9faab5;background:#eef1f4;color:#213244';box.innerHTML=`<div style="font-size:11px;font-weight:bold">DRAFT-DAY GRADE</div><div style="font-size:36px;font-weight:900;color:#183b63">${g.letter} <span style="font-size:15px">${g.score}/100</span></div><div style="font-size:10px">Grades your decisions against the historical draft market — no hindsight.</div><p style="font-size:11px"><b>Best value:</b> ${g.best.p.name} at pick ${g.best.overall} (ADP ${g.best.p.adp})<br><b>Biggest reach:</b> ${g.reach.p.name} at pick ${g.reach.overall} (ADP ${g.reach.p.adp})</p>`;report.prepend(box)};window.finish.__gradePatched=true};wait();
})();