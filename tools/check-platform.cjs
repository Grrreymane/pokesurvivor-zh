// Isolated browser integration checks against the real SDK and a simulated platform.
// All platform traffic is intercepted: no player cloud data or scores are accessed.
const fs = require('fs'), path = require('path'), assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/nff03/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '..'), origin = 'https://www.ai-made.games';
const gameOrigin = 'https://grrreymane.github.io', gameId = '2769de6b-d070-44bd-9a13-567d5c453926';
(async () => {
 const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
 try {
 const context = await browser.newContext(); let account = 'A', offline = false, conflict = false, writes = 0;
 const saves = new Map(), errors = []; let runCount = 0, scoreCount = 0, best = null;
 await context.route(origin + '/**', async route => {
   const url = new URL(route.request().url());
   const headers = { 'Access-Control-Allow-Origin': gameOrigin, 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET,PUT,POST,OPTIONS' };
   if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
   if (url.pathname === '/fixture') return route.fulfill({ contentType: 'text/html', body: `<iframe style="width:1280px;height:720px" src="${gameOrigin}/pokesurvivor-zh/dev.html?lang=${process.env.TEST_LANG || "en"}"></iframe><script>addEventListener('message',async e=>{if(e.origin!=='${gameOrigin}')return;const d=e.data;if(d.type==='cloud-save-session'||d.type==='leaderboard-session'){const a=await fetch('/fixture-account').then(r=>r.text());e.source.postMessage({source:'aimadegames-platform',type:d.type,requestId:d.requestId,apiOrigin:location.origin,session:{signedIn:true,identity:a,gameId:'${gameId}',token:(d.type==='leaderboard-session'?'rank-':'test-')+a,expiresAt:'2099-01-01T00:00:00Z',config:{enabled:true,schemaVersion:1,maxBytes:262144,historyLimit:3}}},e.origin);}});</script>` });
   if (url.pathname === '/fixture-account') return route.fulfill({ body: account });
   if (url.pathname === '/sdk/cloud-saves-v1.js') return route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(path.join(root,'tools/cache/cloud-sdk.js')) });
   if (url.pathname === '/sdk/v1.js') return route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(path.join(root,'tools/cache/i18n/sdk.js')) });
   if (url.pathname.includes('/i18n/')) return route.fulfill({ headers, contentType: 'application/json', body: fs.readFileSync(path.join(root,'translations/'+(process.env.TEST_LANG || 'en')+'.json')) });
   if (url.pathname.includes('/leaderboards/') || url.pathname.includes('/runs/')) {
     assert.ok(route.request().headers().authorization.startsWith('Bearer rank-'));
     if (url.pathname.endsWith('/runs')) { runCount++; return route.fulfill({headers,json:{runId:'test-run',submitBefore:new Date(Date.now()+7200000).toISOString()}}); }
     if (url.pathname.endsWith('/score')) { scoreCount++; const {score}=route.request().postDataJSON(); assert.ok(Number.isInteger(score)&&score>0);best={rank:1,score,player:{displayName:'Test player'}};return route.fulfill({headers,json:{accepted:true,personalBest:score}}); }
     return route.fulfill({headers,json:url.pathname.endsWith('/me')?{entry:best}:{entries:best?[best]:[]}});
   }
   if (url.pathname.endsWith('/saves/main')) {
     if (offline) return route.abort();
     const who = route.request().headers().authorization?.replace('Bearer test-', '');
     assert.ok(['A','B'].includes(who));
     const current = saves.get(who) || { revision: 0, save: null };
     if (route.request().method() === 'PUT') {
       const data = route.request().postDataJSON();
       if (conflict || data.baseRevision !== current.revision) return route.fulfill({ status: 409, headers, json: {error:{code:'CONFLICT',message:'Conflict'}} });
       writes++; saves.set(who, {revision:current.revision+1,save:{...data,revision:current.revision+1,updatedAt:new Date().toISOString()}});
       return route.fulfill({headers,json:{revision:current.revision+1,save:{revision:current.revision+1,updatedAt:new Date().toISOString()}}});
     }
     return route.fulfill({headers,json:current});
   }
   throw new Error('Unexpected platform request: '+url.pathname);
 });
 await context.route(gameOrigin + '/pokesurvivor-zh/**', async route => {
   const file=decodeURIComponent(new URL(route.request().url()).pathname.replace('/pokesurvivor-zh/','')) || 'index.html';
   const target=path.resolve(root,file); assert.ok(target.startsWith(root+path.sep));
   if(!fs.existsSync(target))return route.fulfill({status:404,body:'Not found'});
   const ext=path.extname(target), types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.ttf':'font/ttf','.ogg':'audio/ogg'};
   return route.fulfill({contentType:types[ext]||'application/octet-stream',body:fs.readFileSync(target)});
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 async function open(){await page.goto(origin+'/fixture');const f=page.frames().find(f=>f.url().includes('/dev.html'));await f.waitForFunction(()=>G.Platform.status.ready);return f;}
 let frame=await open();await frame.waitForSelector('#scr-test:not(.hidden)');
 for(let i=0;i<8;i++)await frame.locator('#test-a button').first().click();await frame.locator('#res-ok').click();
 await frame.evaluate(()=>window.AIMadeGames.saves.save());
 assert.equal(saves.get('A').save.data.progress.partner,813);
 frame=await open();await frame.waitForSelector('#scr-menu:not(.hidden)');assert.equal(await frame.evaluate(()=>G.DB.save.partner),813);
 offline=true;await frame.evaluate(async()=>{G.DB.save.coins=1234;G.DB.commit();await AIMadeGames.saves.save().catch(()=>{});});
 assert.equal(await frame.evaluate(()=>G.DB.save.coins),1234);
 offline=false;await frame.evaluate(()=>AIMadeGames.saves.retry());assert.equal(saves.get('A').save.data.progress.coins,1234);
 conflict=true;await frame.evaluate(async()=>{G.DB.save.coins=2345;await AIMadeGames.saves.save().catch(()=>{});});
 assert.equal(await frame.evaluate(()=>G.DB.save.coins),2345);assert.equal(saves.get('A').save.data.progress.coins,1234);
 conflict=false;await frame.evaluate(()=>AIMadeGames.saves.resolveConflict('local'));assert.equal(saves.get('A').save.data.progress.coins,2345);
 await frame.locator('[data-go="play"]').click();await page.waitForTimeout(1800);
 await frame.evaluate(()=>G.Game.quit());await page.waitForTimeout(500);
 assert.equal(runCount,1);assert.equal(scoreCount,1);
 await frame.evaluate(()=>G.Flow.goMenu());await frame.locator('[data-go="platform-board"]').click();
 await frame.waitForFunction(()=>document.getElementById('platform-board-list').children.length===1);
 await page.waitForTimeout(600);
 await frame.locator('#scr-platform-board').screenshot({path:'tools/cache/platform-board-'+(process.env.TEST_LANG || 'en')+'.png'});
 await frame.locator('#platform-board-close').click();await frame.evaluate(()=>G.SettingsUI.open('save'));
 await page.waitForTimeout(600);
 await frame.locator('#scr-settings').screenshot({path:'tools/cache/platform-cloud-'+(process.env.TEST_LANG || 'en')+'.png'});await frame.evaluate(()=>G.SettingsUI.close());
 account='B';await frame.evaluate(()=>AIMadeGames.saves.retry().catch(()=>{}));
 assert.equal(await frame.evaluate(()=>AIMadeGames.saves.getStatus().status),'signed-out');
 const before=writes;await frame.evaluate(()=>AIMadeGames.saves.save().catch(()=>{}));assert.equal(writes,before);
 frame=await open();await frame.waitForSelector('#scr-test:not(.hidden)');assert.equal(await frame.evaluate(()=>G.DB.save.partner),null);
 assert.equal(saves.get('A').save.data.progress.coins,2345);
 assert.deepEqual(errors,[]);console.log(JSON.stringify({restore:true,offline:true,conflict:true,accountIsolation:true,leaderboardRun:true,leaderboardSettlement:true,errors,writes}));
 await context.close();
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
