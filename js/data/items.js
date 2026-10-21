/* ============ items.js — objetos equipables (uno por run) ============
 * Se encuentran en los cofres (a veces en los normales, a menudo en los de
 * candado) y los sueltan los jefes. Sólo puedes llevar UNO; si encuentras
 * otro, eliges con cuál quedarte. Duran lo que dura la run.
 *
 *   on(pl)   se lo pones (lo que hace mientras lo llevas)
 *   off(pl)  se lo quitas (deshace lo de on)
 * Los que reaccionan a algo (golpe mortal, daño hecho...) los mira el
 * jugador con pl.hasItem(id).
 */
G.Items = (() => {
  const LIST = [
    { id: 'leftovers', get name() { return G.t("text.0261"); }, get desc() { return G.t("text.0272"); },
      on: p => { p.regenFlat += p.maxHp * 0.015; p._itemRegen = p.maxHp * 0.015; },
      off: p => { p.regenFlat -= p._itemRegen || 0; } },
    { id: 'choiceband', get name() { return G.t("text.0262"); }, get desc() { return G.t("text.0273"); },
      on: p => { p.atkMul *= 1.4; }, off: p => { p.atkMul /= 1.4; } },
    { id: 'quickclaw', get name() { return G.t("text.0263"); }, get desc() { return G.t("text.0274"); },
      on: p => { p.cdMul *= 0.8; }, off: p => { p.cdMul /= 0.8; } },
    { id: 'focussash', get name() { return G.t("text.0264"); }, get desc() { return G.t("text.0275"); },
      on: () => {}, off: () => {} },
    { id: 'shellbell', get name() { return G.t("text.0265"); }, get desc() { return G.t("text.0276"); },
      on: () => {}, off: () => {} },
    { id: 'amuletcoin', get name() { return G.t("text.0266"); }, get desc() { return G.t("text.0277"); },
      on: p => { p.coinMul *= 1.5; }, off: p => { p.coinMul /= 1.5; } },
    { id: 'luckyegg', get name() { return G.t("text.0267"); }, get desc() { return G.t("text.0278"); },
      on: p => { p.xpMul *= 1.3; }, off: p => { p.xpMul /= 1.3; } },
    { id: 'lifeorb', get name() { return G.t("text.0268"); }, get desc() { return G.t("text.0279"); },
      on: p => { p.atkMul *= 1.3; }, off: p => { p.atkMul /= 1.3; } },
    { id: 'choicescarf', get name() { return G.t("text.0269"); }, get desc() { return G.t("text.0280"); },
      on: p => { p.spdMul *= 1.35; }, off: p => { p.spdMul /= 1.35; } },
    { id: 'rockyhelmet', get name() { return G.t("text.0270"); }, get desc() { return G.t("text.0281"); },
      on: () => {}, off: () => {} },
    { id: 'assaultvest', get name() { return G.t("text.0271"); }, get desc() { return G.t("text.0282"); },
      on: p => { p.dmgReduce += 0.2; }, off: p => { p.dmgReduce -= 0.2; } }
  ];
  const BY = {};
  for (const it of LIST) BY[it.id] = it;

  /** Uno al azar, distinto del que ya llevas. */
  function roll(except) {
    const pool = LIST.filter(i => i.id !== except);
    return G.U.pick(pool).id;
  }

  return { LIST, BY, roll };
})();
