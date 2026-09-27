// Automatic era presentation. No user-facing theme switch: the selected season owns the look.
(()=>{
 const eras=[
  {min:2000,max:2005,id:'classic',accent:'#f0b323',green:'#8cc63f',bg:'#101820',panel:'#d8dde2',ink:'#152b3d'},
  {min:2006,max:2010,id:'web2',accent:'#f2a51a',green:'#4f9f65',bg:'#1d3447',panel:'#e4e8eb',ink:'#18364d'},
  {min:2011,max:2016,id:'prime',accent:'#e7a928',green:'#4fc17a',bg:'#132636',panel:'#0d1b27',ink:'#f5f8fa'},
  {min:2017,max:2020,id:'modern',accent:'#e5ad2a',green:'#55e696',bg:'#07131e',panel:'#0b1925',ink:'#f5f8fa'},
  {min:2021,max:2026,id:'current',accent:'#e8b42d',green:'#62ef9a',bg:'#06111b',panel:'#091722',ink:'#f7fafc'}
 ];
 const get=y=>eras.find(e=>y>=e.min&&y<=e.max)||eras[4];
 function apply(y=window.REDRAFT_SELECTED_YEAR||2017){const e=get(+y),b=document.body;if(!b)return;b.dataset.era=e.id;b.style.setProperty('--rd-accent',e.accent);b.style.setProperty('--rd-green',e.green);b.style.setProperty('--rd-bg',e.bg);b.style.setProperty('--rd-panel',e.panel);b.style.setProperty('--rd-ink',e.ink);document.documentElement.dataset.season=String(y)}
 const css=document.createElement('style');css.textContent=`body{background:var(--rd-bg)!important}.rdBrand span,.clock{color:var(--rd-green)!important}.teamRailTitle{border-bottom-color:var(--rd-accent)!important}.heroKicker,.heroStats h4,.pickNo{color:var(--rd-accent)!important}body[data-era=classic].rd-live .room,body[data-era=web2].rd-live .room{background:#b9c0c7!important}body[data-era=classic].rd-live main,body[data-era=classic].rd-live .side,body[data-era=classic].rd-live .teamRail,body[data-era=web2].rd-live main,body[data-era=web2].rd-live .side,body[data-era=web2].rd-live .teamRail{border-radius:1px!important;box-shadow:none!important}body[data-era=classic].rd-live .heroPlayer,body[data-era=web2].rd-live .heroPlayer{border-radius:0!important}body[data-era=classic].rd-live .player,body[data-era=web2].rd-live .player{font-family:Arial,sans-serif!important}body[data-era=prime].rd-live .room{background:#0e1e2b!important}body[data-era=current].rd-live .room{background:#06111b!important}`;document.head.appendChild(css);
 document.addEventListener('redraft-season-ready',e=>apply(e.detail.year));document.addEventListener('DOMContentLoaded',()=>apply());apply();window.REDRAFT_ERA=get;
})();