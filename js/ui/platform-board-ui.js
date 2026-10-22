G.PlatformBoardUI = (() => {
  let generation = 0;
  const $ = id => document.getElementById(id);
  const format = score => G.U.mmss(Math.floor(score / 1000)) + '.' + String(score % 1000).padStart(3, '0');
  async function refresh() {
    const token = ++generation, list = $('platform-board-list');
    list.replaceChildren(); $('platform-board-me').textContent = '';
    $('platform-board-status').textContent = G.t(G.PlatformBoard.available ? 'platform.loading' : 'platform.boardStandalone');
    if (!G.PlatformBoard.available) return;
    try {
      const data = await G.PlatformBoard.standings();
      if (token !== generation) return;
      $('platform-board-status').textContent = data.entries.length ? '' : G.t('platform.empty');
      for (const entry of data.entries) {
        const row = document.createElement('li'); row.setAttribute('translate', 'no');
        row.textContent = `${entry.rank}. ${entry.player.displayName} — ${format(entry.score)}`;
        list.appendChild(row);
      }
      $('platform-board-me').textContent = data.me ? G.t('platform.best', { 0: format(data.me.score) }) : G.t('platform.empty');
    } catch (_) { if (token === generation) $('platform-board-status').textContent = G.t('platform.boardError'); }
  }
  function init() {
    $('platform-board-close').onclick = () => { generation++; G.Flow.goMenu(); };
    $('platform-board-refresh').onclick = refresh;
  }
  function open() { G.UI.show('scr-platform-board'); void refresh(); }
  return { init, open };
})();
