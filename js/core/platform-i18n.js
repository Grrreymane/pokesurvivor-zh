/* 1GP language loader. The bundled Chinese catalog remains usable offline.
 * Legacy dynamic phrases are resolved to stable keys at the rendering boundary.
 * New UI must call G.t(key, parameters); save data uses IDs, never rendered text.
 */
G.Text = (() => {
  const original = G.TextOriginal;
  let translate = (key, vars) => format(original[key] ?? key, vars);
  const format = (text, vars) => vars ? String(text).replace(/\{(\w+)\}/g, (all, k) => Object.hasOwn(vars, k) ? String(vars[k]) : all) : String(text);
  function t(key, vars) {
    const species = /^pokemon\.(\d+)$/.exec(key);
    if (species) {
      const index = Number(species[1]) - 1;
      return translate('pokemon.group.' + Math.floor(index / 10)).split(' | ')[index % 10];
    }
    return translate(key, vars);
  }
  function sdk() {
    if (window.AIMadeGames?.i18n) return Promise.resolve(window.AIMadeGames);
    return new Promise(resolve => {
      const script = document.createElement('script');
      script.src = 'https://www.ai-made.games/sdk/v1.js';
      script.onload = () => resolve(window.AIMadeGames);
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
      setTimeout(() => resolve(window.AIMadeGames || null), 4500);
    });
  }
  async function init() {
    const api = await sdk();
    const lang = G.I18n.lang === 'zh-CN' ? 'zh' : G.I18n.lang;
    if (api?.i18n) {
      try {
        translate = await api.i18n({ game: 'game-a5098b633e484a4f', original, originalLang: 'zh', lang, timeout: 4000 });
      } catch (_) { /* Keep the bundled original catalog available offline. */ }
    }
    const dict = {};
    for (const key of Object.keys(original)) dict[key] = t(key);
    for (const [source, key] of Object.entries(G.TextAliases)) {
      dict[source] = t(key).replace(/\{\d+\}/g, '{x}');
    }
    // Names and gameplay IDs are separate; a language change never changes dex IDs.
    for (const mon of G.DEX) {
      const key = 'pokemon.' + mon.dex;
      if (mon.dex >= 1 && mon.dex <= 1025) mon.name = t(key);
    }
    G.I18n.add(dict);
    document.title = t('meta.title');
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    const font = { zh: 'NotoSC', ja: 'NotoJP', ko: 'NotoKR' }[lang];
    if (font && document.fonts?.load) await document.fonts.load('16px ' + font).catch(() => {});
  }
  return { t, init, original };
})();
G.t = G.Text.t;
