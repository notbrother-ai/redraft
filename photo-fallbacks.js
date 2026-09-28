// Never substitute another person. Only identity-verified NFL headshots are displayed.
(() => {
  const verified=new Map(),failed=new Set(),pending=new Set();
  const names={'David Johnson':'2508176',"Le'Veon Bell":'15825','Antonio Brown':'13934','Julio Jones':'13982','LeSean McCoy':'12514','Odell Beckham Jr.':'16733','Devonta Freeman':'16944','Melvin Gordon':'2576434','Mike Evans':'16737','A.J. Green':'13983','Jordy Nelson':'12563','Ezekiel Elliott':'3051392','Michael Thomas':'2976316','Rob Gronkowski':'13229','Tom Brady':'2330','Christian McCaffrey':'3117251','DeAndre Hopkins':'15795','Drew Brees':'2580','Travis Kelce':'15847','Aaron Rodgers':'8439','Russell Wilson':'14881','Derrick Henry':'3043078','Cooper Kupp':'2977187','Adrian Peterson':'10452','Chris Johnson':'11258'};
  const key=s=>String(s).toLowerCase().replace(/[^a-z0-9]/g,'');
  const known=new Map(Object.entries(names).map(([name,id])=>[key(name),id]));
  window.photo=p=>failed.has(key(p.name))?'':verified.get(key(p.name))||'';
  window.playerPhotoSources=p=>photo(p)?[photo(p)]:[];
  const fallback=img=>{const span=document.createElement('span');span.className='fallback';span.textContent=initials(img.alt||'Player');span.title='Player portrait unavailable';img.replaceWith(span)};
  document.addEventListener('error',e=>{const img=e.target;if(!(img instanceof HTMLImageElement)||!img.closest('.photo,.heroPhoto'))return;failed.add(key(img.alt));fallback(img)},true);
  async function verify(p){
    const k=key(p.name),id=p.espnId||p.espn_id||known.get(k);if(!id||pending.has(k)||verified.has(k))return;pending.add(k);
    try{const response=await fetch(`https://site.api.espn.com/apis/common/v3/sports/football/nfl/athletes/${encodeURIComponent(id)}`,{signal:AbortSignal.timeout(5000)});if(!response.ok)return;const j=await response.json(),a=j.athlete||j;
      if(key(a.displayName||a.fullName)!==k||a.position?.abbreviation!==p.pos)return;
      verified.set(k,`https://a.espncdn.com/i/headshots/nfl/players/full/${id}.png`);
    }catch{} // Initials remain visible on missing data, CORS, timeout or identity mismatch.
  }
  document.addEventListener('redraft-season-ready',async()=>{const year=window.REDRAFT_SELECTED_YEAR,work=P.filter(p=>known.has(key(p.name))||p.espnId||p.espn_id);let i=0;await Promise.all(Array.from({length:3},async()=>{while(i<work.length)await verify(work[i++])}));if(year===window.REDRAFT_SELECTED_YEAR)window.REDRAFT_RENDER_ROOM?.()});
})();
