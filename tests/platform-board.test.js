const test = require('node:test'), assert = require('node:assert/strict'), fs = require('fs'), vm = require('vm');
const { webcrypto } = require('node:crypto');
const origin = 'https://www.ai-made.games', gameId = '2769de6b-d070-44bd-9a13-567d5c453926';
function setup({ standalone = false, fetcher } = {}) {
  const listeners = new Map(), calls = [], messages = [];
  const context = vm.createContext({ G: {}, crypto: webcrypto, AbortSignal, Date, console, clearTimeout,
    setTimeout: (f, ms) => setTimeout(f, ms < 15000 ? 0 : ms),
    fetch: async (url, options) => { calls.push({ url, ...options }); return fetcher ? fetcher(url, options, calls) : Response.json(url.endsWith('/runs') ? { runId: 'test-run', submitBefore: new Date(Date.now()+7200000).toISOString() } : url.includes('/entries') ? { entries: [] } : url.includes('/me') ? { entry: null } : { accepted: true }); }
  });
  context.window = context;
  context.addEventListener = (type, f) => { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(f); };
  context.removeEventListener = (type, f) => listeners.get(type)?.delete(f);
  const emit = e => { for (const f of listeners.get('message') || []) f(e); };
  context.parent = standalone ? context : { postMessage(d, target) {
    messages.push({ d, target });
    const response = { source: 'aimadegames-platform', type: d.type, requestId: d.requestId, apiOrigin: origin, session: { token: 'test-player-token', gameId, expiresAt: '2099-01-01T00:00:00Z' } };
    queueMicrotask(() => { emit({ source: context.parent, origin: 'https://wrong.example', data: { ...response, error: 'untrusted' } }); emit({ source: context.parent, origin, data: response }); });
  } };
  vm.runInContext(fs.readFileSync('js/core/platform-board.js','utf8'), context);
  return { board: context.G.PlatformBoard, calls, messages };
}
async function until(fn) { for(let i=0;i<100;i++){if(fn())return;await new Promise(r=>setTimeout(r,5));}assert.fail('Timed out'); }
test('standalone and cooperative rounds never request a player session or submit scores', async()=>{
  const a=setup({standalone:true});a.board.start();a.board.finish(100);await new Promise(r=>setTimeout(r,10));assert.equal(a.calls.length,0);
  const b=setup();b.board.start(false);b.board.finish(100);assert.equal(b.messages.length,0);
});
test('real start and one final settlement use separate stable keys and integer milliseconds',async()=>{
  const s=setup();s.board.start();await until(()=>s.calls.length===1);s.board.finish(12.3459);s.board.finish(99);
  await until(()=>s.calls.length===2);assert.equal(s.calls[1].body,'{"score":12345}');
  assert.notEqual(s.calls[0].headers['Idempotency-Key'],s.calls[1].headers['Idempotency-Key']);
  assert.equal(s.messages[0].target,origin);assert.equal(s.calls[1].credentials,'omit');
});
test('network failures retry the exact run and score requests without changing keys',async()=>{
  let starts=0,scores=0;
  const s=setup({fetcher:async(url)=>{if(url.endsWith('/runs')){if(++starts===1)throw new TypeError('offline');return Response.json({runId:'same-run'});}if(++scores===1)throw new TypeError('lost receipt');return Response.json({accepted:true});}});
  s.board.start();await until(()=>starts===2);s.board.finish(3);await until(()=>scores===2);
  assert.equal(s.calls[0].headers['Idempotency-Key'],s.calls[1].headers['Idempotency-Key']);
  assert.equal(s.calls[2].headers['Idempotency-Key'],s.calls[3].headers['Idempotency-Key']);assert.equal(s.calls[2].body,s.calls[3].body);
});
test('ineligible rounds and identity changes prevent settlement',async()=>{
  const s=setup();s.board.start();await until(()=>s.calls.length===1);s.board.finish(100,false);await new Promise(r=>setTimeout(r,10));assert.equal(s.calls.length,1);
  s.board.start();await until(()=>s.calls.length===2);s.board.lock();s.board.finish(100);await new Promise(r=>setTimeout(r,10));assert.equal(s.calls.length,2);assert.equal(s.board.available,false);
});

test('expired credentials refresh through the parent and keep the original request key',async()=>{
  let attempts=0;
  const s=setup({fetcher:async()=>++attempts===1?Response.json({error:{code:'SESSION_EXPIRED'}},{status:401}):Response.json({runId:'refreshed'})});
  s.board.start();await until(()=>attempts===2);assert.equal(s.messages.length,2);
  assert.equal(s.calls[0].headers['Idempotency-Key'],s.calls[1].headers['Idempotency-Key']);
});

test('expired runs and out-of-range scores are never truncated or submitted',async()=>{
  const s=setup({fetcher:async()=>Response.json({runId:'expired',submitBefore:'2000-01-01T00:00:00Z'})});
  s.board.start();await until(()=>s.calls.length===1);s.board.finish(20);await new Promise(r=>setTimeout(r,10));assert.equal(s.calls.length,1);
  const t=setup();t.board.start();await until(()=>t.calls.length===1);t.board.finish(86401);await new Promise(r=>setTimeout(r,10));assert.equal(t.calls.length,1);
});
