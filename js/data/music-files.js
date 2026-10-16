/* Pokémon Ruby/Sapphire/Emerald OST, pre-looped OGG recordings from ENLS.
 * The sample positions are Vorbis LOOPSTART / LOOPLENGTH metadata at 44100 Hz.
 * See assets/music/README.txt for original rights and source attribution.
 */
G.MUSIC_FILES = (() => {
  const track = (file, title, start, length) => ({
    src: 'assets/music/' + file + '.ogg',
    title,
    loopStart: start / 44100,
    loopEnd: (start + length) / 44100
  });
  return {
    village: track('littleroot-town', '末白镇', 433371, 2359088),
    forest: track('route-101', '101 号道路', 1154487, 1489913),
    cave: track('cave-of-origin', '起源洞窟 / 流星瀑布', 541103, 1910807),
    volcano: track('mt-chimney', '烟囱山', 1630643, 3980907),
    boss: track('gym-leader', '战斗！道馆馆主', 2190663, 2816160),
    rift: track('super-ancient', '战斗！超古代宝可梦', 1792215, 1733190),
    judgment: track('frontier-brain', '战斗！开拓头脑', 2322994, 3966955)
  };
})();
