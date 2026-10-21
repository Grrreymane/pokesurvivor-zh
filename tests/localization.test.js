'use strict';

// Run with `node --test tests/localization.test.js`; no browser or network needed.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');

const ROOT = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const entryScripts = [...read('dev.html').matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/g)]
  .map(match => match[1]);
const languageScripts = entryScripts.filter(file =>
  /^js\/core\/(?:platform-)?i18n\.js$/.test(file) ||
  /^js\/data\/(?:text-original|pokedex)\.js$/.test(file));
const countSlots = text => (text.match(/\{x\}/g) || []).length;
const plain = value => JSON.parse(JSON.stringify(value));

class MemoryStorage {
  constructor() { this.values = new Map(); }
  get length() { return this.values.size; }
  key(index) { return [...this.values.keys()][index] ?? null; }
  getItem(key) { return this.values.get(String(key)) ?? null; }
  setItem(key, value) { this.values.set(String(key), String(value)); }
  removeItem(key) { this.values.delete(String(key)); }
}

// Every VM owns its Canvas prototype: language wrappers must not leak between pages.
function browser({ language, storage = new MemoryStorage(), pathname = '/' } = {}) {
  if (language !== undefined) storage.setItem('ps.lang', language);
  const canvasCalls = [];
  const dialogCalls = [];
  const observers = [];
  const loaded = [];
  const dictionaries = [];
  let currentFile;
  let reloads = 0;

  class CanvasContext {
    font = '16px Pixelify';
    fillText(text, ...args) { canvasCalls.push({ kind: 'fill', text, args }); }
    strokeText(text, ...args) { canvasCalls.push({ kind: 'stroke', text, args }); }
    measureText(text) {
      canvasCalls.push({ kind: 'measure', text });
      return { width: text.length * 10 };
    }
  }

  const body = element();
  const document = {
    documentElement: { lang: '' }, body, title: 'PokéSurvivor',
    querySelectorAll: () => [],
    addEventListener() {},
    createTreeWalker(root) {
      const descendants = [];
      const collect = node => {
        for (const child of node.children || []) { descendants.push(child); collect(child); }
      };
      collect(root);
      let index = 0;
      return { nextNode: () => descendants[index++] || null };
    },
    createElement() { throw new Error('A local test unexpectedly tried to load a remote script'); }
  };
  class Observer {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe() {}
  }
  const context = vm.createContext({
    G: {}, localStorage: storage, document,
    navigator: { language: 'en-US', languages: ['en-US'], onLine: false },
    location: { pathname, search: language ? '?lang=' + language : '', href: 'http://localhost/' + (language ? '?lang=' + language : ''), protocol: 'http:', hostname: 'localhost', assign(url) { this.href = url; reloads++; } },
    URL, URLSearchParams,
    AIMadeGames: { async i18n({ original, lang }) {
      const catalog = lang === 'zh' ? original : JSON.parse(read('translations/' + lang + '.json'));
      return (key, vars) => (catalog[key] ?? original[key] ?? key).replace(/\{(\w+)\}/g, (all, k) => vars && Object.hasOwn(vars, k) ? vars[k] : all);
    } },
    CanvasRenderingContext2D: CanvasContext,
    MutationObserver: Observer,
    NodeFilter: { SHOW_TEXT: 4, SHOW_ELEMENT: 1 },
    crypto: webcrypto, TextEncoder, console, setTimeout, clearTimeout,
    addEventListener() {},
    confirm(text) { dialogCalls.push({ kind: 'confirm', text }); return true; },
    alert(text) { dialogCalls.push({ kind: 'alert', text }); }
  });
  context.window = context;

  function run(file) {
    currentFile = file;
    vm.runInContext(read(file), context, { filename: file });
    loaded.push(file);
    if (file === 'js/core/i18n.js') {
      const add = context.G.I18n.add;
      context.G.I18n.add = dictionary => {
        dictionaries.push({ file: currentFile, entries: plain(dictionary) });
        return add(dictionary);
      };
    }
  }
  return {
    context, storage, loaded, dictionaries, canvasCalls, dialogCalls, observers, run,
    get reloads() { return reloads; },
    async languages() { for (const file of languageScripts) run(file); await context.G.Text.init(); return this; },
    async database() {
      run('js/data/pokedex.js');
      run('js/core/firebase-config.js');
      run('js/core/db.js');
      return context.G.DB;
    }
  };
}

function element({ untranslated = false, attributes = {} } = {}) {
  return {
    nodeType: 1, children: [],
    closest: () => untranslated ? {} : null,
    getAttribute: name => attributes[name] ?? null,
    setAttribute(name, value) { attributes[name] = value; }
  };
}

function textNode(text, parent = element()) {
  const node = { nodeType: 3, nodeValue: text, parentElement: parent };
  parent.children.push(node);
  return node;
}

