'use strict';

// Deterministic Web Audio tests; no network, browser, sound device, or timers needed.
// Run with `node --test tests/audio.test.js`.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../js/core/audio.js'), 'utf8');
const flush = () => new Promise(resolve => setImmediate(resolve));
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function browser({ protocol = 'http:', tracks, settings } = {}) {
  const fetches = [], decodes = [], nodes = [], media = [], warnings = [];
  const intervals = new Map(), timeouts = new Map(), listeners = new Map();
  const storage = new Map(settings ? [['ps.audio', JSON.stringify(settings)]] : []);
  let audioContext, timerId = 0, now = 1000;

  class Param {
    constructor(value = 0) { this.value = value; this.calls = []; }
    setValueAtTime(value, time) { this.value = value; this.calls.push(['set', value, time]); }
    setTargetAtTime(value, time, constant) { this.value = value; this.calls.push(['target', value, time, constant]); }
    linearRampToValueAtTime(value, time) { this.value = value; this.calls.push(['linear', value, time]); }
    exponentialRampToValueAtTime(value, time) { this.value = value; this.calls.push(['exponential', value, time]); }
    cancelScheduledValues(time) { this.calls.push(['cancel', time]); }
  }
  class AudioNode {
    constructor(kind) {
      this.kind = kind;
      this.connections = [];
      this.starts = [];
      this.stops = [];
      this.gain = new Param(1);
      this.frequency = new Param();
      this.Q = new Param();
      this.threshold = new Param();
      this.ratio = new Param();
      nodes.push(this);
    }
    connect(destination) { this.connections.push(destination); return destination; }
    disconnect() { this.disconnected = true; }
    start(...args) { this.starts.push(args); }
    stop(...args) { this.stops.push(args); }
  }
  class AudioContext {
    constructor() {
      audioContext = this;
      this.currentTime = 10;
      this.sampleRate = 100;
      this.state = 'running';
      this.destination = new AudioNode('destination');
    }
    resume() { this.state = 'running'; return Promise.resolve(); }
    createGain() { return new AudioNode('gain'); }
    createDynamicsCompressor() { return new AudioNode('compressor'); }
    createConvolver() { return new AudioNode('convolver'); }
    createBufferSource() { return new AudioNode('bufferSource'); }
    createBiquadFilter() { return new AudioNode('filter'); }
    createOscillator() { return new AudioNode('oscillator'); }
    createBuffer(channels, length, sampleRate) {
      const data = Array.from({ length: channels }, () => new Float32Array(length));
      return { duration: length / sampleRate, getChannelData: channel => data[channel] };
    }
    decodeAudioData(bytes) {
      const request = { ...deferred(), src: bytes.src };
      decodes.push(request);
      return request.promise;
    }
  }
  class MediaAudio {
    constructor(src) { this.src = src; this.paused = true; this.events = new Map(); media.push(this); }
    addEventListener(name, handler) { this.events.set(name, handler); }
    play() { this.paused = false; this.plays = (this.plays || 0) + 1; return Promise.resolve(); }
    pause() { this.paused = true; }
    removeAttribute(name) { delete this[name]; }
  }

  const fallbackSong = { bpm: 120, chords: ['C'], melody: [{ inst: 'bell', bars: ['C4:16'] }] };
  const context = vm.createContext({
    G: {
      U: { clamp: (value, min, max) => Math.max(min, Math.min(max, value)) },
      MUSIC_FILES: tracks || {
        village: { src: 'village.ogg', title: '未白镇', loopStart: 3.25, loopEnd: 45.5 },
        battle: { src: 'battle.ogg', title: '战斗', loopStart: 1, loopEnd: 32 }
      },
      MUSIC: { village: fallbackSong, battle: fallbackSong }
    },
    AudioContext, Audio: MediaAudio, location: { protocol },
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    performance: { now: () => now },
    console: { warn: (...args) => warnings.push(args) },
    addEventListener: (name, callback) => listeners.set(name, callback),
    setTimeout: (callback, ms) => { const id = ++timerId; timeouts.set(id, { callback, ms }); return id; },
    clearTimeout: id => timeouts.delete(id),
    setInterval: (callback, ms) => { const id = ++timerId; intervals.set(id, { callback, ms }); return id; },
    clearInterval: id => intervals.delete(id),
    fetch: src => {
      const request = { ...deferred(), src };
      fetches.push(request);
      return request.promise;
    }
  });
  context.window = context;
  vm.runInContext(source, context, { filename: 'js/core/audio.js' });

  const harness = {
    audio: context.G.Audio, fetches, decodes, nodes, media, warnings, storage,
    get ctx() { return audioContext; },
    get recordings() { return nodes.filter(node => node.kind === 'bufferSource' && node.loop); },
    get oscillators() { return nodes.filter(node => node.kind === 'oscillator'); },
    get musicBus() { return nodes.filter(node => node.kind === 'gain' && node.connections[0]?.kind === 'compressor')[0]; },
    get sfxBus() { return nodes.filter(node => node.kind === 'gain' && node.connections[0]?.kind === 'compressor')[1]; },
    async fetched(request, status = 200) {
      request.resolve({ ok: status === 200, status, arrayBuffer: async () => ({ src: request.src }) });
      await flush();
      return decodes.find(item => item.src === request.src);
    },
    async loaded(request, duration = 60) {
      const decode = await this.fetched(request);
      decode.resolve({ duration, src: request.src, sampleRate: 48000 });
      await flush();
    },
    tick(ms = 0) {
      now += ms;
      for (const { callback } of [...intervals.values()]) callback();
    },
    gesture() { listeners.get('pointerup')(); }
  };
  return harness;
}

