// RE:DRAFT multi-season framework: 2000-2026
// Season datasets are loaded independently so the draft engine/UI can stay shared.
(()=>{
  const years=Array.from({length:27},(_,i)=>2000+i);
  window.REDRAFT_YEARS=years;
  window.REDRAFT_SEASONS=window.REDRAFT_SEASONS||{};
  // Preserve the existing fully playable 2017 build as the first registered season.
  function capture2017(){
    if(typeof P==='undefined') return false;
    window.REDRAFT_SEASONS[2017]={year:2017,players:P.map(x=>({...x})),status:'playable'};
    return true;
  }
  window.REDRAFT_REGISTER_SEASON=function(year,players,meta={}){
    window.REDRAFT_SEASONS[+year]={year:+year,players:players.map((x,i)=>({...x,id:i})),status:'playable',...meta};
  };
  window.REDRAFT_SELECTED_YEAR=+(new URLSearchParams(location.search).get('year')||2017);
  window.REDRAFT_SET_YEAR=function(year){
    year=+year;if(!years.includes(year))return;
    window.REDRAFT_SELECTED_YEAR=year;
    const u=new URL(location.href);u.searchParams.set('year',year);location.href=u.toString();
  };
  let tries=0;(function wait(){if(capture2017())return;if(++tries<200)setTimeout(wait,10)})();
})();