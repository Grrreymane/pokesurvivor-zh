/* ============ achievements.js — logros, medallas y títulos ============
 * Cada logro: medalla (bronce 1, plata 2, oro 3), premio al conseguirlo y, a
 * veces, un título para el perfil. Se comprueban en systems/progress.js.
 *
 *   value(save) -> progreso actual (número) · goal -> lo que hay que llegar
 *
 * Además hay un logro por CADA legendario: vencerle en una grieta.
 */
G.AchDefs = (() => {
  const own = s => Object.keys(s.owned || {}).filter(d => G.DEX_BY[d]).length;
  const shinies = s => Object.keys(s.shiny || {}).length;
  const legends = s => Object.keys(s.legends || {}).length;
  const st = k => s => (s.stats && s.stats[k]) || 0;
  const count = k => s => Object.keys(s[k] || {}).length;

  const CATS = [['coleccion', 'Colección'], ['supervivencia', 'Supervivencia'], ['combate', 'Combate'],
                ['grietas', 'Grietas'], ['legendarios', 'Legendarios'], ['otros', 'Misiones y más']];

  const LIST = [
    // ---------- colección ----------
    { id: 'own1', cat: 'coleccion', tier: 1, get name() { return G.t("text.0675"); }, get desc() { return G.t("text.0682"); }, value: own, goal: 1, reward: { coins: 100 } },
    { id: 'own10', cat: 'coleccion', tier: 1, get name() { return G.t("text.0676"); }, get desc() { return G.t("text.0683"); }, value: own, goal: 10, reward: { t1: 2 } },
    { id: 'own50', cat: 'coleccion', tier: 2, get name() { return G.t("text.0677"); }, get desc() { return G.t("text.0684"); }, value: own, goal: 50, reward: { t1: 5 }, title: 'Coleccionista' },
    { id: 'own100', cat: 'coleccion', tier: 2, get name() { return G.t("text.0757"); }, get desc() { return G.t("text.0685"); }, value: own, goal: 100, reward: { t10: 1 } },
    { id: 'own250', cat: 'coleccion', tier: 3, get name() { return G.t("text.0680"); }, get desc() { return G.t("text.0686"); }, value: own, goal: 250, reward: { t10: 2 }, title: 'Maestro Pokémon' },
    { id: 'own500', cat: 'coleccion', tier: 3, get name() { return G.t("text.0678"); }, get desc() { return G.t("text.0687"); }, value: own, goal: 500, reward: { t10: 3 } },
    { id: 'ownAll', cat: 'coleccion', tier: 3, get name() { return G.t("text.0679"); }, get desc() { return G.t("text.0689"); }, value: own, goal: 966, reward: { t10: 10 }, title: 'Profesor Pokémon' },
    { id: 'shiny1', cat: 'coleccion', tier: 1, get name() { return G.t("text.0690"); }, get desc() { return G.t("text.0693"); }, value: shinies, goal: 1, reward: { t1: 3 }, title: 'Brillante' },
    { id: 'shiny5', cat: 'coleccion', tier: 2, get name() { return G.t("text.0691"); }, get desc() { return G.t("text.0694"); }, value: shinies, goal: 5, reward: { t10: 1 } },
    { id: 'shiny20', cat: 'coleccion', tier: 3, get name() { return G.t("text.0692"); }, get desc() { return G.t("text.0695"); }, value: shinies, goal: 20, reward: { t10: 2 }, title: 'Cazashinies' },
    { id: 'pulls100', cat: 'coleccion', tier: 2, get name() { return G.t("text.0763"); }, get desc() { return G.t("text.0764"); }, value: st('pulls'), goal: 100, reward: { t10: 1 }, title: 'Afortunado' },

    // ---------- supervivencia ----------
    { id: 'time5', cat: 'supervivencia', tier: 1, get name() { return G.t("text.0696"); }, get desc() { return G.t("text.0701"); }, value: s => Math.floor(st('bestTime')(s) / 60), goal: 5, reward: { coins: 200 } },
    { id: 'time10', cat: 'supervivencia', tier: 2, get name() { return G.t("text.0699"); }, get desc() { return G.t("text.0702"); }, value: s => Math.floor(st('bestTime')(s) / 60), goal: 10, reward: { t1: 4 } },
    { id: 'time15', cat: 'supervivencia', tier: 2, get name() { return G.t("text.0698"); }, get desc() { return G.t("text.0703"); }, value: s => Math.floor(st('bestTime')(s) / 60), goal: 15, reward: { t10: 1 } },
    { id: 'time20', cat: 'supervivencia', tier: 3, get name() { return G.t("text.0697"); }, get desc() { return G.t("text.0704"); }, value: s => Math.floor(st('bestTime')(s) / 60), goal: 20, reward: { t10: 2 }, title: 'Superviviente' },
    { id: 'lvl20', cat: 'supervivencia', tier: 1, get name() { return G.t("text.0705"); }, get desc() { return G.t("text.0709"); }, value: st('bestLevel'), goal: 15, reward: { t1: 2 } },
    { id: 'lvl40', cat: 'supervivencia', tier: 3, get name() { return G.t("text.0700"); }, get desc() { return G.t("text.0710"); }, value: st('bestLevel'), goal: 30, reward: { t10: 1 }, title: 'Imparable' },
    // La Sentencia de Arceus (minuto 30, ver systems/judgment.js).
    { id: 'judge', cat: 'supervivencia', tier: 2, get name() { return G.t("text.1150"); }, get desc() { return G.t("text.1151"); }, value: st('judged'), goal: 1, reward: { t10: 1 }, title: 'Juzgado' },
    { id: 'judge60', cat: 'supervivencia', tier: 3, get name() { return G.t("text.1152"); }, get desc() { return G.t("text.1153"); }, value: st('judgeTime'), goal: 60, reward: { t10: 2 }, title: 'Elegido de Arceus' },
    { id: 'judgeBoss', cat: 'supervivencia', tier: 3, get name() { return G.t("text.1154"); }, get desc() { return G.t("text.1155"); }, value: st('judgeBosses'), goal: 3, reward: { t10: 2 } },
    { id: 'runs50', cat: 'supervivencia', tier: 2, get name() { return G.t("text.0727"); }, get desc() { return G.t("text.0761"); }, value: st('runs'), goal: 50, reward: { t10: 1 }, title: 'Explorador' },

    // ---------- combate ----------
    { id: 'kills1k', cat: 'combate', tier: 1, get name() { return G.t("text.0711"); }, get desc() { return G.t("text.0715"); }, value: st('totalKills'), goal: 1000, reward: { t1: 2 } },
    { id: 'kills10k', cat: 'combate', tier: 2, get name() { return G.t("text.0706"); }, get desc() { return G.t("text.0716"); }, value: st('totalKills'), goal: 10000, reward: { t10: 1 }, title: 'Veterano' },
    { id: 'kills100k', cat: 'combate', tier: 3, get name() { return G.t("text.0714"); }, get desc() { return G.t("text.0717"); }, value: st('totalKills'), goal: 100000, reward: { t10: 3 }, title: 'Leyenda viva' },
    { id: 'boss1', cat: 'combate', tier: 1, get name() { return G.t("text.0722"); }, get desc() { return G.t("text.0718"); }, value: st('bossesTotal'), goal: 1, reward: { t1: 2 } },
    { id: 'boss25', cat: 'combate', tier: 2, get name() { return G.t("text.0721"); }, get desc() { return G.t("text.0719"); }, value: st('bossesTotal'), goal: 25, reward: { t10: 1 }, title: 'Cazajefes' },
    { id: 'boss100', cat: 'combate', tier: 3, get name() { return G.t("text.0723"); }, get desc() { return G.t("text.0720"); }, value: st('bossesTotal'), goal: 100, reward: { t10: 2 } },
    { id: 'evo1', cat: 'combate', tier: 1, get name() { return G.t("text.0739"); }, get desc() { return G.t("text.0742"); }, value: st('evolutions'), goal: 1, reward: { t1: 3 } },
    { id: 'evo25', cat: 'combate', tier: 2, get name() { return G.t("text.0740"); }, get desc() { return G.t("text.0743"); }, value: st('evolutions'), goal: 25, reward: { t10: 1 }, title: 'Evolucionista' },
    { id: 'evoAll', cat: 'combate', tier: 3, get name() { return G.t("text.0741"); }, get desc() { return G.t("text.0745"); }, value: count('evoMoves'), goal: 47, reward: { t10: 3 }, title: 'Maestro de movimientos' },
    { id: 'items5', cat: 'combate', tier: 1, get name() { return G.t("text.0747"); }, get desc() { return G.t("text.0748"); }, value: count('itemsFound'), goal: 5, reward: { t1: 3 } },
    { id: 'itemsAll', cat: 'combate', tier: 2, get name() { return G.t("text.0746"); }, get desc() { return G.t("text.0749"); }, value: count('itemsFound'), goal: 11, reward: { t10: 1 }, title: 'Anticuario' },

    // ---------- grietas ----------
    { id: 'rift1', cat: 'grietas', tier: 1, get name() { return G.t("text.0724"); }, get desc() { return G.t("text.0728"); }, value: st('riftWins'), goal: 1, reward: { t1: 3 }, title: 'Valiente' },
    { id: 'rift10', cat: 'grietas', tier: 2, get name() { return G.t("text.0725"); }, get desc() { return G.t("text.0729"); }, value: st('riftWins'), goal: 10, reward: { t10: 1 } },
    { id: 'arenas', cat: 'grietas', tier: 3, get name() { return G.t("text.0726"); }, get desc() { return G.t("text.0730"); }, value: count('arenas'), goal: 18, reward: { t10: 2 }, title: 'Viajero de grietas' },

    // ---------- legendarios (contador; los individuales se añaden abajo) ----------
    { id: 'leg10', cat: 'legendarios', tier: 2, get name() { return G.t("text.0731"); }, get desc() { return G.t("text.0733"); }, value: legends, goal: 10, reward: { t10: 1 }, title: 'Cazalegendarios' },
    { id: 'leg30', cat: 'legendarios', tier: 3, get name() { return G.t("text.0732"); }, get desc() { return G.t("text.0734"); }, value: legends, goal: 30, reward: { t10: 2 } },
    { id: 'legAll', cat: 'legendarios', tier: 3, get name() { return G.t("text.0713"); }, get desc() { return G.t("text.0736"); }, value: legends, goal: 87, reward: { t10: 5 }, title: 'Leyenda' },

    // ---------- misiones y más ----------
    { id: 'mis10', cat: 'otros', tier: 1, get name() { return G.t("text.0750"); }, get desc() { return G.t("text.0753"); }, value: st('missionsDone'), goal: 10, reward: { t1: 3 } },
    { id: 'mis50', cat: 'otros', tier: 2, get name() { return G.t("text.0751"); }, get desc() { return G.t("text.0754"); }, value: st('missionsDone'), goal: 50, reward: { t10: 1 }, title: 'Constante' },
    { id: 'mis200', cat: 'otros', tier: 3, get name() { return G.t("text.0752"); }, get desc() { return G.t("text.0755"); }, value: st('missionsDone'), goal: 200, reward: { t10: 3 } },
    { id: 'group1', onlineOnly: true, cat: 'otros', tier: 1, get name() { return G.t("text.0756"); }, get desc() { return G.t("text.0758"); }, value: st('groupRuns'), goal: 1, reward: { t1: 2 } },
    { id: 'group10', onlineOnly: true, cat: 'otros', tier: 2, get name() { return G.t("text.0760"); }, get desc() { return G.t("text.0759"); }, value: st('groupRuns'), goal: 10, reward: { t10: 1 }, title: 'Compañero fiel' }
  ];

  // Un logro por legendario: "Vence a Mewtwo"...
  for (const p of G.DEX.filter(p => p.leg && G.SPRITE_META[p.dex])) {
    LIST.push({ id: 'leg_' + p.dex, cat: 'legendarios', tier: 2, dex: p.dex, name: 'Vence a ' + p.name,
                desc: 'Derrota a ' + p.name + ' en una grieta.', value: s => (s.legends && s.legends[p.dex] ? 1 : 0), goal: 1, reward: { t1: 1 } });
  }
  const totalLegends = LIST.filter(a => a.dex).length;
  for (const a of LIST) if (a.id === 'legAll') { a.goal = totalLegends; a.desc = G.t("text.0735", {0: totalLegends}); }
  // Metas que dependen de los datos del juego.
  for (const a of LIST) if (a.id === 'ownAll') { a.goal = G.DEX.length; a.desc = G.t("text.0688", {0: G.DEX.length}); }
  const evoTotal = Object.keys(G.Moves.EVO).length;
  for (const a of LIST) if (a.id === 'evoAll') { a.goal = evoTotal; a.desc = G.t("text.0744", {0: evoTotal}); }

  const BY = {};
  for (const a of LIST) BY[a.id] = a;

  // 暂时不展示或检查组队成就；保留定义和已有存档，方便以后恢复。
  return { CATS, LIST: LIST.filter(a => !a.onlineOnly), BY };
})();