test('music waits for a user gesture, then starts once with the recording title', async () => {
  const b = browser();
  b.audio.music('village');
  assert.equal(b.fetches.length, 0);
  assert.equal(b.audio.running, false);
  b.gesture();
  b.gesture();
  assert.equal(b.fetches.length, 1);
  await b.loaded(b.fetches[0]);
  assert.equal(b.audio.track, 'village');
  assert.equal(b.audio.trackTitle, '未白镇');
  assert.equal(b.audio.musicSource, 'emerald');
  assert.equal(b.recordings.length, 1);
  assert.equal(b.recordings[0].starts.length, 1);
});

test('an older fetch finishing last cannot replace the newest scene', async () => {
  const b = browser();
  b.audio.unlock();
  b.audio.music('village');
  b.audio.music('battle');
  await b.loaded(b.fetches[1]);
  await b.loaded(b.fetches[0]);
  assert.equal(b.audio.track, 'battle');
  assert.deepEqual(b.recordings.map(node => node.buffer.src), ['battle.ogg']);
});

test('an older decode finishing last cannot play a stale recording', async () => {
  const b = browser();
  b.audio.unlock();
  b.audio.music('village');
  const oldDecode = await b.fetched(b.fetches[0]);
  b.audio.music('battle');
  await b.loaded(b.fetches[1]);
  oldDecode.resolve({ duration: 60, src: 'village.ogg' });
  await flush();
  assert.deepEqual(b.recordings.map(node => node.buffer.src), ['battle.ogg']);
});

test('music(null) cancels pending fetch and decode playback even after another gesture', async () => {
  for (const stage of ['fetch', 'decode']) {
    const b = browser();
    b.audio.unlock();
    b.audio.music('village');
    const decode = stage === 'decode' ? await b.fetched(b.fetches[0]) : null;
    b.audio.music(null);
    b.gesture();
    if (decode) { decode.resolve({ duration: 60 }); await flush(); }
    else await b.loaded(b.fetches[0]);
    assert.equal(b.audio.track, null, stage);
    assert.equal(b.recordings.length, 0, stage);
    assert.equal(b.fetches.length, 1, stage);
  }
});

test('switching or stopping a playing track schedules its stop and fades its bus', async () => {
  const b = browser();
  b.audio.unlock();
  b.audio.music('village');
  await b.loaded(b.fetches[0]);
  const original = b.recordings[0];
  b.audio.music('battle');
  assert.deepEqual(original.stops, [[10.72]]);
  assert.deepEqual(original.connections[0].gain.calls.at(-1), ['linear', 0.0001, 10.7]);
  await b.loaded(b.fetches[1]);
  b.audio.music(null);
  assert.equal(b.audio.track, null);
  assert.equal(b.recordings[1].stops.length, 1);
});

test('repeating the current scene neither reloads nor restarts its recording', async () => {
  const b = browser();
  b.audio.unlock();
  b.audio.music('village');
  b.audio.music('village');
  b.audio.unlock();
  await b.loaded(b.fetches[0]);
  b.audio.music('village');
  b.audio.unlock();
  assert.equal(b.fetches.length, 1);
  assert.equal(b.decodes.length, 1);
  assert.equal(b.recordings.length, 1);
  assert.equal(b.recordings[0].stops.length, 0);
});

test('returning to a recently played scene reuses its decoded recording', async () => {
  const b = browser();
  b.audio.unlock();
  b.audio.music('village');
  await b.loaded(b.fetches[0]);
  b.audio.music('battle');
  await b.loaded(b.fetches[1]);
  b.audio.music('village');
  await flush();
  assert.equal(b.fetches.length, 2);
  assert.equal(b.decodes.length, 2);
  assert.equal(b.recordings.length, 3);
  assert.equal(b.recordings[0].buffer, b.recordings[2].buffer);
});

test('loop markers remain in seconds when decoding changes the sample rate', async () => {
  const b = browser();
  b.audio.unlock();
  b.audio.music('village');
  await b.loaded(b.fetches[0]);
  const recording = b.recordings[0];
  assert.equal(recording.loop, true);
  assert.equal(recording.loopStart, 3.25);
  assert.equal(recording.loopEnd, 45.5);
  assert.deepEqual(recording.starts, [[]], 'the first play includes the intro from zero');
});

