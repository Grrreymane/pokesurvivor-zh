/* ============ starters.js — compañeros iniciales y test de personalidad ============
 * Como en Mundo Misterioso: unas preguntas deciden tu personalidad, y tu
 * personalidad decide tu compañero. Puedes rechazarlo y elegir otro.
 *
 * Los stats salen de G.DEX; aquí sólo van los rasgos y el movimiento inicial.
 */
G.STARTERS = [
  { dex: 1,   start: 'vine-whip',     traits: ['leal', 'paciente'] },
  { dex: 4,   start: 'ember',         traits: ['valiente', 'impulsivo'] },
  { dex: 7,   start: 'water-gun',     traits: ['prudente', 'leal'] },
  { dex: 152, start: 'vine-whip',     traits: ['dulce', 'paciente'] },
  { dex: 155, start: 'ember',         traits: ['tímido', 'impulsivo'] },
  { dex: 158, start: 'water-gun',     traits: ['travieso', 'valiente'] },
  { dex: 252, start: 'razor-leaf',    traits: ['sereno', 'astuto'] },
  { dex: 255, start: 'ember',         traits: ['alegre', 'valiente'] },
  { dex: 258, start: 'water-gun',     traits: ['tenaz', 'leal'] },
  { dex: 387, start: 'vine-whip',     traits: ['paciente', 'tenaz'] },
  { dex: 390, start: 'ember',         traits: ['travieso', 'alegre'] },
  { dex: 393, start: 'bubble',        traits: ['orgulloso', 'prudente'] },
  { dex: 495, start: 'razor-leaf',    traits: ['orgulloso', 'astuto'] },
  { dex: 498, start: 'ember',         traits: ['tenaz', 'alegre'] },
  { dex: 501, start: 'water-gun',     traits: ['valiente', 'travieso'] },
  { dex: 650, start: 'vine-whip',     traits: ['travieso', 'tenaz'] },
  { dex: 653, start: 'ember',         traits: ['astuto', 'sereno'] },
  { dex: 656, start: 'water-gun',     traits: ['sereno', 'astuto'] },
  { dex: 722, start: 'razor-leaf',    traits: ['sereno', 'dulce'] },
  { dex: 725, start: 'ember',         traits: ['solitario', 'orgulloso'] },
  { dex: 728, start: 'bubble',        traits: ['alegre', 'dulce'] },
  { dex: 810, start: 'vine-whip',     traits: ['alegre', 'travieso'] },
  { dex: 813, start: 'ember',         traits: ['impulsivo', 'alegre'] },
  { dex: 816, start: 'water-gun',     traits: ['tímido', 'astuto'] },
  { dex: 906, start: 'razor-leaf',    traits: ['solitario', 'astuto'] },
  { dex: 909, start: 'ember',         traits: ['tranquilo', 'tenaz'] },
  { dex: 912, start: 'water-gun',     traits: ['orgulloso', 'prudente'] },
  { dex: 54,  start: 'confusion',     traits: ['caótico', 'tímido'] },
  { dex: 79,  start: 'confusion',     traits: ['tranquilo', 'paciente'] }
];

G.STARTER_BY = {};
for (const s of G.STARTERS) G.STARTER_BY[s.dex] = s;

/** Movimiento inicial de cualquier Pokémon (starter o del gacha). */
G.startMoveOf = dex => {
  const s = G.STARTER_BY[dex];
  return s ? s.start : G.Moves.startFor(G.DEX_BY[dex]);
};

/** Descripción corta de cada rasgo, para la pantalla de resultado. */
G.TRAIT_TEXT = {
  valiente:  'No te lo piensas dos veces cuando alguien necesita ayuda.',
  impulsivo: 'Actúas primero y piensas después. ¡A veces sale bien!',
  prudente:  'Mides cada paso antes de darlo.',
  leal:      'Tus amigos saben que pueden contar contigo siempre.',
  paciente:  'Sabes esperar el momento justo.',
  dulce:     'Tu amabilidad tranquiliza a todos los que te rodean.',
  tímido:    'Te cuesta dar el primer paso, pero sientes mucho.',
  travieso:  'Siempre tienes una broma preparada.',
  sereno:    'Mantienes la calma cuando todo se complica.',
  astuto:    'Ves soluciones donde otros ven problemas.',
  alegre:    'Contagias energía allá donde vas.',
  tenaz:     'Rendirse no entra en tus planes.',
  orgulloso: 'Te exiges ser el mejor, y casi siempre lo consigues.',
  solitario: 'Vas a tu aire y no te importa.',
  tranquilo: 'Nada te altera. Nada.',
  caótico:   'Ni tú sabes qué vas a hacer después.'
};

