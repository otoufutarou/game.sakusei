import { NATIONS, RACES, SAVE_VERSION, SKILL_IDS_LIST } from "./simulation.js";
import { RACE_ADULT_MEAN, STAT_KEYS } from "./stats.js";

export const SAVE_KEY = "tomoshibi-save";

// Race and nation are stored by id and re-attached on load, so a save never holds a stale copy of the tables.
export function serializeLife(life) {
  const snapshot = { ...life, race: life.race.id, nation: life.nation.id };
  return JSON.stringify(snapshot, (key, value) => (value === Infinity ? "__Infinity__" : value));
}

function missingDefaults(life) {
  return {
    status: { name: "平民" },
    baseStats: null,
    mana: 0,
    world: { situation: life.situation ?? "平和", since: life.age ?? 0, nextChangeAt: (life.age ?? 0) + 6 },
    skillPractice: {},
    skillMonthProgress: 0,
    skillHistory: [],
    skillTalents: {},
    educationHistory: [],
    trainingEndsAt: null,
    trainingPlan: null,
    mentor: null,
    school: null,
    trainingSkill: null,
    occupationRole: life.occupation ?? "まだ幼い子ども",
    promotionNote: "",
    finance: { recent: [], lastMonth: null, monthProgress: 0, totalIncome: 0, totalExpense: 0 },
    childPlan: "unset",
    nextChildAskAt: (life.age ?? 0) + 1,
    pregnancy: null,
    marriage: null,
    spouseId: null,
    romanticPartnerId: null,
    lastResult: null,
    npcClock: life.age ?? 0,
    nextSocialAt: (life.age ?? 0) + 1,
    careerRecords: {},
    npcs: [],
    relationships: [],
    historyFlags: [],
    eventHistory: [],
    journal: [],
    children: [],
  };
}

// Fill fields that older saves lack. Nothing is invented about the past: missing history stays empty,
// legacy child names are kept as names, and estimated stats are flagged.
export function migrateLife(data) {
  if (!data || typeof data !== "object") throw new Error("invalid save");
  const life = data;
  life.race = RACES.find((race) => race.id === life.race) ?? RACES[0];
  life.nation = NATIONS.find((nation) => nation.id === life.nation) ?? NATIONS[0];
  const defaults = missingDefaults(life);
  for (const [key, value] of Object.entries(defaults)) {
    if (life[key] === undefined || life[key] === null) {
      if (value !== null) life[key] = value;
      else if (life[key] === undefined) life[key] = null;
    }
  }
  life.skillTalents ??= {};
  for (const skill of SKILL_IDS_LIST) {
    life.skillTalents[skill] ??= "普通";
    life.skills ??= {};
    life.skills[skill] ??= 0;
  }
  if (!life.baseStats) {
    const mean = RACE_ADULT_MEAN[life.race.id] ?? {};
    life.baseStats = Object.fromEntries(STAT_KEYS.map((key) => [key, mean[key] ?? 50]));
    life.baseStats.dexterity = life.dexterity ?? life.baseStats.dexterity;
    life.statsEstimated = true;
  }
  if (typeof life.mana !== "number") life.mana = 0;
  if (Array.isArray(life.children) && life.children.some((child) => typeof child === "string")) {
    life.legacyChildren = life.children.filter((child) => typeof child === "string");
    life.children = life.children.filter((child) => typeof child !== "string");
  }
  life.nextLogAt ??= life.age + 1;
  life.nextDecisionAt ??= life.age + 2;
  life.maxHumanAge ??= life.race.lifespan / life.race.multiplier;
  life.speed ??= 1;
  life.active ??= true;
  if (life.pendingDecision) life.pendingDecision = null;
  life.playing = false;
  life.saveVersion = SAVE_VERSION;
  return life;
}

export function deserializeLife(text) {
  const data = JSON.parse(text, (key, value) => (value === "__Infinity__" ? Infinity : value));
  return migrateLife(data);
}

export function saveToStorage(life, storage = globalThis.localStorage) {
  try {
    storage.setItem(SAVE_KEY, serializeLife(life));
    return true;
  } catch {
    return false;
  }
}

export function loadFromStorage(storage = globalThis.localStorage) {
  try {
    const text = storage.getItem(SAVE_KEY);
    return text ? deserializeLife(text) : null;
  } catch {
    return null;
  }
}

export function clearSave(storage = globalThis.localStorage) {
  try {
    storage.removeItem(SAVE_KEY);
  } catch {
    // storage unavailable
  }
}
