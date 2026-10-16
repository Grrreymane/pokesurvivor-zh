'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const ROOT = path.resolve(__dirname, '..');

class MemoryStorage {
  constructor() { this.values = new Map(); this.blockWrites = false; }
  get length() { return this.values.size; }
  key(index) { return [...this.values.keys()][index] ?? null; }
  getItem(key) { return this.values.get(String(key)) ?? null; }
  setItem(key, value) {
    if (this.blockWrites) throw new Error('Storage unavailable');
    this.values.set(String(key), String(value));
  }
  removeItem(key) { this.values.delete(String(key)); }
}

function page(storage = new MemoryStorage()) {
  const events = [];
  const elements = new Map();
  const noop = () => {};
  const el = id => {
    if (!elements.has(id)) elements.set(id, { classList: { add: name => events.push([id, name]) } });
    return elements.get(id);
  };
  const context = vm.createContext({
    G: {}, localStorage: storage, crypto: webcrypto, TextEncoder, console,
    setTimeout, clearTimeout, addEventListener: noop,
    location: { protocol: 'http:', hostname: 'localhost' },
    navigator: { onLine: false },
    document: { addEventListener: noop, getElementById: el, querySelector: el }
  });
  context.window = context;
  for (const file of ['js/data/pokedex.js', 'js/core/firebase-config.js', 'js/core/db.js', 'js/game.js']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), context, { filename: file });
  }
  const G = context.G;
  G.UI = { initChrome: noop, toast: text => events.push(['toast', text]) };
  for (const name of ['TestUI', 'MenuUI', 'GachaUI', 'SocialUI', 'RankingUI', 'ModUI', 'GoalsUI', 'ProfileUI', 'SettingsUI', 'SupportUI', 'NewsUI', 'Updater']) {
    G[name] = { init: noop, open: () => events.push(['open', name]), start: () => events.push(['start', name]) };
  }
  G.Audio = { music: name => events.push(['music', name]) };
  G.Game = { state: 'ui', init: noop, toUI() { this.state = 'ui'; } };
  return {
    G, events, storage,
    async boot() {
      G.Flow.boot();
      await G.DB.ready();
      await new Promise(resolve => setImmediate(resolve));
    }
  };
}

test('first visit enters partner setup directly and the next visit restores the same save', async () => {
  const first = page();
  await first.boot();
  assert.equal(first.G.DB.guest, false);
  assert.ok(first.events.some(([event, name]) => event === 'start' && name === 'TestUI'));
  first.G.DB.grant(25, 'starter');
  first.G.DB.save.partner = 25;
  first.G.DB.save.coins = 1234;
  assert.equal(first.G.DB.commit(), true);

  const reopened = page(first.storage);
  await reopened.boot();
  assert.equal(reopened.G.DB.save.partner, 25);
  assert.equal(reopened.G.DB.save.coins, 1234);
  assert.ok(reopened.events.some(([event, name]) => event === 'open' && name === 'MenuUI'));
  assert.ok(!reopened.events.some(([event, name]) => event === 'start' && name === 'TestUI'));
});

test('automatic entry preserves an active legacy named save without switching to the quick slot', async () => {
  const previous = page();
  const db = previous.G.DB;
  await db.ready();
  db.playLocal();
  db.save.coins = 222;
  db.commit();
  await db.logout();
  assert.equal((await db.register('TrainerA', 'password-a')).ok, true);
  db.grant(1, 'starter');
  db.save.partner = 1;
  db.save.coins = 111;
  db.commit();
  const quickSave = previous.storage.getItem('ps.save.__local_adventure__');

  const reopened = page(previous.storage);
  await reopened.boot();
  assert.equal(reopened.G.DB.user, 'TrainerA');
  assert.equal(reopened.G.DB.save.partner, 1);
  assert.equal(reopened.G.DB.save.coins, 111);
  assert.equal(previous.storage.getItem('ps.save.__local_adventure__'), quickSave);
});

test('reset changes only the current save and persists a fresh partner-selection state', async () => {
  const previous = page();
  const db = previous.G.DB;
  await db.ready();
  db.playLocal();
  db.save.coins = 222;
  db.commit();
  await db.logout();
  await db.register('TrainerA', 'password-a');
  db.grant(1, 'starter');
  db.save.partner = 1;
  db.save.coins = 111;
  db.commit();
  const quickSave = previous.storage.getItem('ps.save.__local_adventure__');
  assert.equal(db.resetProgress().ok, true);
  assert.equal(db.user, 'TrainerA');
  assert.equal(db.save.partner, null);
  assert.equal(db.save.coins, db.START_COINS);
  assert.equal(previous.storage.getItem('ps.save.__local_adventure__'), quickSave);

  const reopened = page(previous.storage);
  await reopened.boot();
  assert.equal(reopened.G.DB.save.partner, null);
  assert.ok(reopened.events.some(([event, name]) => event === 'start' && name === 'TestUI'));
});

test('failed reset leaves existing progress intact', async () => {
  const current = page();
  await current.boot();
  current.G.DB.save.coins = 987;
  current.G.DB.commit();
  const saved = current.storage.getItem('ps.save.__local_adventure__');
  current.storage.blockWrites = true;
  assert.equal(current.G.DB.resetProgress().ok, false);
  assert.equal(current.G.DB.save.coins, 987);
  assert.equal(current.storage.getItem('ps.save.__local_adventure__'), saved);
});

test('blocked storage can still enter partner setup with a temporary-progress notice', async () => {
  const storage = new MemoryStorage();
  storage.blockWrites = true;
  const current = page(storage);
  await current.boot();
  assert.ok(current.G.DB.save);
  assert.ok(current.events.some(([event, name]) => event === 'start' && name === 'TestUI'));
  assert.ok(current.events.some(([event, text]) => event === 'toast' && text.includes('本次进度仅在当前页面保留')));
});
