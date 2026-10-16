/* Pokémon Ruby/Sapphire/Emerald OST, pre-looped OGG recordings from ENLS.
 * The sample positions are Vorbis LOOPSTART / LOOPLENGTH metadata at 44100 Hz.
 * See assets/music/README.txt for original rights and source attribution.
 */
G.MUSIC_FILES = (() => {
  const track = (file, title, start, length, fallback) => ({
    fallback,
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
    'route-104': track('route-104', '104 号道路', 1579673, 1666104, 'forest'),
    'petalburg-woods': track('petalburg-woods', '橙华森林', 880285, 1714761, 'forest'),
    'route-119': track('route-119', '119 号道路', 2202320, 2497684, 'forest'),
    'sealed-chamber': track('sealed-chamber', '布告石室', 851578, 1592395, 'cave'),
    'abandoned-ship': track('abandoned-ship', '弃船', 850042, 1698522, 'cave'),
    'victory-road': track('victory-road', '冠军之路', 715768, 1980126, 'cave'),
    'route-113': track('route-113', '113 号道路', 906242, 2488104, 'volcano'),
    'magma-hideout': track('magma-hideout', '熔岩队 / 海洋队基地', 903476, 1799546, 'volcano'),
    'route-111': track('route-111', '111 号道路', 1882506, 1769316, 'volcano'),
    boss: track('gym-leader', '战斗！道馆馆主', 2190663, 2816160),
    rift: track('super-ancient', '战斗！超古代宝可梦', 1792215, 1733190),
    judgment: track('frontier-brain', '战斗！开拓头脑', 2322994, 3966955)
  };
})();

// Four distinct tracks per map; gameplay time stops while the run is paused.
G.BIOME_PLAYLISTS = [
  ['forest', 'route-104', 'petalburg-woods', 'route-119'],
  ['cave', 'sealed-chamber', 'abandoned-ship', 'victory-road'],
  ['volcano', 'route-113', 'magma-hideout', 'route-111']
];
G.biomeMusicAt = (biome, time) => {
  const playlist = G.BIOME_PLAYLISTS[biome % G.BIOME_PLAYLISTS.length];
  return playlist[Math.floor(time / 60) % playlist.length];
};
