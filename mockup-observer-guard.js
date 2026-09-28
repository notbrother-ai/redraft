// Prevent the redesigned room from observing its own renders while still reacting to engine updates.
(()=>{
 const Native=window.MutationObserver;
 window.__REDRAFT_NATIVE_MO=Native;
 window.MutationObserver=class {
  constructor(cb){
   this._inner=new Native((mutations,obs)=>{
    const meaningful=mutations.filter(m=>{
     const t=m.target?.nodeType===1?m.target:m.target?.parentElement;
     if(!t)return true;
     return !t.closest?.('#players,#heroPlayer,#rightRoster,#recentPicks,.status,.filters,.playerTableHead');
    });
    if(meaningful.length)cb(meaningful,obs);
   });
  }
  observe(...a){return this._inner.observe(...a)}
  disconnect(){return this._inner.disconnect()}
  takeRecords(){return this._inner.takeRecords()}
 };
})();