test('Chinese dictionaries cover every upstream English key and preserve every placeholder', async () => {
  const english = await browser({ language: 'en' }).languages();
  const chinese = await browser({ language: 'zh-CN' }).languages();
  const original = Object.assign({}, ...english.dictionaries.map(dict => dict.entries));
  const translated = Object.assign({}, ...chinese.dictionaries.map(dict => dict.entries));
  assert.ok(Object.keys(original).length > 500, 'The upstream dictionary must actually be loaded');
  const missing = Object.keys(original).filter(key => !(key in translated));
  assert.deepEqual(missing, [], 'Spanish source strings without a Chinese translation');

  // Check every contribution before merging, including supplemental overrides.
  for (const { file, entries } of chinese.dictionaries) {
    for (const [key, value] of Object.entries(entries)) {
      assert.equal(typeof value, 'string', `${file}: ${key}`);
      assert.ok(value.trim(), `${file}: empty translation for ${key}`);
      assert.equal(countSlots(value), countSlots(key), `${file}: lost placeholder in ${key}`);
    }
  }
});

test('without a lang parameter the browser language is used', async () => {
  const page = await browser().languages();
  assert.equal(page.context.G.I18n.lang, 'en');
  assert.equal(page.context.document.documentElement.lang, 'en');
  assert.equal(page.context.G.T('Pausa'), 'Pause');
  assert.equal(page.context.G.T('Pistola Agua'), 'Water Gun');
});

test('dynamic battle messages translate names, numbers and multiple placeholders', async () => {
  const { context: { G } } = await browser({ language: 'zh-CN' }).languages();
  assert.equal(G.T('¡Has conseguido a Pikachu shiny!'), '获得了异色 皮卡丘！');
  assert.equal(G.T('¡Pikachu shiny salvaje apareció!'), '野生的异色 皮卡丘 出现了！');
  assert.equal(G.T('¡Nivel 12!'), '升至 12 级！');
  assert.equal(G.T('Grieta · 35 m · 18 s'), '裂隙 · 35 米 · 18 秒');
  assert.equal(G.T('¡Poder Furia! daño ×2 durante 15 s'), '狂怒之力！伤害 ×2，持续 15 秒');
  assert.equal(G.T('  Pausa\n'), '  暂停\n');
  assert.equal(G.T('785'), '785');
  assert.equal(G.T(null), null);
});

test('supplemental overrides replace dynamic translations and invalidate cached messages', async () => {
  const { context: { G } } = await browser({ language: 'zh-CN' }).languages();
  assert.equal(G.T('¡Nivel 12!'), '升至 12 级！');
  G.I18n.add({ '¡Nivel {x}!': '已升至 {x} 级！' });
  assert.equal(G.T('¡Nivel 12!'), '已升至 12 级！');
  assert.equal(G.T('¡Nivel 15!'), '已升至 15 级！');
});

test('DOM updates translate while player nicknames remain untouched', async () => {
  const page = await browser({ language: 'zh-CN' }).languages();
  page.context.G.I18n.startDom();
  assert.equal(page.observers.length, 1);
  const label = textNode('Pausa');
  page.observers[0].callback([{ type: 'childList', addedNodes: [label] }]);
  assert.equal(label.nodeValue, '暂停');
  label.nodeValue = '¡Nivel 7!';
  page.observers[0].callback([{ type: 'characterData', target: label }]);
  assert.equal(label.nodeValue, '升至 7 级！');

  const nickname = textNode('Pikachu', element({ untranslated: true }));
  page.context.G.I18n.walk(nickname);
  assert.equal(nickname.nodeValue, 'Pikachu');
  const button = element({ attributes: { title: 'Pausa', 'aria-label': 'Pausa' } });
  page.context.G.I18n.walk(button);
  assert.equal(button.getAttribute('title'), '暂停');
  assert.equal(button.getAttribute('aria-label'), '暂停');
});

test('canvas measurement, drawing and dialogs receive the same translated text', async () => {
  const page = await browser({ language: 'zh-CN' }).languages();
  const ctx = new page.context.CanvasRenderingContext2D();
  const measurement = ctx.measureText('Pausa');
  ctx.fillText('Pausa', 10, 20);
  ctx.strokeText('Pausa', 10, 20);
  assert.equal(measurement.width, 20);
  assert.deepEqual(page.canvasCalls.map(call => call.text), ['暂停', '暂停', '暂停']);
  assert.equal(page.context.confirm('Pausa'), true);
  page.context.alert('Pausa');
  assert.deepEqual(page.dialogCalls.map(call => call.text), ['暂停', '暂停']);
});

test('switching to English after Chinese reloads without Chinese dictionaries or names', async () => {
  const chinese = await browser({ language: 'zh-CN' }).languages();
  chinese.context.G.I18n.set('en');
  assert.equal(chinese.storage.getItem('ps.lang'), 'en');
  assert.equal(chinese.reloads, 1);
  const english = await browser({ storage: chinese.storage }).languages();
  assert.equal(english.context.G.I18n.lang, 'en');
  assert.equal(english.context.G.T('Pausa'), 'Pause');
  assert.equal(english.context.G.T('Pistola Agua'), 'Water Gun');
  assert.equal(english.context.G.T('¡Nivel 12!'), 'Level 12!');
  assert.equal(english.context.G.T('¡Has conseguido a Pikachu shiny!'), 'You got a shiny Pikachu!');
  assert.equal(english.context.G.DEX_BY[25].name, 'Pikachu');
  assert.ok(chinese.context.location.href.endsWith('?lang=en'));
  assert.ok(!english.loaded.some(file => file.includes('lang-zh')));
});

