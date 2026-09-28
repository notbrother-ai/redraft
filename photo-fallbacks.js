// Frozen identity mappings only. Never search by name or substitute another person's image.
(() => {
  const failed=new Set();
  window.photo=function(p){
    const record=window.REDRAFT_VERIFIED_PORTRAITS?.[p.portraitId];
    return record&&!failed.has(record.url)?record.url:'';
  };
  window.playerPhotoSources=p=>window.photo(p)?[window.photo(p)]:[];
  window.REDRAFT_PHOTO_FALLBACK=function(p){
    const label=p.pos==='DST'?p.team:initials(p.name),title=p.pos==='DST'?'Team defense':'Verified portrait unavailable';
    return `<span class="fallback" title="${title}" aria-label="${title}"><svg viewBox="0 0 100 100" aria-hidden="true"><path d="M15 95Q15 60 50 60Q85 60 85 95"/><circle cx="50" cy="33" r="22"/></svg><b>${label}</b></span>`;
  };
  document.addEventListener('error',e=>{
    const img=e.target;if(!(img instanceof HTMLImageElement)||!img.closest('.photo,.heroPhoto'))return;
    failed.add(img.src);
    img.outerHTML=window.REDRAFT_PHOTO_FALLBACK({name:img.alt||'Player',pos:img.dataset.pos,team:img.dataset.team});
  },true);
})();
