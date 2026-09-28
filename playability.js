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
  };
  window.renderBoard=function(){
    const cells=Array.from({length:n},(_,t)=>`<div class="pick" onclick="viewTeam(${t});REDRAFT_RENDER_ROOM()"><b>${t===user?'YOUR TEAM':'TEAM '+(t+1)}</b></div>`);
    for(let r=0;r<rounds();r++)for(let t=0;t<n;t++){const i=r*n+(r%2?n-1-t:t),pk=picks[i];cells.push(`<div class="pick ${t===user?'mine':''}" onclick="viewTeam(${t});REDRAFT_RENDER_ROOM()"><b>${r+1}.${String(i%n+1).padStart(2,'0')}</b><br>${pk?pk.p.name:'—'}</div>`)}
    $('board').style.gridTemplateColumns=`repeat(${n},1fr)`;$('board').innerHTML=cells.join('');
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
  const originalFinish=window.finish;
  window.finish=function(){stop();active=false;originalFinish();document.body.classList.add('rd-complete');if(window.REDRAFT_SEASON_META?.marketQuality==='results-proxy')$('report').innerHTML=$('report').innerHTML.replace('Average historical ADP','Average provisional rank')+'<p>Preseason ADP is unverified for this season. Rankings use the inherited results-based proxy; no draft-day grade is shown.</p>';$('finish').querySelector('h2').textContent=`${window.REDRAFT_SELECTED_YEAR} Draft Complete`};
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
    `;document.head.appendChild(css);
    const side=document.querySelector('.side');const toggle=document.createElement('button');toggle.id='boardToggle';toggle.textContent='SHOW DRAFT BOARD';toggle.onclick=()=>{const open=$('room').classList.toggle('show-board');toggle.textContent=open?'HIDE DRAFT BOARD':'SHOW DRAFT BOARD'};side.appendChild(toggle);
    const draw=window.REDRAFT_RENDER_ROOM;window.REDRAFT_RENDER_ROOM=function(){draw();const section=side.querySelector('section');let order=section.querySelector('#liveOrder');if(!order){order=document.createElement('div');order.id='liveOrder';section.querySelectorAll('.orderRow').forEach(x=>x.remove());section.appendChild(order)}const label=section.querySelector('.roundLabel');label.textContent=`${window.REDRAFT_SELECTED_YEAR} · Round ${Math.min(rounds(),Math.floor(pick/n)+1)}${window.REDRAFT_SEASON_META?.marketQuality==='results-proxy'?' · PROVISIONAL RANKS':''}`;const round=Math.min(rounds()-1,Math.floor(pick/n));order.innerHTML=Array.from({length:n},(_,i)=>{const t=round%2?n-1-i:i;return `<div class="orderRow ${t===user?'you':''} ${active&&t===teamAt(pick)?'on-clock':''}" onclick="viewTeam(${t});REDRAFT_RENDER_ROOM()"><span>${i+1}</span><span class="helmet"></span><span>${t===user?'Your Team':'Team '+(t+1)}</span></div>`}).join('');};
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',setup):setup();
})();
