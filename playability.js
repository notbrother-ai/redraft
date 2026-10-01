// One state transition, one render, one pending CPU turn. Existing data and layout are retained.
(() => {
  let timer=null, generation=0, active=false;
  const rounds=()=>window.REDRAFT_ROUNDS||15;
  const stop=()=>{clearTimeout(timer);timer=null;generation++};
  window.REDRAFT_STATE=()=>({active,pick,n,user,rounds:rounds(),available:avail,rosters,picks,queue});
  window.render=function(){
    renderRoster();renderBoard();
    $('queue').textContent=queue.length?queue.map(p=>p.name).join(' · '):'No queued players';
    window.REDRAFT_RENDER_ROOM?.();
    document.dispatchEvent(new CustomEvent('redraft-state-change'));
  };
  window.renderBoard=function(){
    const cells=Array.from({length:n},(_,t)=>`<div class="pick boardTeam" onclick="viewTeam(${t});REDRAFT_RENDER_ROOM()"><b>${t===user?'YOUR TEAM':'TEAM '+(t+1)}</b></div>`);
    for(let r=0;r<rounds();r++)for(let t=0;t<n;t++){const i=r*n+(r%2?n-1-t:t),pk=picks[i];cells.push(`<div class="pick ${t===user?'mine':''} ${i===pick?'on-clock-cell':''}" data-overall="${i+1}" onclick="viewTeam(${t});REDRAFT_RENDER_ROOM()"><b>${r+1}.${String(i%n+1).padStart(2,'0')}</b><br>${pk?`<strong>${pk.p.name}</strong><span class="boardMeta">${pk.p.pos} · ${pk.p.team}</span>`:i===pick?'ON THE CLOCK':'—'}</div>`)}
    $('board').style.gridTemplateColumns=`repeat(${n},minmax(74px,1fr))`;$('board').innerHTML=cells.join('');
  };
  window.advance=function(){
    if(!active)return;
    if(pick>=n*rounds()){active=false;stop();finish();return;}
    if(!avail.length){active=false;stop();$('status').textContent='Draft paused: player pool exhausted.';return;}
    if(teamAt(pick)===user||timer!==null)return;
    const expected=pick,run=generation;
    timer=setTimeout(()=>{timer=null;if(active&&generation===run&&pick===expected&&teamAt(pick)!==user)cpu(teamAt(pick));},120);
  };
  window.take=function(player,team){
    if(!active||team!==teamAt(pick)||pick>=n*rounds())return false;
    const p=avail.find(x=>x.id===player?.id);if(!p)return false;
    clearTimeout(timer);timer=null;
    avail=avail.filter(x=>x.id!==p.id);rosters[team].push(p);picks.push({p,t:team});queue=queue.filter(x=>x.id!==p.id);pick++;
    render();advance();return true;
  };
  window.draft=id=>active&&teamAt(pick)===user?take(avail.find(x=>x.id===id),user):false;
  window.q=function(id){const p=avail.find(x=>x.id===id);if(!p)return;const i=queue.findIndex(x=>x.id===id);i<0?queue.push(p):queue.splice(i,1);render()};
  window.start=function(){
    if(active||!window.REDRAFT_SEASON_READY)return;
    const config=window.REDRAFT_ROSTER,total=Object.values(config).reduce((s,v)=>s+v,0),teams=+$('teams').value;
    let error='';
    if(total<1||total>30)error='Choose between 1 and 30 total roster slots.';
    const capacity=['QB','RB','WR','TE','K','DST'].reduce((s,pos)=>s+Math.min(P.filter(p=>p.pos===pos).length,teams*window.REDRAFT_MAX_NEED(pos)),0);
    if(capacity<teams*total)error=`This pool supports ${capacity} picks with these position limits. Reduce roster slots or teams.`;
    if(P.length<teams*total)error=`This season has ${P.length} players; reduce teams or roster slots to fit ${teams*total} picks.`;
    for(const pos of ['QB','RB','WR','TE','K','DST'])if(P.filter(p=>p.pos===pos).length<teams*config[pos])error=`This source does not have enough ${pos} players for these settings. Reduce ${pos} slots.`;
    if(error){$('rdDataStatus').textContent=error;return;}
    stop();n=teams;user=+$('slot').value;pick=0;picks=[];queue=[];avail=P.map(p=>({...p}));rosters=Array.from({length:n},()=>[]);window.REDRAFT_ROUNDS=total;active=true;
    document.body.classList.remove('rd-complete');document.body.classList.add('rd-live');$('setup').style.display='none';$('finish').style.display='none';$('room').style.display='grid';
    $('rosterTeam').innerHTML=rosters.map((_,t)=>`<option value="${t}">${t===user?'MY ROSTER':'TEAM '+(t+1)}</option>`).join('');$('rosterTeam').value=user;$('rosterTeam').onchange=()=>{renderRoster();window.REDRAFT_RENDER_ROOM?.()};
    render();advance();
  };
  window.REDRAFT_PAUSE=function(){stop();active=false;};
  // Restore only canonical players resolved against the selected season by draft-session.js.
  window.REDRAFT_RESTORE=function(saved){
    stop();n=saved.teams;user=saved.user;pick=saved.picks.length;
    window.REDRAFT_ROSTER={...saved.config};window.REDRAFT_ROUNDS=Object.values(saved.config).reduce((a,b)=>a+b,0);
    const byId=new Map(P.map(p=>[p.id,{...p}])),used=new Set();rosters=Array.from({length:n},()=>[]);
    picks=saved.picks.map(x=>{const p=byId.get(x.id);used.add(x.id);rosters[x.t].push(p);return{p,t:x.t}});
    avail=[...byId.values()].filter(p=>!used.has(p.id));queue=saved.queue.map(id=>byId.get(id));active=pick<n*rounds();
    document.body.classList.remove('rd-complete','rd-review');document.body.classList.add('rd-live');$('setup').style.display='none';$('finish').style.display='none';$('room').style.display='grid';
    $('rosterTeam').innerHTML=rosters.map((_,t)=>`<option value="${t}">${t===user?'MY ROSTER':'TEAM '+(t+1)}</option>`).join('');$('rosterTeam').value=user;
    $('rosterTeam').onchange=()=>{renderRoster();window.REDRAFT_RENDER_ROOM?.()};
    render();if(active)advance();else finish();
  };
  const originalFinish=window.finish;
  window.finish=function(){stop();active=false;originalFinish();document.body.classList.add('rd-complete');if(window.REDRAFT_SEASON_META?.marketQuality==='results-proxy')$('report').innerHTML=$('report').innerHTML.replace('Average historical ADP','Average provisional rank')+'<p>Preseason ADP is unverified for this season. Rankings use the inherited results-based proxy; no draft-day grade is shown.</p>';$('finish').querySelector('h2').textContent=`${window.REDRAFT_SELECTED_YEAR} Draft Complete`;document.dispatchEvent(new CustomEvent('redraft-complete'))};
  function setup(){
    $('start').onclick=window.start;
    const rail=$('teamRail');if(rail){const selector=$('rosterTeam');rail.querySelector('.teamRailTitle').textContent='TEAM ROSTERS';rail.querySelector('.teamRailSub').before(selector);}
    const css=document.createElement('style');css.textContent=`
      #rosterConfig{background:#0b1b29!important;border-color:#304a60!important;color:#dce7f2!important;border-radius:6px;padding:14px!important}
      #roundCount{color:#a7bac9!important}.unfinished{opacity:.5;cursor:default!important}
      .photo .fallback{font-size:13px!important;color:#b9cddd!important}.heroPhoto .fallback{font:italic 900 72px Arial;color:#e8b42d}
      body.rd-complete #room{display:none!important}body.rd-complete #finish{display:block!important}body.rd-complete{overflow:auto!important}
      .room{grid-template-columns:200px minmax(650px,1fr) 230px!important}.heroPlayer{grid-template-columns:180px minmax(200px,1fr) 185px!important}.heroName{font-size:32px!important}
      .player,.playerTableHead{grid-template-columns:32px 40px minmax(150px,1fr) 48px 42px 58px 42px 94px!important}.filters{gap:4px}.filters button{padding:0 10px!important}.filters input{width:170px;margin-left:5px}.sortFake{white-space:nowrap}
      .teamRail .slot{grid-template-columns:48px 1fr!important}.teamRail .slotlabel{width:43px!important;font-size:9px!important}.teamRailSub{font-size:9px!important}#rosterTeam{margin:8px;width:calc(100% - 16px)}
      .side>.queue{display:block!important}.side>.queue:before{content:'QUEUE';display:block;color:#e8b42d;font-weight:bold;margin-bottom:8px}.side .orderRow{display:grid!important;cursor:pointer}.side .orderRow.on-clock{outline:1px solid #e8b42d;outline-offset:-1px}
      .finish #report>div{background:#0c2131!important;color:#dce7f2!important;border-color:#345168!important}.finish #report>div>div{color:inherit!important}
      body[data-era=classic].rd-live .room,body[data-era=web2].rd-live .room{background:#091722!important}
      #boardToggle{width:100%;background:#102c21;color:#74efa9;border:1px solid #365847;margin-top:12px}.room.show-board main{overflow:auto}.room.show-board .scroll,.room.show-board .board{display:grid!important}.room.show-board .players{max-height:300px!important}
      .fallback{position:relative;display:grid;place-items:center;width:100%;height:100%;overflow:hidden}.fallback svg{position:absolute;width:90%;height:100%;fill:#355066;opacity:.6}.fallback b{position:relative;z-index:1;font:800 12px Arial;color:#e6bc58}.heroPhoto .fallback b{font:italic 900 46px Arial}.leftTitle{font-size:16px!important;gap:6px}.leftTitle span{white-space:nowrap}
      .side{display:flex!important;flex-direction:column;overflow:hidden!important}.side>.head,.side>#roster{display:none!important}.leftTitle{flex:none;display:flex;justify-content:space-between;align-items:center}.leftTitle span{font:700 10px Arial;color:#8fa8ba}
      #recentPicks{flex:1;min-height:0;overflow-y:auto;scrollbar-gutter:stable}.feedPick{display:grid;grid-template-columns:34px 1fr;width:100%;gap:6px;min-height:63px;text-align:left;background:#0a1824;color:#dfe8ef;border:0;border-bottom:1px solid #22394a;border-radius:0!important;padding:9px 7px;text-transform:none;letter-spacing:0;font-family:Arial!important}.feedPick:hover{background:#163148}.feedPick.my-pick{border-left:3px solid #55e696;background:#10251f}.feedPick b{font-size:11px;line-height:1.4}.feedPick small{display:block;font:10px/1.6 Arial;color:#91a8ba}.feedNumber{color:#e7b434;font:800 15px Arial}.feedNumber small{font-size:9px}.feedEmpty{padding:20px 12px;color:#91a8ba;font:12px/1.6 Arial}.side>.queue{flex:none;max-height:100px;overflow:auto;border-top:1px solid #365063}
      .roomTabs{height:42px;display:flex;align-items:center;gap:4px;padding:0 10px;border-bottom:1px solid #2a4355;background:#0a1824}.roomTabs button{height:42px;border:0;border-bottom:3px solid transparent;background:transparent;color:#8299aa;padding:0 15px;font:800 11px Arial!important;letter-spacing:.4px}.roomTabs button.selected{color:#68eda2;border-bottom-color:#68eda2}.roomTabs button:focus-visible{outline:2px solid #e8b42d;outline-offset:-4px}#tabStatus{margin-left:auto;color:#a0b4c3;font:10px Arial}
      .players{max-height:calc(100vh - 415px)!important}.board-view #heroPlayer,.board-view .filters,.board-view .playerTableHead,.board-view #players{display:none!important}.room main.board-view>.scroll{display:block!important;height:calc(100vh - 143px);overflow:auto!important}.board-view #board{display:grid!important;min-width:0;align-content:start}.board-view .pick{height:78px!important;min-width:74px;padding:6px!important;font:10px/1.4 Arial!important;cursor:pointer}.board-view .pick strong{display:block;font-size:11px;color:#e7f0f7;margin:4px 0}.boardMeta{font-size:9px;color:#92a9bb}.board-view .boardTeam{height:37px!important;position:sticky;top:0;background:#162c3e!important;z-index:1;display:grid;place-items:center}.board-view .on-clock-cell{outline:2px solid #e8b42d;outline-offset:-2px;color:#e8b42d!important}.board-view .mine strong{color:#74f1ac}
    `;document.head.appendChild(css);
    const side=document.querySelector('.side');
    side.querySelector('section')?.remove();
    const title=document.createElement('div');title.className='leftTitle';title.innerHTML='DRAFT PICKS <span id="feedCount">0</span>';side.prepend(title);
    const feed=$('recentPicks');feed.setAttribute('aria-label','Draft picks in chronological order');
    const queueBox=$('queue');side.appendChild(queueBox);
    const main=$('room').querySelector('main'),tabs=document.createElement('div');tabs.className='roomTabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Draft room view');
    tabs.innerHTML='<button id="playersTab" role="tab" aria-selected="true" aria-controls="players" class="selected">AVAILABLE PLAYERS</button><button id="boardTab" role="tab" aria-selected="false" aria-controls="board">DRAFT BOARD</button><span id="tabStatus"></span>';
    $('status').after(tabs);
    const setTab=board=>{main.classList.toggle('board-view',board);for(const [id,on] of [['playersTab',!board],['boardTab',board]]){$(id).classList.toggle('selected',on);$(id).setAttribute('aria-selected',String(on))}if(board){const current=$('board').querySelector('.on-clock-cell');current?.scrollIntoView({block:'nearest',inline:'nearest'})}};
    $('playersTab').onclick=()=>setTab(false);$('boardTab').onclick=()=>setTab(true);
    tabs.onkeydown=e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();const board=e.key==='ArrowRight';setTab(board);$(board?'boardTab':'playersTab').focus()};
    let shown=-1;const draw=window.REDRAFT_RENDER_ROOM;
    window.REDRAFT_RENDER_ROOM=function(){
      const follow=feed.scrollHeight-feed.scrollTop-feed.clientHeight<80,oldScroll=feed.scrollTop;
      draw();
      $('feedCount').textContent=`${pick}/${n*rounds()}`;
      if(shown!==pick){feed.innerHTML=picks.length?picks.map((x,i)=>`<button class="feedPick ${x.t===user?'my-pick':''}" data-overall="${i+1}" onclick="viewTeam(${x.t});REDRAFT_RENDER_ROOM()"><span class="feedNumber">${i+1}<small>${Math.floor(i/n)+1}.${String(i%n+1).padStart(2,'0')}</small></span><span><b>${x.p.name}</b><small>${x.p.pos} · ${x.p.team} · ${x.t===user?'Your Team':'Team '+(x.t+1)}</small></span></button>`).join(''):'<div class="feedEmpty">Every pick appears here, in draft order.<br><br>You can click a pick to view that team’s roster.</div>';shown=pick;}
      feed.scrollTop=follow?feed.scrollHeight:oldScroll;
      const t=teamAt(pick);$('tabStatus').textContent=!active?(pick>=n*rounds()?'DRAFT COMPLETE':'DRAFT PAUSED'):t===user?'YOUR PICK — select a player':`Team ${t+1} is picking`;
      const selected=+$('rosterTeam').value;document.querySelector('.teamRailSub span').textContent=selected===user?'YOUR ROSTER':'TEAM '+(selected+1)+' ROSTER';
    };

  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',setup):setup();
})();
