// One browser-local draft, saved after every pick. No account or cross-device sync.
(() => {
  const KEY='redraft.draft.v1',positions=['QB','RB','WR','TE','FLEX','K','DST','BENCH'];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const signature=()=>JSON.stringify(P.map(p=>[p.id,p.name,p.pos,p.team,p.adp]));
  let saved=null,restoring=false,storageFailed=false,conflict=false;
  function valid(s){
    if(!s||s.version!==1||!Number.isInteger(s.year)||s.year<2000||s.year>2026||![10,12].includes(s.teams)||!Number.isInteger(s.user)||s.user<0||s.user>=s.teams||!['PPR','Half PPR','Standard'].includes(s.scoring))return false;
    if(!s.config||Object.keys(s.config).length!==positions.length||!positions.every(k=>Number.isInteger(s.config[k])&&s.config[k]>=0&&s.config[k]<=12))return false;
    const total=Object.values(s.config).reduce((a,b)=>a+b,0);
    if(total<1||total>30||typeof s.signature!=='string'||s.signature.length>300000||!Array.isArray(s.picks)||s.picks.length>s.teams*total||!Array.isArray(s.queue)||s.queue.length>500)return false;
    const used=new Set();for(let i=0;i<s.picks.length;i++){const p=s.picks[i],round=Math.floor(i/s.teams),team=round%2?s.teams-1-i%s.teams:i%s.teams;if(!p||!Number.isInteger(p.id)||p.id<0||p.t!==team||used.has(p.id))return false;used.add(p.id)}
    return s.queue.every(id=>Number.isInteger(id)&&id>=0&&!used.has(id))&&new Set(s.queue).size===s.queue.length;
  }
  function indicator(text){const el=$('saveIndicator');if(el)el.textContent=text}
  function save(){
    if(restoring||conflict||!document.body.classList.contains('rd-live'))return;
    const state=REDRAFT_STATE();if(!state.active&&state.pick!==state.n*state.rounds)return;
    const next={version:1,year:REDRAFT_SELECTED_YEAR,teams:n,user,scoring:$('scoring').value,config:{...REDRAFT_ROSTER},signature:signature(),picks:picks.map(x=>({id:x.p.id,t:x.t})),queue:queue.map(p=>p.id),savedAt:new Date().toISOString()};
    try{localStorage.setItem(KEY,JSON.stringify(next));saved=next;storageFailed=false;indicator('Saved on this device')}catch{storageFailed=true;indicator('Saving unavailable — keep this tab open')}
  }
  function leave(){save();if(storageFailed&&!confirm('Your browser could not save this draft. Leaving will lose your progress. Leave anyway?'))return;REDRAFT_PAUSE();location.assign(`/play.html?year=${REDRAFT_SELECTED_YEAR}`)}
  async function resume(){
    if(!valid(saved)||restoring)return;restoring=true;$('resumeDraft').disabled=true;$('savedMessage').textContent='Loading your saved season…';
    try{
      const s=saved;$('teams').value=s.teams;initSlots();$('slot').value=s.user;$('scoring').value=s.scoring;$('rdSeason').value=s.year;
      const fmt=s.scoring==='PPR'?'ppr':s.scoring==='Half PPR'?'half':'standard';
      const data=await REDRAFT_LOAD_SEASON(s.year,{scoring:fmt,teams:s.teams});
      if(!data||signature()!==s.signature)throw Error('The season data has changed. Your saved draft cannot be safely resumed. Start a new draft to use the updated pool.');
      const ids=new Set(P.map(p=>p.id));if(!s.picks.every(p=>ids.has(p.id))||!s.queue.every(id=>ids.has(id)))throw Error('Saved players could not be verified. Start a new draft.');
      history.replaceState(null,'',`${location.pathname}?year=${s.year}`);conflict=false;REDRAFT_RESTORE(s);
      indicator('Saved on this device');
    }catch(e){$('savedMessage').textContent=e.message||'Could not resume. Try again.'}finally{restoring=false;$('resumeDraft').disabled=false}
  }
  function exportDraft(){
    const rows=[['Overall pick','Round','Pick in round','Draft team','Player','Position','NFL team','ADP']];
    picks.forEach((x,i)=>rows.push([i+1,Math.floor(i/n)+1,i%n+1,x.t===user?'Your Team':`Team ${x.t+1}`,x.p.name,x.p.pos,x.p.team,x.p.unranked?'Unranked':x.p.adp]));
    const csv=rows.map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=`redraft-${REDRAFT_SELECTED_YEAR}-draft.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function resultsRoster(){
    const team=+$('resultsTeam').value,rows=picks.map((x,i)=>({...x,overall:i+1})).filter(x=>x.t===team);
    $('resultsRoster').innerHTML=rows.map(x=>`<tr><td>${Math.floor((x.overall-1)/n)+1}.${String((x.overall-1)%n+1).padStart(2,'0')} <small>#${x.overall}</small></td><td><b>${esc(x.p.name)}</b></td><td>${esc(x.p.pos)}</td><td>${esc(x.p.team)}</td><td>${x.p.unranked?'—':esc(x.p.adp)}</td></tr>`).join('');
  }
  function complete(){
    const year=REDRAFT_SELECTED_YEAR,proxy=REDRAFT_SEASON_META?.marketQuality==='results-proxy',grade=window.redraftGrade?.();
    const reveal=window.redraftTimeMachine?.().filter(x=>x.outcome)||[];
    $('finish').innerHTML=`<div class="resultsHeader"><div><div class="resultsEyebrow">RE:DRAFT · TIME MACHINE</div><h2>${year} Draft Complete</h2><p>${n} teams · ${REDRAFT_ROUNDS} rounds · ${esc($('scoring').value)} · You drafted from slot ${user+1}</p></div><button id="newDraft">NEW DRAFT</button></div>
      <div class="resultsCards"><div><small>YOUR ROSTER</small><strong>${rosters[user].length} players</strong><span>Review every selection below</span></div><div><small>DRAFT BOARD</small><strong>${pick} picks</strong><span>Every team, every round</span></div><div><small>${proxy?'HISTORICAL DATA':'ADP VALUE SCORE'}</small><strong>${grade?esc(grade.letter)+' · '+grade.score+'/100':'Provisional rankings'}</strong><span>${proxy?'2000–2005 preseason ADP is unverified':'Market-value estimate, not a season prediction'}</span></div></div>
      <div class="resultsActions"><button id="reviewBoard">VIEW FULL DRAFT BOARD</button><button id="exportDraft">DOWNLOAD PICKS CSV</button><span>Your last draft is saved in this browser.</span></div>
      ${grade?`<p class="resultsNote">${grade.best.diff>0?`<b>Best ADP value:</b> ${esc(grade.best.p.name)} at #${grade.best.overall} (ADP ${grade.best.p.adp}). `:''}${grade.reach.diff<0?`<b>Largest ADP reach:</b> ${esc(grade.reach.p.name)} at #${grade.reach.overall} (ADP ${grade.reach.p.adp}).`:''}</p>`:''}
      <div class="resultsHeading"><h3>Team selections</h3><label>View roster <select id="resultsTeam">${rosters.map((_,t)=>`<option value="${t}" ${t===user?'selected':''}>${t===user?'YOUR TEAM':'TEAM '+(t+1)}</option>`).join('')}</select></label></div>
      <table class="resultsTable"><thead><tr><th>Pick</th><th>Player</th><th>Position</th><th>NFL team</th><th>${proxy?'Proxy rank':'ADP'}</th></tr></thead><tbody id="resultsRoster"></tbody></table>
      ${reveal.length?`<div class="resultsReveal"><h3>Time Machine Reveal · ${year}</h3><p>Selected historical outcomes for your team. These do not influence CPU picks.</p>${reveal.map(x=>`<p><b>${esc(x.player.name)}</b> — ${esc(x.outcome.note)}</p>`).join('')}</div>`:''}
      <p class="resultsNote">${proxy?'This season uses provisional results-based rankings. Draft-day grades are not shown.':'The ADP value score compares your picks with the selected historical market and checks starter coverage. Unranked depth is excluded from value scoring.'}</p>`;
    $('newDraft').onclick=leave;$('reviewBoard').onclick=()=>{document.body.classList.add('rd-review');$('boardTab').click();render();};$('exportDraft').onclick=exportDraft;$('resultsTeam').onchange=resultsRoster;resultsRoster();save();
    if(storageFailed)$('finish').querySelector('.resultsActions span').textContent='Saving unavailable in this browser. Download your picks before leaving.';
  }
  function setup(){
    const style=document.createElement('style');style.textContent=`
      .sessionTools{display:flex;align-items:center;gap:8px;margin-left:auto}#saveIndicator{font:9px Arial;color:#94b6a6}.roomTabs .sessionTools button{font-size:9px!important;padding:0 7px}#tabStatus{margin-left:8px}#backToResults{display:none}body.rd-review #backToResults{display:block}body.rd-review #saveExit,body.rd-review #playersTab{display:none}
      .savedDraft{margin:18px 42px 0;padding:16px;border:1px solid #42785c;border-radius:7px;background:#10271f;color:#dbeee3;display:flex;align-items:center;gap:18px}.savedDraft p{font:12px/1.6 Arial;margin:4px 0}.savedDraft button{background:#61e89b;color:#082015;border:0;border-radius:4px;white-space:nowrap}.savedDraft small{font:10px Arial;color:#a4b9af}
      body.rd-complete #finish{max-width:1060px;margin:28px auto!important;padding:30px!important}body.rd-review #room{display:grid!important}body.rd-review #finish{display:none!important}
      .resultsHeader,.resultsActions,.resultsHeading{display:flex;align-items:center;justify-content:space-between;gap:16px}.resultsEyebrow{color:#64e9a0;font:800 11px Arial;letter-spacing:2px}.resultsHeader h2{margin:10px 0!important;font-size:38px!important}.resultsHeader p,.resultsNote{color:#91a9ba;font:12px/1.7 Arial}.resultsCards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:25px 0}.resultsCards>div{padding:20px;border:1px solid #304c60;border-radius:6px;background:#0b1b29}.resultsCards small{color:#e7b945;font:800 10px Arial}.resultsCards strong{display:block;font:800 27px Arial;margin:10px 0}.resultsCards span{color:#9aafbf;font:11px Arial}.resultsActions{justify-content:flex-start;flex-wrap:wrap;margin-bottom:25px}.resultsActions span{font:11px Arial;color:#8fa9bb}.finish button{background:#123427!important;color:#75edaa!important;border:1px solid #417c5b!important;border-radius:4px;padding:12px 16px;font:800 11px Arial!important}.resultsHeading{border-top:1px solid #2d475a;padding-top:15px}.resultsHeading h3,.resultsReveal h3{font:800 18px Arial}.resultsHeading label{font:12px Arial;color:#b5c7d4}.resultsHeading select{margin-left:10px;background:#0b1b29;color:#e8f2f8;border:1px solid #38546a}.resultsTable{width:100%;border-collapse:collapse;text-align:left;font:13px Arial}.resultsTable th{color:#8aa5b9;font-size:10px;text-transform:uppercase;padding:12px;border-bottom:1px solid #3e5c71}.resultsTable td{padding:13px 12px;border-bottom:1px solid #243c4e}.resultsTable td:first-child{color:#e9bd4a}.resultsTable small{margin-left:6px;color:#8da6b7;font-size:10px}.resultsTable tr:nth-child(even){background:#0a1a27}.resultsReveal{margin-top:24px;padding:18px;background:#102b22;border:1px solid #365b48;border-radius:6px;font:12px/1.6 Arial}
    `;document.head.appendChild(style);
    const tools=document.createElement('div');tools.className='sessionTools';tools.innerHTML='<span id="saveIndicator" role="status"></span><button id="saveExit">SAVE & EXIT</button><button id="backToResults">BACK TO RESULTS</button>';$('tabStatus').before(tools);
    $('saveExit').onclick=leave;$('backToResults').onclick=()=>document.body.classList.remove('rd-review');
    try{const raw=localStorage.getItem(KEY);if(raw){const data=JSON.parse(raw);if(valid(data))saved=data;else throw Error('Invalid saved draft')}}catch{storageFailed=true;}
    if(saved){const done=saved.picks.length===saved.teams*Object.values(saved.config).reduce((a,b)=>a+b,0),box=document.createElement('div');box.className='savedDraft';box.innerHTML=`<div><b>${saved.year} · ${done?'Completed draft':'Draft in progress'}</b><p id="savedMessage">${saved.picks.length} picks saved · ${saved.teams} teams · ${esc(saved.scoring)}</p><small>Saved on this browser only. Starting a new draft replaces this save.</small></div><button id="resumeDraft">${done?'REVIEW LAST DRAFT':'RESUME DRAFT'}</button>`;$('setup').querySelector('.controls').before(box);$('resumeDraft').onclick=resume;}
    else if(storageFailed){const note=document.createElement('p');note.className='savedDraft';note.textContent='Saved draft unavailable. You can start a new draft; automatic saving depends on browser storage.';$('setup').querySelector('.controls').before(note)}
    document.addEventListener('redraft-state-change',save);document.addEventListener('redraft-complete',complete);
    window.addEventListener('storage',e=>{if(e.key===KEY&&REDRAFT_STATE().active){conflict=true;REDRAFT_PAUSE();indicator('Draft changed in another tab. Reload to resume that save.');$('saveExit').textContent='RETURN TO LOBBY';render()}});
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',setup):setup();
})();
