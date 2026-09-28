const vm=require('vm'),fs=require('fs'),assert=require('assert/strict');const context={window:{},document:{addEventListener(){}},Set,String};vm.createContext(context);for(const f of ['verified-portraits.js','photo-fallbacks.js'])vm.runInContext(fs.readFileSync(f,'utf8'),context);const photo=context.window.photo;
const player=(year,name,team)=>require(`../data/seasons/${year}.json`).players.find(p=>p.name===name&&(!team||p.team===team));
assert.equal(photo({name:'Unknown Player',pos:'RB',espnId:'11258'}),'');
assert(photo(player(2014,'Jordy Nelson')).endsWith('/11270.png'));
assert(photo(player(2010,'Chris Johnson','TEN')).endsWith('/11258.png'));
const bear=player(2005,'Adrian Peterson','CHI'),viking=player(2010,'Adrian Peterson','MIN');assert(bear&&viking);assert.notEqual(bear.portraitId,viking.portraitId);assert.notEqual(photo(bear),photo(viking));
let mapped=0,fallback=0;for(let y=2000;y<=2026;y++)for(const p of require(`../data/seasons/${y}.json`).players){if(p.pos==='DST')continue;const src=photo(p);if(p.portraitId){assert(src);const r=context.window.REDRAFT_VERIFIED_PORTRAITS[p.portraitId];assert(r.sha256&&r.width>=40&&r.height>=40);mapped++}else{assert.equal(src,'');fallback++}}
console.log(JSON.stringify({mappedPlayerSeasons:mapped,fallbackPlayerSeasons:fallback,namesakeChecks:'passed'}));
