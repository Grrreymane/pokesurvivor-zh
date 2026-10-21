/* ============ news-ui.js — "Novedades" ============
 * Botón en la barra de arriba que abre la lista de cambios del juego
 * (js/data/changelog.js). Lleva un punto mientras haya algo que no has visto.
 */
G.NewsUI = (() => {
  const $ = G.UI.$;
  const KEY = 'ps.news.seen';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const latest = () => (G.CHANGELOG[0] || {}).d || '';
  function seen() { try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; } }

  function init() {
    const b = $('btn-news');
    b.innerHTML = G.Icons.html('book', 18) + ' <span>Novedades</span><i class="dot"></i>';
    b.onclick = open;
    $('news-close').onclick = close;
    refresh();
  }
  function refresh() { $('btn-news').classList.toggle('new', seen() < latest()); }

  function fmt(d) {
    const [y, m, day] = d.split('-').map(Number);
    return new Date(y, m - 1, day).toLocaleDateString(G.I18n.lang === 'en' ? 'en-GB' : 'es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function open() {
    const tr = key => esc(G.t(key));
    $('news-body').innerHTML = `<div class="news-day" translate="no">
      <h3>${tr('local.newsTitle')}<small>${tr('local.basedOn')}</small></h3>
      <div class="news-part"><span class="news-tag new">${tr('local.languages')}</span><ul>
        <li>${tr('local.languageInfo')}</li><li>${tr('local.musicRotation')}</li>
      </ul></div>
      <div class="news-part"><span class="news-tag chg">${tr('local.play')}</span><ul>
        <li>${tr('local.sameBrowser')}</li><li>${tr('local.saveInfo')}</li>
      </ul></div>
      <p><a href="guide-zh.html" target="_blank">${tr('local.newsGuide')}</a> · <a href="https://github.com/JPTER78/pokesurvivor" target="_blank" rel="noopener">${tr('local.originalSource')}</a></p>
    </div>`;
    $('news-body').scrollTop = 0;
    $('scr-news').classList.remove('hidden');
    try { localStorage.setItem(KEY, latest()); } catch (e) {}
    refresh();
  }
  function close() { $('scr-news').classList.add('hidden'); }

  return { init, open, close };
})();
