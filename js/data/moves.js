/* ============ moves.js — catálogo de movimientos ============
 *
 * kind (comportamiento, implementado en systems/combat.js):
 *   projectile  dispara `count` proyectiles al enemigo más cercano
 *   melee       golpe en arco alrededor del Pokémon
 *   beam        rayo recto que atraviesa todo lo que pilla
 *   orbit       orbes que giran alrededor mientras el movimiento está activo
 *   nova        ráfaga radial en todas las direcciones
 *   aura        círculo de daño continuo alrededor
 *   buff        potencia al propio Pokémon (acumulable, caduca)
 *   ---- desde 2026-10-10 (mismos gráficos, otra forma de jugar) ----
 *   boomerang   sale hacia el enemigo y vuelve a ti, golpeando a la ida y a la vuelta
 *   chain       golpea a uno y salta a los `count` siguientes más cercanos
 *   mine        minas en el suelo que estallan al pisarlas
 *   meteor      caen `count` meteoros sobre enemigos cercanos (avisa la sombra)
 *   turret      deja algo que dispara solo durante `dur` segundos
 *   dash        cruzas hacia el enemigo golpeando todo el camino (sin recibir daño)
 *   trail       vas dejando charcos que dañan a lo que los pisa
 *   cone        muchos disparos cortos en abanico (aliento, chorro...)
 *
 * Sólo el movimiento ACTIVO se ejecuta. Se cambia con 1-4 / Q / E.
 *
 * El icono no se guarda aquí: G.Icons lo compone (emblema del tipo +
 * insignia de la familia), ver ui/icons.js.
 *
 * Las mejoras (lvl 1 -> 5) salen de una escalera común por `kind`:
 *   mods multiplicativos -> dmg, cd, speed, radius, dur, amount, arc
 *   mods aditivos        -> count, pierce, stacks
 */