test('missing or out-of-range loop markers safely use the decoded duration', async () => {
  const cases = [
    [{}, 0, 60],
    [{ loopStart: -2, loopEnd: 80 }, 0, 60],
    [{ loopStart: 70, loopEnd: 25 }, 0, 25],
    [{ loopStart: 20, loopEnd: 10 }, 20, 60],
    [{ loopStart: 3, loopEnd: 60.01 }, 3, 60]
  ];
  for (const [markers, start, end] of cases) {
    const b = browser({ tracks: { village: { src: 'village.ogg', ...markers } } });
    b.audio.unlock();
    b.audio.music('village');
    await b.loaded(b.fetches[0]);
    assert.equal(b.recordings[0].loopStart, start);
    assert.equal(b.recordings[0].loopEnd, end);
  }
});

test('music and sound effect volumes are independent, clamp, persist, and restore after mute', async () => {
  const b = browser();
  b.audio.unlock();
  b.audio.music('village');
  await b.loaded(b.fetches[0]);
  b.audio.setVolume('music', 0.2);
  b.audio.setVolume('sfx', 0.8);
  assert.equal(b.musicBus.gain.value, 0.2 * 0.7);
  assert.equal(b.sfxBus.gain.value, 0.8 * 2.4);
  assert.equal(b.recordings[0].connections[0].connections[0], b.musicBus);
  b.audio.sfx('click');
  assert.equal(b.oscillators[0].connections[0].connections[0], b.sfxBus);
  assert.equal(b.audio.toggleMute(), true);
  assert.equal(b.musicBus.gain.value, 0);
  assert.equal(b.sfxBus.gain.value, 0);
  const voices = b.oscillators.length;
  b.audio.sfx('click');
  assert.equal(b.oscillators.length, voices, 'mute suppresses new sound effects');
  assert.equal(b.audio.toggleMute(), false);
  assert.equal(b.musicBus.gain.value, 0.2 * 0.7);
  assert.equal(b.sfxBus.gain.value, 0.8 * 2.4);
  b.audio.setVolume('music', -1);
  b.audio.setVolume('sfx', 2);
  assert.deepEqual(JSON.parse(b.storage.get('ps.audio')), { music: 0, sfx: 1, muted: false });
});

test('saved mute settings apply before the recording starts', async () => {
  const b = browser({ settings: { music: 0.3, sfx: 0.4, muted: true } });
  b.audio.music('village');
  b.gesture();
  await b.loaded(b.fetches[0]);
  assert.equal(b.musicBus.gain.value, 0);
  assert.equal(b.sfxBus.gain.value, 0);
  b.audio.toggleMute();
  assert.equal(b.musicBus.gain.value, 0.3 * 0.7);
  assert.equal(b.sfxBus.gain.value, 0.4 * 2.4);
});

test('HTTP or decode failures fall back to the original synthesizer and allow a later retry', async () => {
  for (const failure of ['http', 'decode']) {
    const b = browser();
    b.audio.unlock();
    b.audio.music('village');
    const decode = await b.fetched(b.fetches[0], failure === 'http' ? 404 : 200);
    if (decode) { decode.reject(new Error('Unsupported recording')); await flush(); }
    assert.equal(b.audio.track, 'village', failure);
    assert.equal(b.audio.musicSource, 'original', failure);
    assert.equal(b.warnings.length, 1, failure);
    b.tick();
    assert.ok(b.oscillators.length > 0, 'the fallback schedules audible notes');
    b.audio.music(null);
    b.audio.music('village');
    assert.equal(b.fetches.length, 2, 'a failed cache entry must be evicted');
  }
});

test('a rejected old request cannot stop or replace a newer recording', async () => {
  const b = browser();
  b.audio.unlock();
  b.audio.music('village');
  b.audio.music('battle');
  await b.loaded(b.fetches[1]);
  b.fetches[0].reject(new Error('Old request failed'));
  await flush();
  assert.equal(b.audio.track, 'battle');
  assert.equal(b.audio.musicSource, 'emerald');
  assert.equal(b.recordings[0].stops.length, 0);
  assert.equal(b.warnings.length, 0);
});

test('direct file opening uses media playback with independent music volume and mute', async () => {
  const b = browser({ protocol: 'file:' });
  b.audio.unlock();
  b.audio.music('village');
  await flush();
  assert.equal(b.fetches.length, 0);
  assert.equal(b.media.length, 1);
  assert.equal(b.media[0].src, 'village.ogg');
  assert.equal(b.media[0].loop, true);
  b.audio.setVolume('music', 0.2);
  assert.equal(b.media[0].volume, 0.2 * 0.63);
  b.audio.setVolume('sfx', 0);
  assert.equal(b.media[0].volume, 0.2 * 0.63);
  b.audio.toggleMute();
  assert.equal(b.media[0].volume, 0);
  b.audio.toggleMute();
  assert.equal(b.media[0].volume, 0.2 * 0.63);
  b.audio.music(null);
  b.tick(700);
  assert.equal(b.media[0].paused, true);
  assert.equal(b.media[0].src, undefined);
});

test('direct file media errors also fall back to the original synthesizer', () => {
  const b = browser({ protocol: 'file:' });
  b.audio.unlock();
  b.audio.music('village');
  b.media[0].events.get('error')();
  assert.equal(b.audio.track, 'village');
  assert.equal(b.audio.musicSource, 'original');
  b.tick();
  assert.ok(b.oscillators.length > 0);
});
