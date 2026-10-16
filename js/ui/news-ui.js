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
    if (G.I18n.lang === 'zh-CN') {
      $('news-body').innerHTML = `<div class="news-day" translate="no">
        <h3>中文版 · 本地冒险<small>基于 JPTER78 的 PokéSurvivor 开源版本</small></h3>
        <div class="news-part"><span class="news-tag new">中文支持</span><ul>
          <li>菜单、性格测试、招式、道具、任务、成就与战斗提示支持简体中文。</li>
          <li>全部 966 只可用宝可梦采用中文名称，保留原版像素动画、地图和战斗系统。</li>
          <li>打开游戏自动继续本地存档，首次游玩直接开始性格测试。</li>
          <li>背景音乐采用宝可梦绿宝石曲目；森林、洞窟、火山各有四首独立曲目，每分钟轮换，首领、裂隙和审判保留专属音乐。</li>
        </ul></div>
        <div class="news-part"><span class="news-tag chg">本地游玩</span><ul>
          <li>存档属于当前浏览器与访问地址；请固定使用同一地址。清除浏览器数据会清除存档。</li>
          <li>保存伙伴、收藏、强化、货币与结算成绩；未结束的战斗不会原地续玩。</li>
          <li>已移除登录、注册、好友与全球排行入口，可在“设置 → 存档”中查看保存状态。</li>
        </ul></div>
        <p><a href="guide-zh.html" target="_blank">查看中文玩法指南</a> · <a href="https://github.com/JPTER78/pokesurvivor" target="_blank" rel="noopener">原版源码与更新记录</a></p>
      </div>`;
      $('news-body').scrollTop = 0;
      $('scr-news').classList.remove('hidden');
      try { localStorage.setItem(KEY, latest()); } catch (e) {}
      refresh(); return;
    }
    const en = G.I18n.lang === 'en' ? 1 : 0;
    // Cada texto ya va en su idioma: translate="no" para que no lo toque i18n.
    const PARTS = [['new', ['Nuevo', 'New']], ['chg', ['Cambios', 'Changes']], ['fix', ['Arreglos', 'Fixes']]];
    $('news-body').innerHTML = G.CHANGELOG.map(v =>
      `<div class="news-day" translate="no"><h3>${esc(v.title ? v.title[en] : '')}<small>${fmt(v.d)}</small></h3>` +
      PARTS.filter(([k]) => v[k] && v[k].length).map(([k, lbl]) =>
        `<div class="news-part"><span class="news-tag ${k}">${lbl[en]}</span><ul>${v[k].map(t => `<li>${esc(t[en])}</li>`).join('')}</ul></div>`).join('') +
      '</div>').join('');
    $('news-body').scrollTop = 0;
    $('scr-news').classList.remove('hidden');
    try { localStorage.setItem(KEY, latest()); } catch (e) { /* nada */ }
    refresh();
  }
  function close() { $('scr-news').classList.add('hidden'); }

  return { init, open, close };
})();
