// Latest selection wins. A failed load never leaves another year's pool playable.
(() => {
  const q=new URLSearchParams(location.search),requested=Number(q.get('year')||2017),initial=Number.isInteger(requested)&&requested>=2000&&requested<=2026?requested:2017;
  let sequence=0,controller;const cache=new Map();
  window.REDRAFT_SELECTED_YEAR=initial;window.REDRAFT_SEASON_READY=false;window.REDRAFT_SEASON_ERROR=null;
  const scoring=()=>{const s=String(document.getElementById('scoring')?.value||'PPR');return s==='PPR'?'ppr':s==='Half PPR'?'half':'standard'};
  window.REDRAFT_LOAD_SEASON=async function(year=window.REDRAFT_SELECTED_YEAR,opts={}){
    const y=Number(year);if(!Number.isInteger(y)||y<2000||y>2026)throw Error('Season must be 2000–2026');
    const request=++sequence;controller?.abort();controller=new AbortController();window.REDRAFT_SELECTED_YEAR=y;window.REDRAFT_SEASON_READY=false;window.REDRAFT_SEASON_ERROR=null;
    document.dispatchEvent(new CustomEvent('redraft-season-loading',{detail:{year:y}}));
    const fmt=opts.scoring||scoring(),teams=opts.teams||document.getElementById('teams')?.value||12,key=`${y}-${teams}-${fmt}`;
    try{
      let j=cache.get(key);if(!j){const r=await fetch(`/api/season?year=${y}&teams=${teams}&scoring=${fmt}`,{signal:controller.signal});j=await r.json();if(!r.ok)throw Error(j.error||`Season service returned ${r.status}`);cache.set(key,j)}
      if(request!==sequence)return null;
      if(j.year!==y||!Array.isArray(j.players)||j.players.length<40)throw Error('Season data failed validation');
      P.splice(0,P.length,...j.players.map((p,i)=>({...p,id:i,season:y})));
      window.REDRAFT_SEASON_META=j;window.REDRAFT_REGISTER_SEASON?.(y,P,{source:j.source,status:'playable'});window.REDRAFT_SEASON_READY=true;document.title=`RE:DRAFT — ${y}`;
      document.dispatchEvent(new CustomEvent('redraft-season-ready',{detail:{year:y,count:P.length,source:j.source}}));return j;
    }catch(e){if(request!==sequence||e.name==='AbortError')return null;window.REDRAFT_SEASON_ERROR=e;P.splice(0);document.dispatchEvent(new CustomEvent('redraft-season-error',{detail:{year:y,error:e.message}}));throw e}
  };
  window.REDRAFT_SET_YEAR=async y=>{history.replaceState(null,'',`${location.pathname}?year=${y}`);return window.REDRAFT_LOAD_SEASON(y)};
  window.REDRAFT_SEASON_PROMISE=window.REDRAFT_LOAD_SEASON(initial).catch(()=>null);
})();