test('every playable Pokémon has a Chinese name without changing stats or dex identity', async () => {
  const chinese = (await browser({ language: 'zh-CN' }).languages()).context.G;
  const english = (await browser({ language: 'en' }).languages()).context.G;
  assert.ok(chinese.DEX.length > 900);
  assert.equal(chinese.DEX.length, english.DEX.length);
  const missing = chinese.DEX.filter(mon => !/\p{Script=Han}/u.test(mon.name));
  assert.deepEqual(plain(missing.map(mon => `${mon.dex}: ${mon.name}`)), []);
  for (const mon of chinese.DEX) {
    assert.equal(chinese.DEX_BY[mon.dex], mon);
    const { name: _zh, ...stats } = plain(mon);
    const { name: _en, ...original } = plain(english.DEX_BY[mon.dex]);
    assert.deepEqual(stats, original, `Translation changed gameplay data for #${mon.dex}`);
  }
  assert.equal(chinese.DEX_BY[1].name, '妙蛙种子');
  assert.equal(chinese.DEX_BY[25].name, '皮卡丘');
  assert.equal(chinese.DEX_BY[133].name, '伊布');
});

test('local quick-start creates a persistent save and restores progress in a fresh page', async () => {
  const first = browser();
  const db = await first.database();
  assert.equal(await db.ready(), false);
  assert.equal(db.mode, 'local');
  assert.equal(db.online, false);
  assert.equal(db.playLocal().ok, true);
  assert.equal(db.guest, false);
  assert.equal(db.loggedIn, true);
  assert.equal(db.save.coins, db.START_COINS);
  db.grant(25, 'starter');
  db.save.partner = 25;
  db.save.coins += 123;
  db.save.tickets.t1 = 7;
  db.save.stats.bestTime = 87;
  assert.equal(db.commit(), true);

  const refreshed = browser({ storage: first.storage });
  const reopened = await refreshed.database();
  assert.equal(await reopened.ready(), true);
  assert.equal(reopened.save.partner, 25);
  assert.equal(reopened.owns(25), true);
  assert.equal(reopened.save.coins, db.START_COINS + 123);
  assert.equal(reopened.save.tickets.t1, 7);
  assert.equal(reopened.save.stats.bestTime, 87);
  assert.equal(reopened.playLocal().isNew, false);
  assert.equal(reopened.save.coins, db.START_COINS + 123);
});

test('quick-start and independently named local accounts never overwrite one another', async () => {
  const page = browser();
  const db = await page.database();
  await db.ready();
  assert.equal((await db.register('TrainerA', 'password-a')).ok, true);
  db.save.coins = 111;
  db.grant(1, 'starter');
  db.save.partner = 1;
  db.commit();
  await db.logout();

  assert.equal(db.playLocal().ok, true);
  db.save.coins = 222;
  db.grant(25, 'starter');
  db.save.partner = 25;
  db.commit();
  await db.logout();

  assert.equal((await db.register('TrainerB', 'password-b')).ok, true);
  db.save.coins = 333;
  db.grant(7, 'starter');
  db.save.partner = 7;
  db.commit();
  await db.logout();

  assert.equal((await db.login('trainera', 'wrong-password')).ok, false);
  assert.equal(db.loggedIn, false);
  assert.equal((await db.login('trainera', 'password-a')).ok, true);
  assert.equal(db.save.coins, 111);
  assert.equal(db.save.partner, 1);
  assert.equal(db.owns(25), false);
  assert.equal(db.owns(7), false);
  await db.logout();

  assert.equal(db.playLocal().ok, true);
  assert.equal(db.save.coins, 222);
  assert.equal(db.save.partner, 25);
  assert.equal(db.owns(1), false);
  await db.logout();

  assert.equal((await db.login('TrainerB', 'password-b')).ok, true);
  assert.equal(db.save.coins, 333);
  assert.equal(db.save.partner, 7);
  assert.equal(db.owns(25), false);
});

test('guest play remains temporary and cannot replace the quick-start save', async () => {
  const page = browser();
  const db = await page.database();
  await db.ready();
  db.playLocal();
  db.save.coins = 777;
  db.save.partner = 25;
  db.grant(25, 'starter');
  db.commit();
  await db.logout();
  db.playAsGuest();
  assert.equal(db.guest, true);
  db.save.coins = 9999;
  db.grant(150, 'gacha');
  assert.equal(db.commit(), false);
  db.playLocal();
  assert.equal(db.save.coins, 777);
  assert.equal(db.save.partner, 25);
  assert.equal(db.owns(150), false);
});
