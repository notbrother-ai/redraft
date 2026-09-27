// RE:DRAFT customizable roster configuration — engine-integrated MVP
(() => {
  const DEFAULTS={QB:1,RB:2,WR:2,TE:1,FLEX:1,K:1,DST:1,BENCH:6};
  window.REDRAFT_ROSTER={...DEFAULTS};
  const totalRounds=()=>Object.values(window.REDRAFT_ROSTER).reduce((a,b)=>a+(+b||0),0);
  const starterNeed=pos=>+window.REDRAFT_ROSTER[pos]||0;
  const maxNeed=pos=>{
    const base=starterNeed(pos)+(pos==='RB'||pos==='WR'||pos==='TE'?starterNeed('FLEX'):0);
    const bench=+window.REDRAFT_ROSTER.BENCH||0;
    if(pos==='QB')return Math.max(base,Math.min(2,base+bench));
    if(pos==='K'||pos==='DST')return Math.max(base,1);
    return Math.max(base,base+bench);
  };
  function inject(){
    const setup=document.getElementById('setup'); if(!setup||document.getElementById('rosterConfig'))return;
    const box=document.createElement('div'); box.id='rosterConfig'; box.style.cssText='margin-top:10px;padding:10px;border:1px solid #b8c1ca;background:#eef1f4;font-size:10px';
    box.innerHTML='<b>ROSTER SETTINGS</b><div id="rosterFields" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:7px"></div><div id="roundCount" style="margin-top:6px;color:#667786"></div>';
    setup.appendChild(box); const fields=box.querySelector('#rosterFields');
    Object.entries(DEFAULTS).forEach(([pos,val])=>{const wrap=document.createElement('label');wrap.style.cssText='display:flex;align-items:center;gap:4px';wrap.innerHTML=`<span style="font-weight:bold">${pos}</span><input data-pos="${pos}" type="number" min="0" max="12" value="${val}" style="width:42px;padding:5px;border:1px solid #9ba7b3">`;fields.appendChild(wrap)});
    fields.addEventListener('input',()=>{fields.querySelectorAll('input').forEach(i=>window.REDRAFT_ROSTER[i.dataset.pos]=Math.max(0,+i.value||0));updateRounds()}); updateRounds();
  }
  function updateRounds(){const total=totalRounds(),x=document.getElementById('roundCount');if(x)x.textContent=`Draft rounds: ${total} · starters ${total-window.REDRAFT_ROSTER.BENCH} · bench ${window.REDRAFT_ROSTER.BENCH}`}
  function slotPlan(){let a=[];['QB','RB','WR','TE','FLEX','K','DST'].forEach(pos=>{for(let i=0;i<starterNeed(pos);i++)a.push(pos)});for(let i=0;i<starterNeed('BENCH');i++)a.push('BENCH');return a}
  window.REDRAFT_SLOT_PLAN=slotPlan;
  window.REDRAFT_MAX_NEED=maxNeed;
  function patch(){
    if(typeof window.start!=='function'||typeof window.finish!=='function'||typeof window.renderBoard!=='function'||typeof window.renderRoster!=='function')return setTimeout(patch,25);
    if(window.start.__rosterPatched)return;
    const originalStart=window.start,originalRenderBoard=window.renderBoard,originalRenderRoster=window.renderRoster;
    window.start=function(){window.REDRAFT_ROUNDS=totalRounds();originalStart()};window.start.__rosterPatched=true;
    window.renderBoard=function(){const rounds=window.REDRAFT_ROUNDS||totalRounds(),oldN=n;let cells=[];for(let i=0;i<oldN*rounds;i++){let r=Math.floor(i/oldN),display=r%2?oldN-(i%oldN):i%oldN+1,pk=picks[i];cells.push(`<div class="pick ${pk&&pk.t===user?'mine':''}" onclick="viewTeam(${pk?pk.t:(r%2?oldN-display:display-1)})"><b>${r+1}.${String(display).padStart(2,'0')}</b><br>${pk?pk.p.name:'—'}</div>`)}document.getElementById('board').style.gridTemplateColumns=`repeat(${oldN},1fr)`;document.getElementById('board').innerHTML=cells.join('')};
    window.renderRoster=function(){let t=+document.getElementById('rosterTeam').value,r=rosters[t]||[],used=new Set(),out=[];for(const s of slotPlan()){let idx=-1;if(s==='FLEX')idx=r.findIndex((p,i)=>!used.has(i)&&['RB','WR','TE'].includes(p.pos));else if(s==='BENCH')idx=r.findIndex((p,i)=>!used.has(i));else idx=r.findIndex((p,i)=>!used.has(i)&&p.pos===s);if(idx>=0){used.add(idx);out.push([s,r[idx]])}else out.push([s,null])}document.getElementById('roster').innerHTML=out.map(([s,p])=>`<div class="slot"><span class="slotlabel">${s}</span><span class="${p?'':'empty'}">${p?`${p.name} · ${p.pos}${p.pr||''} · ADP ${p.adp}`:'Empty'}</span></div>`).join('')};
    const oldAdvance=window.advance;window.advance=function(){const max=n*(window.REDRAFT_ROUNDS||totalRounds());if(pick>=max||!avail.length){finish();return}if(teamAt(pick)!==user)setTimeout(()=>cpu(teamAt(pick)),45);else render()};
    const btn=document.getElementById('start');if(btn)btn.onclick=window.start;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject);else inject();patch();
})();