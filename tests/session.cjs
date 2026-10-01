// Real browser integration test: exercises the shipping API, draft buttons and CPU scheduler.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const root=path.resolve(__dirname,'..'),handler=require('../api/season.js');
const server=http.createServer(async(req,res)=>{const u=new URL(req.url,'http://local');if(u.pathname==='/api/season'){req.query=Object.fromEntries(u.searchParams);res.status=s=>(res.statusCode=s,res);res.json=j=>{res.setHeader('content-type','application/json');res.end(JSON.stringify(j))};await handler(req,res);return}const file=path.join(root,u.pathname==='/'?'index.html':u.pathname);if(!file.startsWith(root)||!fs.existsSync(file)){res.writeHead(404).end();return}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.json')?'application/json':'text/html');fs.createReadStream(file).pipe(res)});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'],headless:true});const context=await browser.newContext({viewport:{width:1440,height:900}});await context.route('https://**/*',r=>r.abort());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(url+'/play.html?year=2010');await page.waitForFunction(()=>window.REDRAFT_SEASON_READY);
 await page.locator('#scoring').selectOption('Half PPR');await page.waitForFunction(()=>window.REDRAFT_SEASON_READY);await page.locator('#slot').selectOption('11');
 const cfg={QB:1,RB:1,WR:1,TE:0,FLEX:0,K:0,DST:0,BENCH:1};for(const [pos,count]of Object.entries(cfg))await page.locator(`#rosterFields input[data-pos="${pos}"]`).fill(String(count));
 await page.locator('#start').click();await page.waitForFunction(()=>teamAt(pick)===user);
 const queued=await page.evaluate(()=>avail.find(p=>p.pos==='WR').id);await page.locator(`#players .player[data-id="${queued}"] .star`).click();
 const snapshot=await page.evaluate(()=>({picks:picks.map(x=>[x.p.id,x.t]),q:queue.map(p=>p.id),pool:avail.map(p=>p.id)}));
 const other=await context.newPage();await other.goto(url+'/play.html?year=2010');await other.waitForFunction(()=>window.REDRAFT_SEASON_READY);await other.evaluate(()=>{const s=JSON.parse(localStorage.getItem('redraft.draft.v1'));s.savedAt='other-tab';localStorage.setItem('redraft.draft.v1',JSON.stringify(s))});await page.waitForFunction(()=>!REDRAFT_STATE().active);assert((await page.locator('#saveIndicator').textContent()).includes('another tab'));await other.close();
 await page.locator('#saveExit').click();await page.waitForSelector('#resumeDraft');assert((await page.locator('#savedMessage').textContent()).includes('Half PPR'));
 // Even if the lobby changes, restore must load the saved year/scoring/slots, not current selections.
 await page.locator('#rdSeason').selectOption('2024');await page.waitForFunction(()=>window.REDRAFT_SEASON_READY&&REDRAFT_SELECTED_YEAR===2024);
 await page.locator('#resumeDraft').click();await page.waitForFunction(()=>REDRAFT_STATE().active&&teamAt(pick)===user);
 assert.deepEqual(await page.evaluate(()=>({picks:picks.map(x=>[x.p.id,x.t]),q:queue.map(p=>p.id),pool:avail.map(p=>p.id)})),snapshot);
 assert.equal(await page.evaluate(()=>REDRAFT_SELECTED_YEAR),2010);assert.equal(await page.locator('#scoring').inputValue(),'Half PPR');assert.deepEqual(await page.evaluate(()=>REDRAFT_ROSTER),cfg);
 // Refresh directly during a CPU turn. The saved prefix must survive and CPU must reach the user.
 const id=await page.evaluate(()=>REDRAFT_CPU_CHOICE(user).id);await page.locator(`#players .player[data-id="${id}"] .draft`).click();
 const prefix=await page.evaluate(()=>JSON.parse(localStorage.getItem('redraft.draft.v1')).picks);
 await page.reload();await page.waitForSelector('#resumeDraft');await page.locator('#resumeDraft').click();await page.waitForFunction(()=>REDRAFT_STATE().active&&teamAt(pick)===user);
 assert.deepEqual(await page.evaluate(count=>picks.slice(0,count).map(x=>({id:x.p.id,t:x.t})),prefix.length),prefix);
 while(await page.evaluate(()=>REDRAFT_STATE().active)){await page.waitForFunction(()=>!REDRAFT_STATE().active||teamAt(pick)===user);if(!await page.evaluate(()=>REDRAFT_STATE().active))break;const id=await page.evaluate(()=>REDRAFT_CPU_CHOICE(user).id);await page.locator(`#players .player[data-id="${id}"] .draft`).click()}
 assert(await page.locator('#finish').isVisible());assert.equal(await page.locator('#resultsRoster tr').count(),4);assert((await page.evaluate(()=>redraftAudit())).ok);
 await page.locator('#reviewBoard').click();await page.locator('#board .boardTeam').first().click();assert.equal(await page.locator('#rosterTeam').inputValue(),'0');assert.equal(await page.locator('#rightRoster .slot').count(),4);await page.screenshot({path:path.join(root,'tests/qa-results-board.png')});await page.locator('#backToResults').click();
 const downloadPromise=page.waitForEvent('download');await page.locator('#exportDraft').click();const download=await downloadPromise;assert.equal(download.suggestedFilename(),'redraft-2010-draft.csv');const csv=fs.readFileSync(await download.path(),'utf8');assert.equal(csv.split('\r\n').length,49);assert(csv.includes('"48","4","12"'));
 await page.screenshot({path:path.join(root,'tests/qa-results-desktop.png'),fullPage:true});
 await page.reload();await page.waitForSelector('#resumeDraft');assert.equal(await page.locator('#resumeDraft').textContent(),'REVIEW LAST DRAFT');await page.locator('#resumeDraft').click();await page.waitForSelector('#resultsRoster tr');assert.equal(await page.evaluate(()=>picks.length),48);assert.equal(await page.evaluate(()=>REDRAFT_STATE().active),false);
 // Corrupt or incompatible records do not start a partial draft or silently replace the save.
 await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('redraft.draft.v1'));s.signature='changed';localStorage.setItem('redraft.draft.v1',JSON.stringify(s))});await page.reload();await page.waitForSelector('#resumeDraft');await page.locator('#resumeDraft').click();await page.waitForFunction(()=>document.querySelector('#savedMessage').textContent.includes('changed'));assert(!await page.evaluate(()=>REDRAFT_STATE().active));
 await page.evaluate(()=>localStorage.setItem('redraft.draft.v1','{broken'));await page.reload();await page.waitForFunction(()=>window.REDRAFT_SEASON_READY);assert.equal(await page.locator('#resumeDraft').count(),0);assert(await page.locator('#start').isEnabled());
 assert.deepEqual(errors,[]);
 // Storage-denied environments still support gameplay and clearly announce that saving failed.
 const denied=await browser.newContext();await denied.route('https://**/*',r=>r.abort());await denied.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('denied','SecurityError')}});const privatePage=await denied.newPage();await privatePage.goto(url+'/play.html?year=2024');await privatePage.waitForFunction(()=>window.REDRAFT_SEASON_READY);await privatePage.locator('#start').click();assert((await privatePage.locator('#saveIndicator').textContent()).includes('unavailable'));assert(await privatePage.evaluate(()=>REDRAFT_STATE().active));
 await browser.close();server.close();console.log('PASS session: queue/settings, save/exit, CPU-turn reload, completed review, board/rosters, CSV, incompatible/corrupt saves, blocked storage.');
})().catch(e=>{console.error(e);process.exit(1)});
