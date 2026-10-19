// Base ability, talent, and magic-capacity rules.
// Values marked "provisional" are placeholders awaiting the designer's decision.

export const STAT_KEYS = ["body", "combat", "intellect", "dexterity", "charm", "luck"];

export const STAT_LABELS = Object.freeze({
  body: "身体能力",
  combat: "戦闘基礎能力",
  intellect: "知力",
  dexterity: "器用さ",
  charm: "魅力",
  luck: "運",
  mana: "魔力量",
});

// Adult baseline per species (provisional, from the spec). Charm and luck are not
// specified per species, so they use 50 for everyone (provisional).
export const RACE_ADULT_MEAN = Object.freeze({
  human: { body: 50, combat: 50, intellect: 50, dexterity: 50 },
  beastkin: { body: 85, combat: 80, intellect: 50, dexterity: 45 },
  dwarf: { body: 70, combat: 65, intellect: 55, dexterity: 95 },
  demon: { body: 70, combat: 65, intellect: 60, dexterity: 55 },
  elf: { body: 75, combat: 80, intellect: 70, dexterity: 75 },
  dragon: { body: 180, combat: 200, intellect: 75, dexterity: 35 },
  vampire: { body: 100, combat: 110, intellect: 65, dexterity: 60 },
});

// Standard deviations (provisional, unconfirmed by the designer).
export const RACE_SD = Object.freeze({
  human: 15, beastkin: 18, dwarf: 14, demon: 18, elf: 15, dragon: 30, vampire: 20,
});

export const TALENT_TABLE = Object.freeze([
  { name: "苦手", rate: 0.15, factor: 0.65 },
  { name: "やや苦手", rate: 0.2, factor: 0.85 },
  { name: "普通", rate: 0.4, factor: 1 },
  { name: "得意", rate: 0.18, factor: 1.25 },
  { name: "天才", rate: 0.06, factor: 1.6 },
  { name: "規格外", rate: 0.01, factor: 2 },
]);

export const SKILL_NAMES = Object.freeze({
  general: "一般",
  manual: "肉体労働",
  farming: "農業",
  tailoring: "裁縫",
  craft: "工芸",
  combat: "格闘",
  trade: "交渉・商い",
  adventuring: "探索",
  teaching: "指導",
  magic: "魔術",
  curse: "呪術",
  smithing: "鍛冶",
  finework: "細工",
  hunting: "狩猟",
  archery: "弓術",
  flight: "飛行",
  dragon: "竜種固有",
  stealth: "隠密",
  charm: "魅了",
  literacy: "読み書き",
  swordsmanship: "剣術",
  scholarship: "学術",
});

export function skillName(skill) {
  return SKILL_NAMES[skill] ?? skill;
}

// Box–Muller standard normal sample.
export function gaussian(random) {
  const u = Math.max(Number.EPSILON, random());
  const v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function rollAdultBaseline(raceId, random) {
  const mean = RACE_ADULT_MEAN[raceId] ?? RACE_ADULT_MEAN.human;
  const sd = RACE_SD[raceId] ?? 15;
  const stats = {};
  for (const key of STAT_KEYS) {
    const raceMean = mean[key] ?? 50;
    stats[key] = Math.max(0, raceMean + gaussian(random) * sd);
  }
  return stats;
}

export function rollTalent(random) {
  let value = random();
  for (const entry of TALENT_TABLE) {
    value -= entry.rate;
    if (value < 0) return entry.name;
  }
  return "普通";
}

// Magic capacity tiers (provisional boundaries).
export function magicTier(mana) {
  if (mana >= 120) return "規格外";
  if (mana >= 60) return "高め";
  if (mana >= 20) return "普通";
  if (mana >= 1) return "微弱";
  return "なし";
}

const MAGIC_TIER_WEIGHTS = Object.freeze({
  default: [10, 25, 45, 17, 3],
  elf: [3, 12, 45, 32, 8],
  demon: [2, 10, 42, 35, 11],
  vampire: [3, 12, 45, 32, 8],
  dragon: [0, 5, 35, 40, 20],
  dwarf: [14, 30, 42, 13, 1],
  beastkin: [16, 30, 40, 12, 2],
});

export function rollMana(raceId, random) {
  const weights = MAGIC_TIER_WEIGHTS[raceId] ?? MAGIC_TIER_WEIGHTS.default;
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let value = random() * total;
  let tier = 0;
  for (; tier < weights.length; tier += 1) {
    value -= weights[tier];
    if (value < 0) break;
  }
  const bands = [[0, 0], [1, 19], [20, 59], [60, 119], [120, 120]];
  const [low, high] = bands[Math.min(tier, 4)];
  if (tier >= 4) return Math.round(120 + -Math.log(Math.max(Number.EPSILON, 1 - random())) * 25);
  return Math.round(low + random() * (high - low));
}

// Provisional body-ability age curve (the designer's draft, unconfirmed). Human-equivalent age.
const BODY_CURVE = [
  [0, 0.05], [5, 0.25], [10, 0.5], [15, 0.8], [20, 1], [30, 1.05], [40, 1],
  [50, 0.9], [60, 0.8], [70, 0.65], [80, 0.5], [90, 0.35], [100, 0.2],
];

export function bodyAgeFactor(humanAge) {
  const age = Math.max(0, humanAge);
  if (age >= 100) return 0.2;
  for (let index = 1; index < BODY_CURVE.length; index += 1) {
    const [nextAge, nextValue] = BODY_CURVE[index];
    if (age <= nextAge) {
      const [previousAge, previousValue] = BODY_CURVE[index - 1];
      return previousValue + (nextValue - previousValue) * ((age - previousAge) / (nextAge - previousAge));
    }
  }
  return 0.2;
}

// Non-body abilities: provisional childhood development only; no ageing decline is applied.
export function developmentFactor(humanAge) {
  return Math.min(1, 0.3 + 0.7 * Math.max(0, humanAge) / 18);
}

export function currentStats(life) {
  const baseline = life.baseStats ?? {};
  const result = {};
  for (const key of STAT_KEYS) {
    result[key] = baseline[key] ?? 50;
  }
  result.mana = life.mana ?? 0;
  return result;
}

export function abilityLabel(value) {
  if (value >= 150) return "伝説級";
  if (value >= 100) return "超人的";
  if (value >= 80) return "卓越";
  if (value >= 60) return "優秀";
  if (value >= 40) return "一般的";
  if (value >= 20) return "低い";
  return "非常に低い";
}
