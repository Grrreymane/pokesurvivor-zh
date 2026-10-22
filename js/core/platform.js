/* 1GP owns identity, revision conflicts and account-partitioned storage.
 * This game checkpoints persistent adventure progress, never a partial battle.
 */
G.Platform = (() => {
  const origin = 'https://www.ai-made.games';
  const gameId = '2769de6b-d070-44bd-9a13-567d5c453926';
  const embedded = window.parent !== window;
  let ready = false, started = false, legacy = null, pending = null;
  let status = { status: 'local', ready: false };
  function loadSDK() {
    if (window.AIMadeGames?.saves) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const timer = setTimeout(() => reject(new Error('SDK_TIMEOUT')), 15000);
      script.src = origin + '/sdk/cloud-saves-v1.js';
      script.onload = () => { clearTimeout(timer); window.AIMadeGames?.saves ? resolve() : reject(new Error('SDK_MISSING')); };
      script.onerror = () => { clearTimeout(timer); reject(new Error('SDK_LOAD_FAILED')); };
      document.head.appendChild(script);
    });
  }
  async function init() {
    if (!embedded) return;
    legacy = G.DB.save?.partner ? G.DB.exportPlatform() : null;
    G.DB.beginPlatform();
    await loadSDK();
    const sdk = window.AIMadeGames.saves;
    sdk.onStatus(value => { status = value; if (value.status === 'signed-out') G.PlatformBoard?.lock(); });
    await sdk.initialize({
      platformOrigin: origin, gameId, schemaVersion: 1, gameVersion: '1.1.0',
      exportState: () => G.DB.exportPlatform(),
      importState: data => {
        // The SDK calls this only at startup or after an explicit player choice.
        G.DB.importPlatform(data);
        if (started) { G.PlatformBoard?.cancel(); G.SettingsUI.close(); G.Flow.continueLocal(); }
      },
      summary: data => G.t('platform.summary', { 0: Object.keys(data.progress.owned).length, 1: G.U.mmss(data.progress.stats.bestTime) })
    });
    ready = true;
  }
  function checkpoint() {
    if (!ready || pending) return;
    pending = setTimeout(() => {
      pending = null;
      window.AIMadeGames.saves.save().catch(() => {}); // Status is displayed by platform UI.
    }, 150);
  }
  async function importLegacy() {
    if (!ready || !legacy || !['local', 'synced'].includes(status.status)) return false;
    if (!window.confirm(G.t('platform.importConfirm'))) return false;
    G.DB.importPlatform(legacy);
    await window.AIMadeGames.saves.save();
    G.Flow.continueLocal();
    return true;
  }
  return { init, checkpoint, importLegacy, origin, gameId,
    start() { started = true; },
    get active() { return embedded; },
    get status() { return status; },
    get canImport() { return ready && !!legacy && ['local', 'synced'].includes(status.status); }
  };
})();