(() => {
  const LADDERS = {
    projectile: [
      { get t() { return G.t("text.0204"); },                  m: { count: 1, spread: 1.4 } },
      { get t() { return G.t("text.0206"); },                     m: { dmg: 1.45 } },
      { get t() { return G.t("text.0207"); },                  m: { cd: 0.75 } },
      { get t() { return G.t("text.0205"); },   m: { count: 1, pierce: 1, spread: 1.2 } }
    ],
    melee: [
      { get t() { return G.t("text.0208"); },                     m: { dmg: 1.40 } },
      { get t() { return G.t("text.0209"); },                  m: { radius: 1.25 } },
      { get t() { return G.t("text.0207"); },                  m: { cd: 0.75 } },
      { get t() { return G.t("text.0210"); },    m: { arc: 9, dmg: 1.50 } }
    ],
    beam: [
      { get t() { return G.t("text.0206"); },                     m: { dmg: 1.45 } },
      { get t() { return G.t("text.0211"); },         m: { radius: 1.30, width: 1.30 } },
      { get t() { return G.t("text.0207"); },                  m: { cd: 0.75 } },
      { get t() { return G.t("text.0212"); },                     m: { dmg: 1.50 } }
    ],
    orbit: [
      { get t() { return G.t("text.0213"); },                       m: { count: 1 } },
      { get t() { return G.t("text.0214"); },                     m: { dmg: 1.55 } },
      { get t() { return G.t("text.0215"); },  m: { radius: 1.25, speed: 1.35 } },
      { get t() { return G.t("text.0216"); },           m: { count: 1, dmg: 1.55 } }
    ],
    nova: [
      { get t() { return G.t("text.0217"); },                m: { count: 4 } },
      { get t() { return G.t("text.0208"); },                     m: { dmg: 1.40 } },
      { get t() { return G.t("text.0207"); },                  m: { cd: 0.75 } },
      { get t() { return G.t("text.0218"); }, m: { count: 4, pierce: 1 } }
    ],
    aura: [
      { get t() { return G.t("text.0219"); },                    m: { radius: 1.30 } },
      { get t() { return G.t("text.0206"); },                     m: { dmg: 1.45 } },
      { get t() { return G.t("text.0225"); },    m: { cd: 0.70 } },
      { get t() { return G.t("text.0220"); },        m: { radius: 1.30, dmg: 1.50 } }
    ],
    boomerang: [
      { get t() { return G.t("text.1071"); },                    m: { count: 1 } },
      { get t() { return G.t("text.0206"); },                     m: { dmg: 1.45 } },
      { get t() { return G.t("text.1072"); },                  m: { radius: 1.30 } },
      { get t() { return G.t("text.1073"); },        m: { count: 1, dmg: 1.40 } }
    ],
    chain: [
      { get t() { return G.t("text.1074"); },                     m: { count: 2 } },
      { get t() { return G.t("text.0206"); },                     m: { dmg: 1.45 } },
      { get t() { return G.t("text.0207"); },                  m: { cd: 0.75 } },
      { get t() { return G.t("text.1075"); },         m: { count: 2, dmg: 1.40 } }
    ],
    mine: [
      { get t() { return G.t("text.1076"); },                       m: { count: 1 } },
      { get t() { return G.t("text.0212"); },                     m: { dmg: 1.50 } },
      { get t() { return G.t("text.1077"); },       m: { radius: 1.30 } },
      { get t() { return G.t("text.1078"); },        m: { count: 1, cd: 0.75 } }
    ],
    meteor: [
      { get t() { return G.t("text.1079"); },                    m: { count: 1 } },
      { get t() { return G.t("text.0206"); },                     m: { dmg: 1.45 } },
      { get t() { return G.t("text.0219"); },                    m: { radius: 1.30 } },
      { get t() { return G.t("text.1080"); },    m: { count: 2, cd: 0.80 } }
    ],
    turret: [
      { get t() { return G.t("text.0212"); },                     m: { dmg: 1.50 } },
      { get t() { return G.t("text.1081"); },     m: { rate: 0.74 } },
      { get t() { return G.t("text.1082"); },                   m: { count: 1 } },
      { get t() { return G.t("text.1083"); },     m: { dur: 1.50, dmg: 1.40 } }
    ],
    dash: [
      { get t() { return G.t("text.0208"); },                     m: { dmg: 1.40 } },
      { get t() { return G.t("text.1084"); },                m: { radius: 1.30 } },
      { get t() { return G.t("text.0207"); },                  m: { cd: 0.75 } },
      { get t() { return G.t("text.1085"); },         m: { dmg: 1.60, width: 1.40 } }
    ],
    trail: [
      { get t() { return G.t("text.0208"); },                     m: { dmg: 1.40 } },
      { get t() { return G.t("text.1086"); },                 m: { dur: 1.40 } },
      { get t() { return G.t("text.1087"); },    m: { radius: 1.30 } },
      { get t() { return G.t("text.1088"); },        m: { dmg: 1.50, radius: 1.30 } }
    ],
    cone: [
      { get t() { return G.t("text.1089"); },                   m: { count: 3 } },
      { get t() { return G.t("text.0208"); },                     m: { dmg: 1.40 } },
      { get t() { return G.t("text.1072"); },                  m: { life: 1.30 } },
      { get t() { return G.t("text.1090"); },  m: { count: 3, pierce: 1 } }
    ],
    buff: [
      { get t() { return G.t("text.0222"); },         m: { stacks: 1 } },
      { get t() { return G.t("text.0221"); },                 m: { amount: 1.40 } },
      { get t() { return G.t("text.0223"); },                 m: { dur: 1.50 } },
      { get t() { return G.t("text.0224"); }, m: { stacks: 1, amount: 1.40 } }
    ]
  };

  const RAW = [
    // ---------------- NORMAL (pool común a todos) ----------------
    { id: 'tackle', get name() { return G.t("text.0139"); }, type: 'normal', kind: 'melee',
      get desc() { return G.t("text.0166"); },
      cd: 0.50, dmg: 13, radius: 48, arc: 1.7, knock: 90 },

    { id: 'quick-attack', get name() { return G.t("text.0140"); }, type: 'normal', kind: 'dash',
      get desc() { return G.t("text.1052"); },
      cd: 0.75, dmg: 20, radius: 110, width: 34, knock: 40 },

    { id: 'swords-dance', get name() { return G.t("text.0147"); }, type: 'normal', kind: 'buff',
      get desc() { return G.t("text.0181"); },
      cd: 0.85, stat: 'atk', amount: 0.13, dur: 7, stacks: 5 },

    { id: 'agility', get name() { return G.t("text.0148"); }, type: 'normal', kind: 'buff',
      get desc() { return G.t("text.0184"); },
      cd: 0.85, stat: 'spd', amount: 0.10, dur: 7, stacks: 5 },

    { id: 'harden', get name() { return G.t("text.0149"); }, type: 'normal', kind: 'buff',
      get desc() { return G.t("text.0182"); },
      cd: 0.85, stat: 'def', amount: 0.07, dur: 7, stacks: 5 },

    // ---------------- FUEGO ----------------
    { id: 'ember', get name() { return G.t("text.0052"); }, type: 'fire', kind: 'projectile',
      get desc() { return G.t("text.0154"); },
      cd: 0.52, dmg: 18, speed: 310, count: 1, spread: 0.12, pierce: 0, life: 1.6, size: 7, burn: 1 },

    { id: 'flamethrower', get name() { return G.t("text.0053"); }, type: 'fire', kind: 'cone',
      get desc() { return G.t("text.1053"); },
      cd: 0.70, dmg: 7, count: 7, arc: 0.9, speed: 380, life: 0.42, size: 6, pierce: 1, burn: 1 },

    { id: 'fire-spin', get name() { return G.t("text.0054"); }, type: 'fire', kind: 'orbit',
      get desc() { return G.t("text.0176"); },
      cd: 0.30, dmg: 14, count: 3, radius: 62, speed: 2.4, size: 9, burn: 1 },

    { id: 'heat-wave', get name() { return G.t("text.0055"); }, type: 'fire', kind: 'nova',
      get desc() { return G.t("text.0170"); },
      cd: 1.25, dmg: 13, speed: 250, count: 10, pierce: 1, life: 1.1, size: 7, burn: 1 },

    // ---------------- AGUA ----------------
    { id: 'water-gun', get name() { return G.t("text.0060"); }, type: 'water', kind: 'projectile',
      get desc() { return G.t("text.0160"); },
      cd: 0.44, dmg: 14, speed: 350, count: 1, spread: 0.10, pierce: 1, life: 1.5, size: 6 },

    { id: 'bubble', get name() { return G.t("text.0061"); }, type: 'water', kind: 'nova',
      get desc() { return G.t("text.0156"); },
      cd: 1.00, dmg: 9, speed: 210, count: 8, pierce: 0, life: 1.3, size: 8, slow: 0.45 },

    { id: 'hydro-pump', get name() { return G.t("text.0062"); }, type: 'water', kind: 'beam',
      get desc() { return G.t("text.0158"); },
      cd: 1.50, dmg: 29, radius: 250, width: 30 },

    { id: 'aqua-ring', get name() { return G.t("text.0065"); }, type: 'water', kind: 'buff',
      get desc() { return G.t("text.0183"); },
      cd: 0.90, stat: 'regen', amount: 1.6, dur: 8, stacks: 4 },

    // ---------------- PLANTA ----------------
    { id: 'vine-whip', get name() { return G.t("text.0066"); }, type: 'grass', kind: 'melee',
      get desc() { return G.t("text.0174"); },
      cd: 0.62, dmg: 16, radius: 68, arc: 1.3, knock: 60 },

    { id: 'razor-leaf', get name() { return G.t("text.0067"); }, type: 'grass', kind: 'boomerang',
      get desc() { return G.t("text.1054"); },
      cd: 0.90, dmg: 10, speed: 330, count: 2, spread: 0.5, radius: 210, size: 6 },

    { id: 'leaf-storm', get name() { return G.t("text.0068"); }, type: 'grass', kind: 'orbit',
      get desc() { return G.t("text.0198"); },
      cd: 0.26, dmg: 14, count: 4, radius: 74, speed: 2.6, size: 8 },

    // (Antes Gigadrenado: curaba con cada golpe y estaba roto. Mismo id para no romper partidas.)
    { id: 'giga-drain', get name() { return G.t("text.0070"); }, type: 'grass', kind: 'aura',
      get desc() { return G.t("text.0165"); },
      cd: 0.55, dmg: 9, radius: 76 },

    // ---------------- ELÉCTRICO ----------------
    { id: 'thunder-shock', get name() { return G.t("text.0075"); }, type: 'electric', kind: 'projectile',
      get desc() { return G.t("text.0162"); },
      cd: 0.40, dmg: 13, speed: 480, count: 1, spread: 0.08, pierce: 2, life: 1.1, size: 5 },

    { id: 'discharge', get name() { return G.t("text.0076"); }, type: 'electric', kind: 'aura',
      get desc() { return G.t("text.0157"); },
      cd: 0.45, dmg: 8, radius: 70 },

    { id: 'thunderbolt', get name() { return G.t("text.0077"); }, type: 'electric', kind: 'chain',
      get desc() { return G.t("text.1055"); },
      cd: 0.95, dmg: 21, count: 4, radius: 140 },

    // ---------------- PSÍQUICO ----------------
    // (11-10-2026: -22/-30 % de daño y persiguen menos; llenaban el ranking.)
    { id: 'confusion', get name() { return G.t("text.0081"); }, type: 'psychic', kind: 'projectile',
      get desc() { return G.t("text.0187"); },
      cd: 0.58, dmg: 13, speed: 280, count: 1, spread: 0.1, pierce: 0, life: 2.2, size: 8, homing: 2.0 },

    { id: 'psybeam', get name() { return G.t("text.0082"); }, type: 'psychic', kind: 'beam',
      get desc() { return G.t("text.0194"); },
      cd: 1.15, dmg: 17, radius: 215, width: 40 },

    { id: 'psychic', get name() { return G.t("text.0046"); }, type: 'psychic', kind: 'nova',
      get desc() { return G.t("text.0169"); },
      cd: 1.35, dmg: 10, speed: 230, count: 12, pierce: 1, life: 1.6, size: 7, homing: 1.0 },

    // ---------------- TIPOS SECUNDARIOS ----------------
    { id: 'sludge', get name() { return G.t("text.0086"); }, type: 'poison', kind: 'projectile',
      get desc() { return G.t("text.0178"); },
      cd: 0.60, dmg: 17, speed: 290, count: 1, spread: 0.12, pierce: 0, life: 1.5, size: 8, poison: 1 },

    { id: 'mud-shot', get name() { return G.t("text.0092"); }, type: 'ground', kind: 'nova',
      get desc() { return G.t("text.0197"); },
      cd: 1.10, dmg: 11, speed: 200, count: 7, pierce: 0, life: 1.0, size: 9, slow: 0.4 },

    { id: 'gust', get name() { return G.t("text.0096"); }, type: 'flying', kind: 'orbit',
      get desc() { return G.t("text.0195"); },
      cd: 0.26, dmg: 13, count: 3, radius: 72, speed: 2.8, size: 8, knock: 40 },

    { id: 'wing-attack', get name() { return G.t("text.0097"); }, type: 'flying', kind: 'melee',
      get desc() { return G.t("text.0153"); },
      cd: 0.55, dmg: 14, radius: 58, arc: 1.9, knock: 70 },

    // ---------------- NORMAL (extra) ----------------
    { id: 'body-slam', get name() { return G.t("text.0141"); }, type: 'normal', kind: 'melee',
      get desc() { return G.t("text.0190"); },
      cd: 0.95, dmg: 30, radius: 46, arc: 2.2, knock: 140 },

    { id: 'hyper-voice', get name() { return G.t("text.0142"); }, type: 'normal', kind: 'nova',
      get desc() { return G.t("text.0188"); },
      cd: 1.15, dmg: 12, speed: 260, count: 9, pierce: 1, life: 0.9, size: 7 },

    // ---------------- VENENO (extra) ----------------
    { id: 'poison-sting', get name() { return G.t("text.0087"); }, type: 'poison', kind: 'projectile',
      get desc() { return G.t("text.0152"); },
      cd: 0.34, dmg: 8, speed: 420, count: 1, spread: 0.08, pierce: 0, life: 1.0, size: 4, poison: 1 },

    { id: 'toxic', get name() { return G.t("text.0088"); }, type: 'poison', kind: 'trail',
      get desc() { return G.t("text.1056"); },
      cd: 0.3, dmg: 6, radius: 26, dur: 3, poison: 1 },

    // ---------------- TIERRA (extra) ----------------
    { id: 'bulldoze', get name() { return G.t("text.0093"); }, type: 'ground', kind: 'aura',
      get desc() { return G.t("text.0196"); },
      cd: 0.7, dmg: 11, radius: 80, slow: 0.35 },

    // ---------------- BICHO ----------------
    { id: 'bug-bite', get name() { return G.t("text.0100"); }, type: 'bug', kind: 'melee',
      get desc() { return G.t("text.0179"); },
      cd: 0.42, dmg: 11, radius: 44, arc: 1.6, knock: 40 },

    { id: 'string-shot', get name() { return G.t("text.0101"); }, type: 'bug', kind: 'mine',
      get desc() { return G.t("text.1057"); },
      cd: 1.1, dmg: 14, count: 2, radius: 56, dur: 7, slow: 0.6 },

    { id: 'bug-buzz', get name() { return G.t("text.0102"); }, type: 'bug', kind: 'aura',
      get desc() { return G.t("text.0202"); },
      cd: 0.45, dmg: 8, radius: 66 },

    // ---------------- ROCA ----------------
    { id: 'rock-throw', get name() { return G.t("text.0106"); }, type: 'rock', kind: 'projectile',
      get desc() { return G.t("text.0189"); },
      cd: 0.7, dmg: 24, speed: 260, count: 1, spread: 0.12, pierce: 0, life: 1.4, size: 9, knock: 90 },

    { id: 'rock-slide', get name() { return G.t("text.0107"); }, type: 'rock', kind: 'meteor',
      get desc() { return G.t("text.1058"); },
      cd: 1.3, dmg: 21, count: 3, radius: 46, knock: 50 },     // (12-10-2026: era 26; mataba el doble que la media)

    // ---------------- HIELO ----------------
    { id: 'ice-beam', get name() { return G.t("text.0110"); }, type: 'ice', kind: 'beam',
      get desc() { return G.t("text.0193"); },
      cd: 1.1, dmg: 20, radius: 220, width: 30, slow: 0.7 },

    { id: 'powder-snow', get name() { return G.t("text.0111"); }, type: 'ice', kind: 'aura',
      get desc() { return G.t("text.0201"); },
      cd: 0.55, dmg: 8, radius: 76, slow: 0.45 },

    // ---------------- LUCHA ----------------
    { id: 'karate-chop', get name() { return G.t("text.0114"); }, type: 'fighting', kind: 'melee',
      get desc() { return G.t("text.0171"); },
      cd: 0.5, dmg: 18, radius: 50, arc: 1.2, knock: 110 },

    { id: 'aura-sphere', get name() { return G.t("text.0115"); }, type: 'fighting', kind: 'projectile',
      get desc() { return G.t("text.0167"); },
      cd: 0.62, dmg: 17, speed: 300, count: 1, spread: 0.1, pierce: 0, life: 2.0, size: 8, homing: 4 },

    // ---------------- FANTASMA ----------------
    { id: 'lick', get name() { return G.t("text.0118"); }, type: 'ghost', kind: 'melee',
      get desc() { return G.t("text.0173"); },
      cd: 0.48, dmg: 12, radius: 48, arc: 1.8, slow: 0.4 },

    { id: 'shadow-ball', get name() { return G.t("text.0119"); }, type: 'ghost', kind: 'projectile',
      get desc() { return G.t("text.0168"); },
      cd: 0.66, dmg: 19, speed: 280, count: 1, spread: 0.1, pierce: 2, life: 1.6, size: 9 },

    // ---------------- DRAGÓN ----------------
    { id: 'dragon-rage', get name() { return G.t("text.0124"); }, type: 'dragon', kind: 'beam',
      get desc() { return G.t("text.0175"); },
      cd: 1.0, dmg: 24, radius: 230, width: 34 },

    { id: 'dragon-dance', get name() { return G.t("text.0126"); }, type: 'dragon', kind: 'buff',
      get desc() { return G.t("text.0180"); },
      cd: 0.7, stat: 'atk', amount: 0.11, dur: 7, stacks: 5 },

    // ---------------- HADA ----------------
    { id: 'fairy-wind', get name() { return G.t("text.0127"); }, type: 'fairy', kind: 'nova',
      get desc() { return G.t("text.0155"); },
      cd: 1.0, dmg: 11, speed: 230, count: 10, pierce: 0, life: 1.2, size: 7 },

    { id: 'dazzling-gleam', get name() { return G.t("text.0128"); }, type: 'fairy', kind: 'aura',
      get desc() { return G.t("text.0163"); },
      cd: 0.5, dmg: 9, radius: 72 },

    // ---------------- ACERO ----------------
    { id: 'metal-claw', get name() { return G.t("text.0131"); }, type: 'steel', kind: 'melee',
      get desc() { return G.t("text.0203"); },
      cd: 0.5, dmg: 15, radius: 50, arc: 1.6, knock: 60 },

    { id: 'flash-cannon', get name() { return G.t("text.0132"); }, type: 'steel', kind: 'beam',
      get desc() { return G.t("text.0192"); },
      cd: 1.05, dmg: 23, radius: 220, width: 30 },

    // ---------------- SINIESTRO ----------------
    { id: 'bite', get name() { return G.t("text.0135"); }, type: 'dark', kind: 'melee',
      get desc() { return G.t("text.0161"); },
      cd: 0.45, dmg: 14, radius: 46, arc: 1.5, knock: 70 },

    { id: 'dark-pulse', get name() { return G.t("text.0136"); }, type: 'dark', kind: 'nova',
      get desc() { return G.t("text.0186"); },
      cd: 1.15, dmg: 14, speed: 240, count: 10, pierce: 1, life: 1.1, size: 8 },

    { id: 'night-shade', get name() { return G.t("text.0120"); }, type: 'dark', kind: 'aura',
      get desc() { return G.t("text.0200"); },
      cd: 0.5, dmg: 9, radius: 72 },

    // ---------------- NUEVOS (2026-10-10): mismas formas, otras mecánicas ----------------
    { id: 'bonemerang', get name() { return G.t("text.1028"); }, type: 'ground', kind: 'boomerang',
      get desc() { return G.t("text.1059"); },
      cd: 0.95, dmg: 16, speed: 300, count: 1, radius: 230, size: 8, knock: 40 },

    { id: 'psycho-cut', get name() { return G.t("text.1029"); }, type: 'psychic', kind: 'boomerang',
      get desc() { return G.t("text.1060"); },
      cd: 0.8, dmg: 9, speed: 360, count: 2, spread: 0.6, radius: 200, size: 7 },

    { id: 'spikes', get name() { return G.t("text.1030"); }, type: 'ground', kind: 'mine',
      get desc() { return G.t("text.1061"); },
      cd: 1.2, dmg: 18, count: 2, radius: 60, dur: 8 },

    { id: 'toxic-spikes', get name() { return G.t("text.1031"); }, type: 'poison', kind: 'mine',
      get desc() { return G.t("text.1062"); },
      cd: 1.1, dmg: 11, count: 2, radius: 56, dur: 8, poison: 2 },

    { id: 'hail', get name() { return G.t("text.1032"); }, type: 'ice', kind: 'meteor',
      get desc() { return G.t("text.1063"); },
      cd: 1.2, dmg: 18, count: 4, radius: 40, slow: 0.4 },

    { id: 'meteor-mash', get name() { return G.t("text.1033"); }, type: 'steel', kind: 'meteor',
      get desc() { return G.t("text.1064"); },
      cd: 1.4, dmg: 34, count: 2, radius: 54, knock: 80 },

    { id: 'will-o-wisp', get name() { return G.t("text.1034"); }, type: 'fire', kind: 'turret',
      get desc() { return G.t("text.1065"); },
      cd: 3.5, dmg: 15, rate: 0.55, dur: 6, count: 1, range: 300, speed: 300, size: 7, burn: 1 },

    { id: 'substitute', get name() { return G.t("text.1035"); }, type: 'normal', kind: 'turret',
      get desc() { return G.t("text.1066"); },
      cd: 4.0, dmg: 14, rate: 0.4, dur: 6, count: 1, range: 280, speed: 320, size: 6 },

    { id: 'aerial-ace', get name() { return G.t("text.1036"); }, type: 'flying', kind: 'dash',
      get desc() { return G.t("text.1067"); },
      cd: 0.75, dmg: 18, radius: 120, width: 40, knock: 60 },

    { id: 'flame-wheel', get name() { return G.t("text.1037"); }, type: 'fire', kind: 'trail',
      get desc() { return G.t("text.1068"); },
      cd: 0.28, dmg: 10, radius: 28, dur: 2.6, burn: 1 },

    { id: 'bubble-beam', get name() { return G.t("text.1038"); }, type: 'water', kind: 'cone',
      get desc() { return G.t("text.1069"); },
      cd: 0.65, dmg: 6, count: 7, arc: 1.0, speed: 340, life: 0.45, size: 6, slow: 0.3 },

    { id: 'hex', get name() { return G.t("text.1039"); }, type: 'ghost', kind: 'chain',
      get desc() { return G.t("text.1070"); },
      cd: 0.9, dmg: 17, count: 4, radius: 150, hex: 1.7 }
  ];

  // Cuerpo a cuerpo (12-10-2026): +20 % de daño y +25 % de alcance y de arco
  // (y -25 % de daño recibido mientras sea tu ataque activo, en player.js).
  // Pegaban bien, pero había que arriesgar mucho más que con los de distancia.
  for (const m of RAW) {
    if (m.kind !== 'melee') continue;
    m.dmg = Math.round(m.dmg * 1.2);
    m.radius = Math.round(m.radius * 1.25);
    if (m.arc) m.arc = Math.min(3, +(m.arc * 1.25).toFixed(2));
  }

  // Pool de movimientos por tipo. El pool `normal` lo tienen todos.
  const POOL = {};
  for (const m of RAW) (POOL[m.type] = POOL[m.type] || []).push(m.id);

  const BY_ID = {};
  for (const m of RAW) {
    m.ups = LADDERS[m.kind];
    m.maxLvl = m.ups.length + 1;
    BY_ID[m.id] = m;
  }

  /** Movimientos que este Pokémon puede aprender (sus tipos + normal). */
  function poolFor(mon) {
    const ids = new Set(POOL.normal);
    for (const t of mon.types) for (const id of (POOL[t] || [])) ids.add(id);
    return [...ids];
  }

  /**
   * Instancia de movimiento en una run: los números base de `def` con todas
   * las mejoras de la escalera hasta `lvl` ya aplicadas.
   */
  function instance(id, lvl = 1) {
    const def = BY_ID[id];
    const s = Object.assign({}, def, { id, def, lvl, t: 0 });
    delete s.ups;
    for (let i = 0; i < lvl - 1; i++) applyMods(s, def.ups[i].m);
    return s;
  }

  const MULT = ['dmg', 'cd', 'speed', 'radius', 'dur', 'amount', 'arc', 'width', 'spread', 'life', 'size', 'rate'];
  const ADD = ['count', 'pierce', 'stacks'];

  function applyMods(s, m) {
    for (const k in m) {
      if (MULT.includes(k) && s[k] != null) s[k] *= m[k];
      else if (ADD.includes(k)) s[k] = (s[k] || 0) + m[k];
      else s[k] = m[k];
    }
  }

  /** Sube de nivel una instancia ya creada. */
  function levelUp(s) {
    if (s.lvl >= s.def.maxLvl) return false;
    applyMods(s, s.def.ups[s.lvl - 1].m);
    s.lvl++;
    return true;
  }

  /** Texto de la próxima mejora, para la carta de subida de nivel. */
  function nextUpText(s) {
    return s.lvl >= s.def.maxLvl ? null : s.def.ups[s.lvl - 1].t;
  }

  /** Movimiento inicial según el tipo principal (si el Pokémon no trae uno). */
  const START = {
    fire: 'ember', water: 'water-gun', grass: 'vine-whip', electric: 'thunder-shock',
    psychic: 'confusion', poison: 'sludge', ground: 'mud-shot', flying: 'gust',
    bug: 'bug-bite', rock: 'rock-throw', ice: 'ice-beam', fighting: 'karate-chop',
    ghost: 'shadow-ball', dragon: 'dragon-rage', fairy: 'fairy-wind', steel: 'metal-claw',
    dark: 'bite', normal: 'tackle'
  };
  function startFor(mon) {
    if (mon.start && BY_ID[mon.start]) return mon.start;
    for (const t of mon.types) if (START[t]) return START[t];
    return 'tackle';
  }

  // ---------------- evolución de movimientos ----------------
  /*
   * Un movimiento al NIVEL MÁXIMO evoluciona si en esa run has cogido alguna
   * vez la mejora de su condición (`needs`, un id de LevelUp.STATS). Sale una
   * carta dorada. Los potenciadores (buff) no evolucionan.
   */
  const NEED_NAME = { hp: 'Vigor', atk: 'Potencia', spd: 'Carrera', cd: 'Reflejos', def: 'Coraza',
                      rgn: 'Síntesis', mag: 'Imán', xp: 'Aprendizaje' };
  const EVO = {
    'tackle': ['Derribo', 'hp'],             'quick-attack': ['Velocidad Extrema', 'spd'],
    'body-slam': ['Gigaimpacto', 'atk'],     'hyper-voice': ['Alboroto', 'cd'],
    'ember': ['Llamarada', 'atk'],           'flamethrower': ['Sofoco', 'cd'],
    'fire-spin': ['Fuego Sagrado', 'rgn'],   'heat-wave': ['Erupción', 'hp'],
    'water-gun': ['Escaldar', 'atk'],        'bubble': ['Surf', 'spd'],
    'hydro-pump': ['Hidrocañón', 'atk'],     'vine-whip': ['Latigazo', 'atk'],
    'razor-leaf': ['Lluevehojas', 'cd'],     'leaf-storm': ['Danza Pétalo', 'rgn'],
    'giga-drain': ['Planta Feroz', 'hp'],    'thunder-shock': ['Trueno', 'atk'],
    'discharge': ['Campo Eléctrico', 'def'], 'thunderbolt': ['Electrocañón', 'cd'],
    'confusion': ['Psicocarga', 'cd'],       'psybeam': ['Premonición', 'atk'],
    'psychic': ['Vasta Fuerza', 'mag'],      'sludge': ['Bomba Lodo', 'atk'],
    'poison-sting': ['Puya Nociva', 'spd'],  'toxic': ['Gas Venenoso', 'rgn'],
    'mud-shot': ['Tierra Viva', 'atk'],      'bulldoze': ['Terremoto', 'atk'],
    'gust': ['Vendaval', 'spd'],             'wing-attack': ['Pájaro Osado', 'atk'],
    'bug-bite': ['Tijera X', 'atk'],         'string-shot': ['Red Viscosa', 'cd'],
    'bug-buzz': ['Enjambre', 'rgn'],         'rock-throw': ['Roca Afilada', 'atk'],
    'rock-slide': ['Trampa Rocas', 'cd'],    'ice-beam': ['Ventisca', 'atk'],
    'powder-snow': ['Viento Hielo', 'spd'],  'karate-chop': ['A Bocajarro', 'atk'],
    'aura-sphere': ['Onda Certera', 'cd'],   'lick': ['Puño Sombra', 'atk'],
    'shadow-ball': ['Golpe Fantasma', 'cd'], 'dragon-rage': ['Cometa Draco', 'atk'],
    'fairy-wind': ['Fuerza Lunar', 'atk'],   'dazzling-gleam': ['Campo de Niebla', 'rgn'],
    'metal-claw': ['Cabeza de Hierro', 'atk'], 'flash-cannon': ['Rayo Metálico', 'def'],
    'bite': ['Triturar', 'atk'],             'dark-pulse': ['Alarido', 'spd'],
    'night-shade': ['Pesadilla', 'rgn'],
    'bonemerang': ['Ataque Óseo', 'atk'],    'psycho-cut': ['Psicocolmillo', 'cd'],
    'spikes': ['Fisura', 'atk'],             'toxic-spikes': ['Lanza Mugre', 'rgn'],
    'hail': ['Alud', 'cd'],                  'meteor-mash': ['Bomba Imán', 'atk'],
    'will-o-wisp': ['Infierno', 'cd'],       'substitute': ['Doble Equipo', 'def'],
    'aerial-ace': ['Acróbata', 'spd'],       'flame-wheel': ['Envite Ígneo', 'spd'],
    'bubble-beam': ['Acua Cola', 'atk'],     'hex': ['Poltergeist', 'mag']
  };
  // Lo que gana al evolucionar, según cómo funcione.
  const EVO_MODS = {
    projectile: { get t() { return G.t("text.0226"); }, m: { dmg: 1.8, count: 2, pierce: 2, size: 1.3, spread: 1.1 } },
    melee:      { get t() { return G.t("text.0227"); }, m: { dmg: 1.9, radius: 1.3, arc: 9 } },
    beam:       { get t() { return G.t("text.0228"); }, m: { dmg: 1.8, width: 1.5, radius: 1.2, cd: 0.85 } },
    orbit:      { get t() { return G.t("text.0229"); }, m: { count: 2, dmg: 1.7, radius: 1.15 } },
    nova:       { get t() { return G.t("text.0230"); }, m: { count: 6, dmg: 1.6, pierce: 1 } },
    aura:       { get t() { return G.t("text.0231"); }, m: { dmg: 1.8, radius: 1.35 } },
    boomerang:  { get t() { return G.t("text.1091"); }, m: { dmg: 1.8, count: 1, radius: 1.2, size: 1.2 } },
    chain:      { get t() { return G.t("text.1092"); }, m: { dmg: 1.7, count: 3, radius: 1.2 } },
    mine:       { get t() { return G.t("text.1093"); }, m: { dmg: 1.8, count: 2, radius: 1.25 } },
    meteor:     { get t() { return G.t("text.1094"); }, m: { dmg: 1.7, count: 2, radius: 1.2 } },
    turret:     { get t() { return G.t("text.1095"); }, m: { dmg: 1.8, count: 1, rate: 0.8 } },
    dash:       { get t() { return G.t("text.1096"); }, m: { dmg: 1.9, radius: 1.25, cd: 0.8 } },
    trail:      { get t() { return G.t("text.1097"); }, m: { dmg: 1.8, radius: 1.25, dur: 1.3 } },
    cone:       { get t() { return G.t("text.1098"); }, m: { dmg: 1.7, count: 4, pierce: 1 } }
  };

  /** ¿Puede evolucionar ya? → { name, needs, needName, text, ready } o null */
  function evoInfo(m, statsTaken) {
    const e = EVO[m.id];
    if (!e || m.evolved || m.lvl < m.def.maxLvl || !EVO_MODS[m.kind]) return null;
    const [name, needs] = e;
    return { name, needs, needName: NEED_NAME[needs], text: EVO_MODS[m.kind].t,
             ready: !!(statsTaken && statsTaken[needs]) };
  }

  /** Evoluciona una instancia (cambia nombre y potencia; sigue siendo del mismo tipo). */
  function evolve(m) {
    const e = EVO[m.id];
    if (!e || m.evolved) return false;
    applyMods(m, EVO_MODS[m.kind].m);
    m.baseName = m.name;
    m.name = e[0];
    m.evolved = true;
    return true;
  }

  G.Moves = { ALL: RAW, BY_ID, POOL, poolFor, instance, levelUp, nextUpText, startFor,
              EVO, NEED_NAME, evoInfo, evolve };
})();
