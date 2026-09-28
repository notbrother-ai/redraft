// Keep the redesigned draft room synchronized with the underlying draft engine without render loops.
(()=>{
 const sync=()=>{
  try{
   if(typeof window.renderRows==='function') window.renderRows();
  }catch(e){}
  try{
   // mockup-ui functions are lexical, so use a lightweight event to force its season-ready render path.
   document.dispatchEvent(new CustomEvent('redraft-ui-sync'));
  }catch(e){}
 };
 function patch(name){
  let tries=0;
  const go=()=>{
   const fn=window[name];
   if(typeof fn!=='function'){if(tries++<200)setTimeout(go,25);return}
   if(fn.__rdSync)return;
   const wrapped=function(...args){const out=fn.apply(this,args);setTimeout(sync,0);return out};
   wrapped.__rdSync=true;window[name]=wrapped;
  };go();
 }
 ['render','renderRoster','take','draft','q'].forEach(patch);
 document.addEventListener('redraft-season-ready',()=>setTimeout(sync,0));
})();
