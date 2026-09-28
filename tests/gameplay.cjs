// Real browser integration test: exercises the shipping API, draft buttons and CPU scheduler.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const root=path.resolve(__dirname,'..'),handler=require('../api/season.js');
const server=http.createServer(async(req,res)=>{const u=new URL(req.url,'http://local');if(u.pathname==='/api/season'){req.query=Object.fromEntries(u.searchParams);res.status=s=>(res.statusCode=s,res);res.json=j=>{res.setHeader('content-type','application/json');res.end(JSON.stringify(j))};await handler(req,res);return}const file=path.join(root,u.pathname==='/'?'index.html':u.pathname);if(!file.startsWith(root)||!fs.existsSync(file)){res.writeHead(404).end();return}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.json')?'application/json':'text/html');fs.createReadStream(file).pipe(res)});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=process.env.QA_URL||`http://127.0.0.1:${server.address().port}`;const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'],headless:true});const summary=[];
for(const [year,teams,slot] of [[2003,12,0],[2008,12,11],[2010,10,9],[2017,12,5],[2024,12,11],[2026,12,0]]){
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${url}/play.html?year=${year}`);await page.waitForFunction(()=>window.REDRAFT_SEASON_READY);
 await page.locator('#teams').selectOption(String(teams));await page.waitForFunction(()=>window.REDRAFT_SEASON_READY);await page.locator('#slot').selectOption(String(slot));await page.locator('#start').click();
 await page.waitForFunction(()=>REDRAFT_STATE().active&&teamAt(pick)===user);
 // All filters and a search must read the selected year's available pool.
 for(const pos of ['QB','RB','WR','TE','K','DST','ALL']){await page.locator(`.filters button[data-pos="${pos}"]`).click();assert(await page.evaluate(pos=>[...document.querySelectorAll('#players .player')].every(row=>pos==='ALL'||avail.find(p=>p.id===+row.dataset.id).pos===pos),pos),`${year} ${pos} filter`)}
 const target=await page.evaluate(()=>avail.find(p=>p.pos==='WR').name);await page.locator('#mockSearch').fill(target);assert(await page.locator('#players .player').count()>0);await page.locator('#mockSearch').fill('zz-no-such-player');assert.equal(await page.locator('#players .player').count(),0);await page.locator('#mockSearch').fill('');
 // Idle DOM must stop changing; counts exclude async image verification.
 await page.evaluate(()=>{window.qaMutations=0;window.qaObserver=new MutationObserver(ms=>qaMutations+=ms.length);qaObserver.observe(document.querySelector('#players'),{childList:true,subtree:true})});await page.waitForTimeout(600);const idle=await page.evaluate(()=>{qaObserver.disconnect();return qaMutations});assert(idle<10,`Idle mutations: ${idle}`);
 const before=await page.evaluate(()=>({id:avail[0].id,count:rosters[user].length}));
 const first=await page.evaluate(()=>REDRAFT_CPU_CHOICE(user).id);await page.locator(`#players .player[data-id="${first}"] .star`).click();assert(await page.evaluate(id=>queue.some(p=>p.id===id),first));
 await page.screenshot({path:path.join(root,`tests/qa-room-${year}.png`),fullPage:true});let userPicks=0;const began=Date.now();
 while(await page.evaluate(()=>REDRAFT_STATE().active)){
   await page.waitForFunction(()=>!REDRAFT_STATE().active||teamAt(pick)===user,{},{timeout:15000});if(!await page.evaluate(()=>REDRAFT_STATE().active))break;
   const choice=await page.evaluate(()=>({id:REDRAFT_CPU_CHOICE(user).id,pick,count:rosters[user].length}));
   await page.locator(`#players .player[data-id="${choice.id}"] .draft`).click();
   const result=await page.evaluate(id=>({removed:!avail.some(p=>p.id===id),count:rosters[user].length,recent:document.querySelector('#recentPicks').textContent,hero:document.querySelector('.heroName')?.textContent,name:picks.find(x=>x.p.id===id).p.name}),choice.id);
   assert(result.removed);assert.equal(result.count,choice.count+1);assert(result.recent.includes(result.name));assert.notEqual(result.hero,result.name);userPicks++;
 }
 const audit=await page.evaluate(()=>redraftAudit());assert(audit.ok,JSON.stringify(audit));
 const order=await page.evaluate(()=>picks.every((p,i)=>p.t===teamAt(i)));assert(order);
 assert(await page.locator('#finish').isVisible());assert(!await page.locator('#room').isVisible());assert.equal(userPicks,15);assert.deepEqual(errors,[]);
 await page.screenshot({path:path.join(root,`tests/qa-${year}.png`),fullPage:true});summary.push({year,teams,slot:slot+1,userPicks,picks:audit.picks,pool:audit.master,seconds:Math.round((Date.now()-began)/1000),idleMutations:idle,errors});console.log('PASS',JSON.stringify(summary.at(-1)));await page.close();
}
// Loading every year through the UI and overlapping selections must preserve the last requested year.
const lobby=await browser.newPage();const lobbyErrors=[];lobby.on('pageerror',e=>lobbyErrors.push(e.message));await lobby.goto(`${url}/play.html`);await lobby.waitForFunction(()=>window.REDRAFT_SEASON_READY);
for(let year=2000;year<=2026;year++){await lobby.locator('#rdSeason').selectOption(String(year));await lobby.waitForFunction(y=>REDRAFT_SEASON_READY&&REDRAFT_SELECTED_YEAR===y,year);assert(await lobby.evaluate(y=>P.every(p=>p.season===y),year));assert(await lobby.locator('#start').isEnabled())}
await lobby.evaluate(()=>Promise.all([REDRAFT_LOAD_SEASON(2003),REDRAFT_LOAD_SEASON(2010),REDRAFT_LOAD_SEASON(2024)]));assert(await lobby.evaluate(()=>REDRAFT_SELECTED_YEAR===2024&&P.every(p=>p.season===2024)));
await lobby.locator('#rdSeason').selectOption('2017');await lobby.waitForFunction(()=>window.REDRAFT_SEASON_READY&&REDRAFT_SELECTED_YEAR===2017);await lobby.screenshot({path:path.join(root,'tests/qa-lobby.png'),fullPage:true});assert.deepEqual(lobbyErrors,[]);await lobby.close();
// All supported season endpoints must return only the requested season, distinct IDs and sufficient depth.
for(let year=2000;year<=2026;year++){const j=await (await fetch(`${url}/api/season?year=${year}&teams=12&scoring=ppr`)).json();assert.equal(j.year,year);assert(j.players.length>=180);assert.equal(new Set(j.players.map(p=>p.id)).size,j.players.length)}
fs.writeFileSync(path.join(root,'tests/qa-results.json'),JSON.stringify({testedAt:new Date().toISOString(),url,seasons:summary,all27Seasons:true},null,2));await browser.close();server.close();console.log('PASS ALL');
})().catch(e=>{console.error(e);process.exit(1)});
