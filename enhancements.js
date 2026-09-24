// RE:DRAFT progressive enhancement layer
// Keeps historical draft engine intact while improving the draft-room UX.
(() => {
  const css = `
    .wrap{max-width:none!important;width:100%!important;margin:0!important}.room{min-height:calc(100vh - 48px);grid-template-columns:270px minmax(0,1fr)!important}.side{background:#f5f7f9}.players{max-height:310px!important}.player{grid-template-columns:48px minmax(180px,1fr) 55px 75px 65px 96px!important;cursor:pointer}.player:hover{background:#f3f6f8}.photo{width:42px!important;height:42px!important}.draft-tools{display:flex;align-items:center;gap:5px;padding:6px 8px;background:#eef1f4;border-bottom:1px solid #b8c1ca}.draft-tools button{font-size:10px;padding:5px 9px;background:#fff}.draft-tools button.active{background:#253b50;color:#fff}.draft-tools input{padding:6px;border:1px solid #9ba7b3;min-width:170px}.focus-card{display:grid;grid-template-columns:92px 1fr auto;gap:12px;align-items:center;padding:8px 10px;background:#fff;border-bottom:1px solid #b8c1ca;min-height:94px}.focus-photo{width:86px;height:86px;background:#d7dde2;overflow:hidden;display:grid;place-items:center;font-size:22px;font-weight:bold}.focus-photo img{width:100%;height:100%;object-fit:cover}.focus-name{font-size:18px;font-weight:800;color:#183b63}.focus-meta{font-size:11px;color:#677887;margin-top:4px}.focus-actions{display:flex;gap:7px;align-items:center}.focus-actions .star{font-size:28px}.focus-actions .draft{font-size:11px;padding:9px 14px}.slot{grid-template-columns:38px minmax(0,1fr)!important;font-size:10px!important;padding:6px!important}.pick{height:46px!important;font-size:9px!important}.board{min-width:760px!important}.head{font-size:10px!important}@media(max-width:900px){.room{grid-template-columns:225px minmax(760px,1fr)!important}.focus-card{grid-template-columns:72px 1fr auto}.focus-photo{width:66px;height:66px}}
  `;
  const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
  let filter='ALL', search='', focused=null;
  function ensureUI(){
    const players=document.getElementById('players'); if(!players||document.getElementById('draftTools')) return;
    const tools=document.createElement('div');tools.id='draftTools';tools.className='draft-tools';
    tools.innerHTML=['ALL','QB','RB','WR','TE','K','DST'].map(x=>`<button data-pos="${x}" class="${x==='ALL'?'active':''}">${x}</button>`).join('')+`<input id="playerSearch" placeholder="Search players…">`;
    players.parentNode.insertBefore(tools,players);
    const focus=document.createElement('div');focus.id='focusCard';focus.className='focus-card';players.parentNode.insertBefore(focus,tools);
    tools.querySelectorAll('button').forEach(b=>b.onclick=()=>{filter=b.dataset.pos;tools.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));renderEnhanced()});
    document.getElementById('playerSearch').oninput=e=>{search=e.target.value.toLowerCase();renderEnhanced()};
  }
  function visible(){
    if(typeof avail==='undefined') return [];
    return avail.slice().sort((a,b)=>a.adp-b.adp).filter(p=>(filter==='ALL'||p.pos===filter)&&(!search||p.name.toLowerCase().includes(search)||p.team.toLowerCase().includes(search))).slice(0,60);
  }
  function focusPlayer(p){focused=p;renderEnhanced()}
  function renderEnhanced(){
    ensureUI(); const list=visible(); if(!focused||!avail.some(x=>x.id===focused.id)) focused=list[0]||null;
    const mine=typeof teamAt==='function'&&teamAt(pick)===user;
    const card=document.getElementById('focusCard');
    if(card&&focused){const ph=photo(focused);card.innerHTML=`<div class="focus-photo">${ph?`<img src="${ph}" onerror="this.parentNode.textContent='${initials(focused.name)}'">`:initials(focused.name)}</div><div><div class="focus-name">${focused.name}</div><div class="focus-meta">${focused.team} · ${focused.pos}${focused.pr||'—'} · Historical ADP ${focused.adp} · Position Rank ${focused.pos}${focused.pr||'—'}</div></div><div class="focus-actions"><button class="star" onclick="q(${focused.id})">${queue.some(x=>x.id===focused.id)?'★':'☆'}</button><button class="draft" ${mine?'':'disabled'} onclick="draft(${focused.id})">DRAFT</button></div>`}
    const el=document.getElementById('players'); if(!el)return;
    el.innerHTML=list.map(p=>{const ph=photo(p);return`<div class="player" data-id="${p.id}"><div class="photo">${ph?`<img src="${ph}" onerror="this.parentNode.innerHTML='${initials(p.name)}'">`:initials(p.name)}</div><div><div class="nm">${p.name}</div><div class="meta">${p.team}</div></div><div><b>${p.pos}${p.pr||''}</b></div><div>ADP ${p.adp}</div><div>PR ${p.pr||'—'}</div><div><button class="star" onclick="event.stopPropagation();q(${p.id})">${queue.some(x=>x.id===p.id)?'★':'☆'}</button><button class="draft" ${mine?'':'disabled'} onclick="event.stopPropagation();draft(${p.id})">DRAFT</button></div></div>`}).join('');
    el.querySelectorAll('.player').forEach(row=>row.onclick=()=>focusPlayer(avail.find(p=>p.id===+row.dataset.id)));
  }
  const oldRender=window.render; if(typeof oldRender==='function') window.render=function(){oldRender();renderEnhanced()};
  const oldStart=window.start; if(typeof oldStart==='function') window.start=function(){oldStart();setTimeout(renderEnhanced,0)};
  document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{ensureUI();if(document.getElementById('room')?.style.display==='grid')renderEnhanced()},0));
})();