// Server-side readiness audit for every historical season.
// Runs seasons in parallel so Vercel does not spend 27 sequential network round trips.
const season=require('./season');
function call(year){return new Promise(resolve=>{const req={query:{year:String(year),teams:'12',scoring:'standard'},headers:{}};let code=200;const res={status(n){code=n;return this},setHeader(){return this},json(body){resolve({year,status:code,body})}};Promise.resolve(season(req,res)).catch(e=>resolve({year,status:500,body:{error:String(e.message||e)}}))})}
module.exports=async function handler(req,res){
 const years=Array.from({length:27},(_,i)=>2000+i);
 const results=await Promise.all(years.map(call));
 const seasons=results.map(r=>{const ps=Array.isArray(r.body?.players)?r.body.players:[],positions={};ps.forEach(p=>positions[p.pos]=(positions[p.pos]||0)+1);const core=['QB','RB','WR','TE'].every(p=>(positions[p]||0)>0),unique=new Set(ps.map(p=>`${String(p.name).toLowerCase()}|${p.pos}`)).size===ps.length,ordered=ps.every((p,i)=>i===0||Number(ps[i-1].adp)<=Number(p.adp)),ok=r.status===200&&ps.length>=40&&core&&unique&&ordered;return{year:r.year,ok,count:ps.length,source:r.body?.source||null,positions,checks:{minimumPool:ps.length>=40,corePositions:core,uniquePlayers:unique,adpOrdered:ordered},error:ok?null:(r.body?.detail||r.body?.error||`season validation failed (HTTP ${r.status})`)}});
 const ready=seasons.filter(x=>x.ok).length;
 res.setHeader('Cache-Control','public, s-maxage=1800, stale-while-revalidate=86400');
 res.setHeader('Access-Control-Allow-Origin','*');
 return res.status(ready===27?200:207).json({ok:ready===27,ready,total:27,checkedAt:new Date().toISOString(),seasons});
};