// RE:DRAFT 2017 historical market model
// Uses contemporaneous preseason ADP anchors and adjusts the draft market by scoring + league size.
(() => {
  const pprAnchors = {
    'David Johnson':1.3,"Le'Veon Bell":2.3,'Antonio Brown':3.1,'Odell Beckham Jr.':5.1,'Mike Evans':6.4,'LeSean McCoy':7.0,'Julio Jones':7.8,'Melvin Gordon':8.1,'Devonta Freeman':8.5,'Ezekiel Elliott':8.9,'A.J. Green':9.2,'Jordy Nelson':10.7,'Michael Thomas':13.2,'Jay Ajayi':13.6,'DeMarco Murray':15.3
  };
  const standardAnchors = {
    'David Johnson':1.6,"Le'Veon Bell":2.3,'Antonio Brown':3.7,'Julio Jones':5.1,'LeSean McCoy':5.6,'Devonta Freeman':6.6,'Odell Beckham Jr.':6.8,'Melvin Gordon':7.7,'Mike Evans':8.4,'A.J. Green':10.4,'Jay Ajayi':10.5,'Ezekiel Elliott':11.8,'Jordy Nelson':12.1,'DeMarco Murray':13.4,'Jordan Howard':14.7
  };
  const baseStart = window.start;
  function selectedScoring(){return document.getElementById('scoring')?.value || 'PPR'}
  function marketADP(p){
    const mode=selectedScoring(), teams=+(document.getElementById('teams')?.value||12);
    let a=p.adp;
    if(mode==='PPR' && pprAnchors[p.name]!=null) a=pprAnchors[p.name];
    if(mode==='Standard' && standardAnchors[p.name]!=null) a=standardAnchors[p.name];
    // Historical scoring tendencies for players without exact anchors.
    if(mode==='Standard'){
      if(p.pos==='WR') a*=1.06;
      if(p.pos==='RB') a*=0.97;
      if(p.pos==='TE') a*=1.04;
    } else if(mode==='PPR'){
      if(p.pos==='WR') a*=0.97;
      if(p.pos==='RB') a*=1.01;
    } else { // half PPR interpolation
      const s=standardAnchors[p.name], q=pprAnchors[p.name];
      if(s!=null&&q!=null) a=(s+q)/2;
      else if(p.pos==='WR') a*=1.01;
    }
    // Ten-team rooms push replacement-level QBs/TEs slightly later in overall pick terms.
    if(teams===10 && (p.pos==='QB'||p.pos==='TE') && a>40) a*=1.07;
    return Math.round(a*10)/10;
  }
  window.marketADP=marketADP;
  window.applyHistoricalMarket=function(){
    if(typeof P==='undefined')return;
    P.forEach(p=>{if(p.baseAdp==null)p.baseAdp=p.adp;p.adp=marketADP({...p,adp:p.baseAdp});});
    ['QB','RB','WR','TE','K','DST'].forEach(pos=>P.filter(p=>p.pos===pos).sort((a,b)=>a.adp-b.adp).forEach((p,i)=>p.pr=i+1));
  };
  if(typeof baseStart==='function') window.start=function(){window.applyHistoricalMarket();baseStart();};
})();