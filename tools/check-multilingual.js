// Isolated browser verification. No upload, no player profile, no game save reuse.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/nff03/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'tools/cache/i18n/screenshots');
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const report = [];
  try {
    for (const lang of ['zh', 'en', 'ja', 'ko', 'es']) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, locale: 'en-US' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      // Real official SDK, with its unpublished translation response served from the review files.
      if (!process.env.LIVE_I18N) await page.route('https://www.ai-made.games/sdk/v1.js', route => route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(path.join(root, 'tools/cache/i18n/sdk.js'), 'utf8') }));
      if (!process.env.LIVE_I18N) await page.route('**/i18n/game-a5098b633e484a4f/*.json', route => route.fulfill({ contentType: 'application/json', body: fs.readFileSync(path.join(root, 'translations', lang + '.json'), 'utf8') }));
      await page.addInitScript(() => { localStorage.setItem('ps.lang', 'es'); });
      await page.goto((process.env.GAME_URL || 'http://127.0.0.1:4173/dev.html') + '?lang=' + lang);
      await page.waitForSelector('#scr-test:not(.hidden)');
      const expected = JSON.parse(fs.readFileSync(path.join(root, lang === 'zh' ? 'locales/zh.json' : 'translations/' + lang + '.json'), 'utf8'));
      assert.equal(await page.title(), expected['meta.title'], lang + ': translated title');
      assert.equal(await page.evaluate(() => G.t('pokemon.813')), expected['pokemon.group.81'].split(' | ')[2], lang + ': species names');
      assert.equal(await page.evaluate(() => G.I18n.lang), lang === 'zh' ? 'zh-CN' : lang);
      await page.waitForTimeout(200);
      await page.screenshot({ path: path.join(out, lang + '-quiz.png') });
      for (let i = 0; i < 8; i++) await page.locator('#test-a button').first().click();
      await page.waitForSelector('#scr-result:not(.hidden)');
      await page.waitForTimeout(200);
      const resultText = await page.locator('#scr-result').innerText();
      await page.locator('#res-ok').click();
      await page.waitForSelector('#scr-menu:not(.hidden)');
      await page.waitForTimeout(4000);
      await page.screenshot({ path: path.join(out, lang + '-menu.png') });
      const menuText = await page.locator('#scr-menu').innerText();
      await page.evaluate(() => G.SettingsUI.open('gfx'));
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(out, lang + '-settings.png') });
      const overflow = await page.locator('#scr-settings button').evaluateAll(els => els.filter(e => e.clientWidth && e.scrollWidth > e.clientWidth + 2).map(e => e.textContent));
      assert.deepEqual(overflow, [], lang + ': button overflow');
      await page.evaluate(() => { G.SettingsUI.close(); G.Flow.play(); });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(out, lang + '-battle.png') });
      const save = await page.evaluate(() => JSON.parse(JSON.stringify(G.DB.save)));
      assert.equal(typeof save.partner, 'number');
      assert.ok(!/\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Hangul}/u.test(save.personality.trait), 'Trait must remain a stable ID');
      assert.deepEqual(errors, [], lang + ': browser errors');
      report.push({ lang, resultText, menuText, overflow, errors, partner: save.partner, trait: save.personality.trait });
      await context.close();
    }
  } finally { await browser.close(); }
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
})().catch(e => { console.error(e); process.exitCode = 1; });
