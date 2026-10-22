/* Native 1GP leaderboard transport. Credentials stay in memory, separate from saves. */
G.PlatformBoard = (() => {
  const origin = 'https://www.ai-made.games';
  const gameId = '2769de6b-d070-44bd-9a13-567d5c453926';
  const boardId = '07e3c8c6-547f-4a10-b784-bc9ff798d82e';
  let session = null, connecting = null, current = null, locked = false;
  const jobs = new Set();
  const fail = code => Object.assign(new Error(code), { code });
  function available() { return window.parent !== window && !locked; }
  function connect() {
    if (!available()) return Promise.reject(fail('UNAVAILABLE'));
    if (session && Date.parse(session.expiresAt) > Date.now() + 60000) return Promise.resolve(session);
    if (connecting) return connecting;
    connecting = new Promise((resolve, reject) => {
      const requestId = crypto.randomUUID();
      function cleanup() { clearTimeout(timer); window.removeEventListener('message', receive); }
      function receive(event) {
        const d = event.data;
        if (event.source !== window.parent || event.origin !== origin || !d || d.source !== 'aimadegames-platform' || d.type !== 'leaderboard-session' || d.requestId !== requestId) return;
        cleanup();
        if (locked || d.error || d.apiOrigin !== origin || d.session?.gameId !== gameId || typeof d.session?.token !== 'string' || !(Date.parse(d.session.expiresAt) > Date.now())) return reject(fail('INVALID_SESSION'));
        session = d.session; resolve(session);
      }
      const timer = setTimeout(() => { cleanup(); reject(fail('SESSION_TIMEOUT')); }, 15000);
      window.addEventListener('message', receive);
      window.parent.postMessage({ source: 'aimadegames', type: 'leaderboard-session', requestId }, origin);
    }).finally(() => { connecting = null; });
    return connecting;
  }
  async function request(path, { key, body, job } = {}) {
    for (let attempt = 0; attempt < 3; attempt++) {
      if (locked || job?.cancelled) throw fail('CANCELLED');
      let delay = 1000 * 2 ** attempt;
      try {
        const s = await connect();
        if (locked || job?.cancelled) throw fail('CANCELLED');
        const response = await fetch(origin + '/api/v1/' + path, {
          method: key ? 'POST' : 'GET', credentials: 'omit', signal: AbortSignal.timeout(15000),
          headers: { Authorization: 'Bearer ' + s.token, ...(key ? { 'Idempotency-Key': key } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
          ...(body ? { body } : {})
        });
        if (locked || job?.cancelled) throw fail('CANCELLED');
        if (response.status === 401) { session = null; if (attempt < 2) continue; }
        if (response.ok) return await response.json();
        const error = fail('HTTP_' + response.status);
        error.retryable = response.status === 429 || response.status >= 500;
        const after = response.headers.get('Retry-After');
        const seconds = Number(after);
        if (after) delay = Math.max(delay, Number.isFinite(seconds) ? seconds * 1000 : Date.parse(after) - Date.now() || 0);
        throw error;
      } catch (error) {
        if (attempt === 2 || error.code && !error.retryable) throw error;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  function start(solo = true) {
    cancel();
    if (!solo || !available()) return;
    const job = { startKey: crypto.randomUUID(), scoreKey: crypto.randomUUID(), started: Date.now(), cancelled: false, body: null, submitted: false };
    current = job;
    job.opening = request('leaderboards/' + boardId + '/runs', { key: job.startKey, job })
      .then(data => { if (typeof data.runId !== 'string') throw fail('INVALID_RUN'); job.runId = data.runId; job.deadline = Date.parse(data.submitBefore); })
      .catch(() => { job.failed = true; });
  }
  async function submit(job) {
    if (job.submitted || job.busy || locked || job.cancelled) return;
    job.busy = true;
    try {
      await job.opening;
      if (!job.runId || Date.now() >= Math.min(job.started + 7200000, job.deadline || Infinity)) { jobs.delete(job); return; }
      await request('runs/' + encodeURIComponent(job.runId) + '/score', { key: job.scoreKey, body: job.body, job });
      job.submitted = true; jobs.delete(job);
    } catch (_) { /* Keep the exact completed request for a later retry in this page. */ }
    finally { job.busy = false; }
  }
  function finish(seconds, eligible = true) {
    const job = current; current = null;
    if (!job) return;
    const score = Math.floor(seconds * 1000);
    if (!eligible || !Number.isSafeInteger(score) || score < 0 || score > 86400000) { job.cancelled = true; return; }
    job.body = JSON.stringify({ score }); jobs.add(job); void submit(job);
  }
  function cancel() { if (current) current.cancelled = true; current = null; }
  function lock() { locked = true; session = null; cancel(); for (const job of jobs) job.cancelled = true; jobs.clear(); }
  function retry() { for (const job of jobs) void submit(job); }
  async function standings() {
    retry();
    const [entries, me] = await Promise.all([request('leaderboards/' + boardId + '/entries?limit=10'), request('leaderboards/' + boardId + '/me?around=2')]);
    return { entries: entries.entries || [], me: me.entry };
  }
  window.addEventListener('online', retry);
  return { start, finish, cancel, lock, standings, get available() { return available(); } };
})();
