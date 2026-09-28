// Only checked identities may produce a headshot URL. All other players use initials.
(() => {
  const failed=new Set();
  const key=s=>String(s).toLowerCase().replace(/[^a-z0-9]/g,'');
  window.photo=function(p){
    const k=key(p.name),record=window.REDRAFT_VERIFIED_PORTRAITS?.[k],year=p.season||window.REDRAFT_SELECTED_YEAR;
    if(!record||record.position!==p.pos||failed.has(k))return '';
    // Distinguish historical players who share a name with a later NFL player.
    if(k==='adrianpeterson'&&(year<2007||p.team!=='MIN'))return '';
    if(k==='michaelthomas'&&(year<2016||p.team!=='NO'))return '';
    if(k==='davidjohnson'&&year<2015)return '';
    if(k==='chrisjohnson'&&year<2008)return '';
    return `https://a.espncdn.com/i/headshots/nfl/players/full/${record.id}.png`;
  };
  window.playerPhotoSources=p=>photo(p)?[photo(p)]:[];
  document.addEventListener('error',e=>{
    const img=e.target;if(!(img instanceof HTMLImageElement)||!img.closest('.photo,.heroPhoto'))return;
    failed.add(key(img.alt));const span=document.createElement('span');span.className='fallback';span.textContent=initials(img.alt||'Player');span.title='Player portrait unavailable';img.replaceWith(span);
  },true);
})();
