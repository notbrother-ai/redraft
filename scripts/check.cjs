const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert/strict');
for(const file of fs.readdirSync('.').filter(p=>p.endsWith('.js')))new vm.Script(fs.readFileSync(file,'utf8'),{filename:file});
const html=fs.readFileSync('app.html','utf8');new vm.Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
for(let y=2000;y<=2026;y++){const j=JSON.parse(fs.readFileSync(`data/seasons/${y}.json`));assert.equal(j.year,y);assert(j.players.length>=180);assert.equal(new Set(j.players.map(p=>p.id)).size,j.players.length);assert(j.players.every(p=>p.name&&['QB','RB','WR','TE','K','DST'].includes(p.pos)&&Number.isFinite(p.adp)));}
console.log('Syntax and all 27 season snapshots validated. Static app requires no compilation.');