G.PERSONALITY_TEST = [
  { get q() { return G.t("text.0479"); }, a: [
    { get t() { return G.t("text.0480"); },          p: { valiente: 2, impulsivo: 1 } },
    { get t() { return G.t("text.0481"); },       p: { prudente: 2, leal: 1 } },
    { get t() { return G.t("text.0482"); },             p: { sereno: 1, tímido: 1, solitario: 1 } },
    { get t() { return G.t("text.0483"); },                p: { travieso: 2, caótico: 1 } } ] },
  { get q() { return G.t("text.0484"); }, a: [
    { get t() { return G.t("text.0485"); },         p: { leal: 2, dulce: 1 } },
    { get t() { return G.t("text.0486"); },     p: { tenaz: 2, paciente: 1 } },
    { get t() { return G.t("text.0487"); },            p: { astuto: 2, travieso: 1 } },
    { get t() { return G.t("text.0488"); },               p: { prudente: 1, tímido: 2 } } ] },
  { get q() { return G.t("text.0514"); }, a: [
    { get t() { return G.t("text.0517"); },            p: { impulsivo: 2, alegre: 1 } },
    { get t() { return G.t("text.0518"); },           p: { sereno: 2, tranquilo: 1 } },
    { get t() { return G.t("text.0516"); },             p: { alegre: 2, leal: 1 } },
    { get t() { return G.t("text.0515"); },                 p: { tenaz: 2, orgulloso: 1 } } ] },
  { get q() { return G.t("text.0489"); }, a: [
    { get t() { return G.t("text.0490"); },                p: { tenaz: 2, prudente: 1 } },
    { get t() { return G.t("text.0491"); },           p: { orgulloso: 2, sereno: 1 } },
    { get t() { return G.t("text.0492"); },                     p: { tímido: 2, dulce: 1 } },
    { get t() { return G.t("text.0493"); },                 p: { caótico: 2, tranquilo: 1 } } ] },
  { get q() { return G.t("text.0509"); }, a: [
    { get t() { return G.t("text.0511"); },      p: { alegre: 2, travieso: 1 } },
    { get t() { return G.t("text.0510"); },       p: { leal: 2, dulce: 1 } },
    { get t() { return G.t("text.0512"); },              p: { solitario: 2, astuto: 1 } },
    { get t() { return G.t("text.0513"); },                   p: { valiente: 1, tenaz: 2 } } ] },
  { get q() { return G.t("text.0504"); }, a: [
    { get t() { return G.t("text.0505"); },                 p: { valiente: 2, impulsivo: 1 } },
    { get t() { return G.t("text.0506"); },                     p: { paciente: 2, prudente: 1 } },
    { get t() { return G.t("text.0507"); },            p: { tranquilo: 2, sereno: 1 } },
    { get t() { return G.t("text.0508"); },            p: { astuto: 2, caótico: 1 } } ] },
  { get q() { return G.t("text.0494"); }, a: [
    { get t() { return G.t("text.0495"); },                  p: { orgulloso: 2, impulsivo: 1 } },
    { get t() { return G.t("text.0497"); },                  p: { sereno: 2, solitario: 1 } },
    { get t() { return G.t("text.0498"); },            p: { tímido: 2, dulce: 1 } },
    { get t() { return G.t("text.0496"); },             p: { travieso: 2, astuto: 1 } } ] },
  { get q() { return G.t("text.0499"); }, a: [
    { get t() { return G.t("text.0501"); },                              p: { leal: 2, alegre: 1 } },
    { get t() { return G.t("text.0502"); },                             p: { solitario: 2, impulsivo: 1 } },
    { get t() { return G.t("text.0503"); },                                p: { tranquilo: 2, paciente: 1 } },
    { get t() { return G.t("text.0500"); },                            p: { orgulloso: 2, tenaz: 1 } } ] }
];

/** Puntuaciones de rasgos -> { trait, dex } con el compañero que mejor encaja. */
G.personalityResult = scores => {
  const trait = Object.keys(scores).sort((a, b) => scores[b] - scores[a])[0];
  let best = [], bestScore = -1;
  for (const s of G.STARTERS) {
    // El rasgo principal pesa el doble.
    const v = (scores[s.traits[0]] || 0) * 2 + (scores[s.traits[1]] || 0);
    if (v > bestScore) { bestScore = v; best = [s]; }
    else if (v === bestScore) best.push(s);
  }
  return { trait, dex: G.U.pick(best).dex };
};
