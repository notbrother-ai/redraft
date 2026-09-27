// RE:DRAFT customizable roster configuration — MVP
(() => {
  const DEFAULTS={QB:1,RB:2,WR:2,TE:1,FLEX:1,K:1,DST:1,BENCH:6};
  window.REDRAFT_ROSTER={...DEFAULTS};
  function inject(){
    const setup=document.getElementById('setup'); if(!setup||document.getElementById('rosterConfig'))return;
    const box=document.createElement('div'); box.id='rosterConfig';
    box.style.cssText='margin-top:10px;padding:10px;border:1px solid #b8c1ca;background:#eef1f4;font-size:10px';
    box.innerHTML='<b>ROSTER SETTINGS</b><div id="rosterFields" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:7px"></div><div id="roundCount" style="margin-top:6px;color:#667786"></div>';
    setup.appendChild(box);
    const fields=box.querySelector('#rosterFields');
    Object.entries(DEFAULTS).forEach(([pos,val])=>{
      const wrap=document.createElement('label'); wrap.style.cssText='display:flex;align-items:center;gap:4px';
      wrap.innerHTML=`<span style="font-weight:bold">${pos}</span><input data-pos="${pos}" type="number" min="0" max="10" value="${val}" style="width:42px;padding:5px;border:1px solid #9ba7b3">`;
      fields.appendChild(wrap);
    });
    fields.addEventListener('input',()=>{fields.querySelectorAll('input').forEach(i=>window.REDRAFT_ROSTER[i.dataset.pos]=Math.max(0,+i.value||0)); updateRounds();});
    updateRounds();
  }
  function updateRounds(){const total=Object.values(window.REDRAFT_ROSTER).reduce((a,b)=>a+b,0); const x=document.getElementById('roundCount'); if(x)x.textContent=`Draft rounds: ${total} · starters ${total-window.REDRAFT_ROSTER.BENCH} · bench ${window.REDRAFT_ROSTER.BENCH}`;}
  const oldStart=window.start;
  function patch(){
    if(typeof window.start!=='function')return setTimeout(patch,25);
    if(window.start.__rosterPatched)return;
    const original=window.start;
    window.start=function(){
      original();
      // Override total draft length via global rounds and expose slot plan for later layers.
      window.REDRAFT_ROUNDS=Object.values(window.REDRAFT_ROSTER).reduce((a,b)=>a+b,0);
    };
    window.start.__rosterPatched=true;
    const btn=document.getElementById('start'); if(btn)btn.onclick=window.start;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject); else inject();
  patch();
})();