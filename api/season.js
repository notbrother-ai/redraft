// Vercel serverless endpoint: historical preseason ADP + player metadata.
// Uses MyFantasyLeague's historical season exports so drafts are based on draft-market information, not hindsight results.
module.exports = async function handler(req,res){
  const year=Number(req.query.year);
  if(!Number.isInteger(year)||year<2000||year>2026)return res.status(400).json({error:'year must be 2000-2026'});
  const base=`https://api.myfantasyleague.com/${year}/export`;
  const qs='JSON=1';
  try{
    const [ar,pr]=await Promise.all([
      fetch(`${base}?TYPE=adp&PERIOD=ALL&FCOUNT=12&IS_PPR=-1&IS_KEEPER=N&IS_MOCK=-1&CUTOFF=1&DETAILS=&${qs}`,{headers:{'user-agent':'RE-DRAFT historical fantasy simulator'}}),
      fetch(`${base}?TYPE=players&DETAILS=1&${qs}`,{headers:{'user-agent':'RE-DRAFT historical fantasy simulator'}})
    ]);
    if(!ar.ok||!pr.ok)throw new Error(`MFL ${ar.status}/${pr.status}`);
    const [aj,pj]=await Promise.all([ar.json(),pr.json()]);
    const adp=(aj.adp&&aj.adp.player)||[];
    const players=(pj.players&&pj.players.player)||[];
    const byId=new Map(players.map(p=>[String(p.id),p]));
    const clean=[];
    for(const a of adp){
      const m=byId.get(String(a.id)); if(!m)continue;
      let pos=String(m.position||'').toUpperCase();
      if(pos==='PK')pos='K'; if(pos==='DEF'||pos==='DF'||pos==='D/ST')pos='DST';
      if(!['QB','RB','WR','TE','K','DST'].includes(pos))continue;
      const avg=Number(a.averagePick||a.averagepick||a.adp); if(!Number.isFinite(avg)||avg<=0)continue;
      clean.push({name:m.name||m.fullName||`Player ${a.id}`,pos,team:m.team||'FA',adp:+avg.toFixed(1),mflId:String(a.id),espnId:m.espn_id||m.espnId||null});
    }
    clean.sort((a,b)=>a.adp-b.adp);
    const seen=new Set(); const unique=clean.filter(p=>{const k=p.name+'|'+p.pos;if(seen.has(k))return false;seen.add(k);return true});
    const count={}; unique.forEach(p=>{count[p.pos]=(count[p.pos]||0)+1;p.pr=count[p.pos]});
    if(unique.length<40)throw new Error(`Only ${unique.length} usable players returned`);
    res.setHeader('Cache-Control','public, s-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).json({year,source:'MyFantasyLeague historical ADP',players:unique.slice(0,320)});
  }catch(e){return res.status(502).json({error:'Historical season data unavailable',year,detail:String(e.message||e)});}
};