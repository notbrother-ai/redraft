// Loads the selected 2000-2026 historical market into the existing shared draft engine.
(()=>{
 const year=+(new URLSearchParams(location.search).get('year')||2017);
 window.REDRAFT_SELECTED_YEAR=year;
 if(year===2017)return; // existing curated 2017 pool stays the local fast path
 window.REDRAFT_SEASON_READY=false;
 window.REDRAFT_SEASON_PROMISE=fetch(`/api/season?year=${year}`).then(r=>r.json().then(j=>{if(!r.ok)throw new Error(j.detail||j.error||'season load failed');return j})).then(data=>{
   if(!Array.isArray(data.players)||!data.players.length)throw new Error('empty season');
   // P is declared with const in app.html; mutate the array rather than reassign it.
   P.splice(0,P.length,...data.players.map((x,i)=>({...x,id:i})));
   window.REDRAFT_REGISTER_SEASON?.(year,P,{source:data.source,status:'playable'});
   window.REDRAFT_SEASON_READY=true;
   document.title=`RE:DRAFT — ${year}`;
   document.dispatchEvent(new CustomEvent('redraft-season-ready',{detail:{year,count:P.length}}));
   return data;
 }).catch(err=>{window.REDRAFT_SEASON_ERROR=err;document.dispatchEvent(new CustomEvent('redraft-season-error',{detail:{year,error:String(err.message||err)}}));throw err});
})();