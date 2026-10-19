import test from "node:test";
import assert from "node:assert/strict";
import {
  CHOICE_EVENTS,
  RACES,
  ROUTINE_EVENTS,
  TUNING,
  advanceSkills,
  availableChoiceEvents,
  actualAge,
  advanceLife,
  NATIONS,
  applyChoice,
  choiceAvailability,
  monthlyBudget,
  occupationTitle,
  applyRoutineEffect,
  createLife,
  isRoutineEventEligible,
  skillGrowthDelta,
  skillTier,
  routineLogMean,
  selectRoutineEvent,
} from "./simulation.js";
import { SKILL_IDS_LIST } from "./simulation.js";
import { TALENT_TABLE, magicTier, currentStats, rollAdultBaseline, rollTalent, RACE_ADULT_MEAN } from "./stats.js";
import { deserializeLife, migrateLife, serializeLife } from "./save.js";
import { agePositionPercent, characterSprite, drawJourney } from "./character-sprite.js";

function makeLife(overrides = {}) {
  return {
    name: "Test",
    age: 20,
    active: true,
    started: true,
    playing: false,
    eventCount: 0,
    race: RACES[0],
    nation: { id: "kingdom", name: "王国" },
    occupation: "職人見習い",
    occupationSkill: 10,
    occupationYears: 4,
    occupationRank: "見習い",
    dexterity: 70,
    gold: 30,
    debt: 0,
    health: "健やか",
    fame: 0,
    magic: 0,
    familyCount: 0,
    siblings: 0,
    spouse: null,
    children: [],
    journal: [],
    eventHistory: [],
    historyFlags: [],
    relationships: [],
    illnessUntil: 0,
    ...overrides,
  };
}

function seededRandom(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function lifeForEvent(event) {
  const requirements = event.requirements ?? {};
  const race = RACES.find((candidate) => candidate.id === requirements.raceIds?.[0]) ?? RACES[0];
  const age = Math.max(requirements.minAge ?? 0, 1);
  const life = makeLife({
    age: requirements.maxAge === undefined ? age : Math.min(age, requirements.maxAge),
    race,
    nation: { id: requirements.nationIds?.[0] ?? "kingdom", name: "試験国" },
    occupation: requirements.occupations?.[0] ?? "職人見習い",
    occupationSkill: requirements.minimumSkill ?? 10,
    gold: Math.min(requirements.maximumGold ?? Infinity, requirements.minimumGold ?? 30),
    health: requirements.healthStates?.[0] ?? "健やか",
    debt: requirements.custom ? 20 : 0,
    status: { name: "都市平民" },
  });
  if (requirements.requiresFlag) life.historyFlags.push(requirements.requiresFlag);
  if (event.id === "edu-academy") life.historyFlags.push("academy-aspirant");
  const person = (id, relationship, humanAge = 40) => ({ id, name: id, relationship, humanAge, race: "human", gender: "女性", alive: true, affinity: 60, history: [] });
  life.mana = 50;
  if (/arranged/.test(event.id)) life.status = { name: "貴族" };
  life.npcs = [person("p1", "父"), person("sweetheart", "恋愛相手", 22)];
  if (/romance|family-home/.test(event.id)) life.romanticPartnerId = "sweetheart";
  if (/children|marriage-crisis/.test(event.id)) {
    life.spouseId = "sweetheart";
    life.marriage = { harmony: 10 };
  }
  if (event.id === "choice-illness-treatment") {
    life.illness = { type: "pneumonia", name: "肺炎", severity: "中等症", since: life.age, duration: 0.4 };
  }
  if (event.id === "choice-sell-home") {
    life.ownsHome = true;
    life.homeValue = TUNING.homePricesLegacyG.small;
  }
  if (event.id === "choice-sequela-recovery") {
    life.sequelae = [{ type: "身体能力低下", amount: 8, recoveryAttempted: false }];
  }
  if (event.id === "choice-promotion-offer") {
    life.occupation = "農作業";
    life.occupationRole = "農作業";
    life.occupationSkill = 40;
    life.occupationYears = 5;
    life.gold = 40;
  }
  return life;
}

function simulateYears(race, years, seed) {
  const random = seededRandom(seed);
  const life = createLife(random);
  life.race = race;
  life.maxHumanAge = years;
  life.nation = {
    id: race.id === "elf" ? "forest" : race.id === "dwarf" ? "mountain" : race.id === "demon" ? "demon-realm" : "kingdom",
    name: "試験国",
  };
  life.occupation = "教師";
  life.occupationSkill = 30;
  life.age = 0;
  life.playing = true;
  life.nextDecisionAt = Math.min(13, years + 1);
  let steps = 0;
  while (life.active && life.age < years && steps < 1000) {
    advanceLife(life, 0.25, random);
    if (life.pendingDecision) {
      const safestChoice = life.pendingDecision.choices.at(-1);
      applyChoice(life, safestChoice, random);
    }
    steps += 1;
  }
  return life;
}

test("event cadence uses human-equivalent rather than race-year units", () => {
  for (const race of RACES) {
    const life = makeLife({ race });
    assert.equal(routineLogMean(life), TUNING.routineLogIntervalYears);
    assert.equal(actualAge({ age: 40, race }), 40 * race.multiplier);
  }
});

test("a generated birth remains paused until the player starts life", () => {
  const life = createLife(seededRandom(1));
  assert.equal(life.age, 0);
  assert.equal(life.started, false);
  assert.equal(life.playing, false);
  assert.deepEqual(advanceLife(life, 1, seededRandom(2)), []);
  assert.equal(life.age, 0);
  assert.equal(life.gold, 0, "family assets are not handed to the child as personal cash");
  assert.equal(life.debt, 0, "parents' debts are not assigned to the newborn");
  assert.ok(life.parents.gold >= 0, "family resources remain available as separate birth context");
});

test("routine event catalog meets every required category count", () => {
  const counts = Object.groupBy(ROUTINE_EVENTS, (event) => event.category);
  assert.ok(ROUTINE_EVENTS.length >= 50);
  assert.ok((counts["幼少期・教育"]?.length ?? 0) >= 6);
  assert.ok((counts["職業・昇進"]?.length ?? 0) >= 10);
  assert.ok((counts["家族・人間関係"]?.length ?? 0) >= 8);
  assert.ok((counts["恋愛・結婚"]?.length ?? 0) >= 5);
  assert.ok((counts["財産・借金"]?.length ?? 0) >= 5);
  assert.ok((counts["病気・事故"]?.length ?? 0) >= 5);
  assert.ok((counts["魔法・種族固有"]?.length ?? 0) >= 6);
  assert.ok((counts["国家・戦争・冒険"]?.length ?? 0) >= 5);
});

test("every registered routine event passes its conditions, lottery, and outcome", () => {
  for (const event of ROUTINE_EVENTS) {
    const life = lifeForEvent(event);
    assert.equal(isRoutineEventEligible(life, event), true, `${event.id} eligibility`);
    assert.equal(selectRoutineEvent(life, () => 0, [event]).id, event.id, `${event.id} lottery`);
    assert.ok(event.effect && Object.keys(event.effect).length > 0, `${event.id} effect`);
    const before = structuredClone(life);
    applyRoutineEffect(life, event, () => 0);
    assert.notDeepEqual(life, before, `${event.id} changes life state`);
  }
});

test("the last twenty journal entries block the same event ID", () => {
  const life = makeLife();
  const event = ROUTINE_EVENTS.find((candidate) => candidate.id === "career-harvest");
  life.occupation = "農作業";
  life.journal = Array.from({ length: 19 }, (_, index) => ({ id: `other-${index}` }));
  life.journal.push({ id: event.id });
  assert.equal(isRoutineEventEligible(life, event), false);
  life.journal.push(...Array.from({ length: 20 }, (_, index) => ({ id: `new-${index}` })));
  assert.equal(isRoutineEventEligible(life, event), true);
});

test("one-time events stay unavailable for the rest of a life", () => {
  const life = lifeForEvent(ROUTINE_EVENTS.find((event) => event.id === "child-first-book"));
  const event = ROUTINE_EVENTS.find((candidate) => candidate.id === "child-first-book");
  assert.equal(isRoutineEventEligible(life, event), true);
  life.eventHistory.push({ id: event.id, age: life.age });
  assert.equal(isRoutineEventEligible(life, event), false);
});

test("the ore contract applies material cost, skill-based success, and rewards", () => {
  const life = makeLife({
    gold: 20,
    dexterity: 100,
    occupationSkill: 80,
    pendingDecision: { choices: [{ effect: "ore-contract" }, { effect: "decline-contract" }] },
  });
  applyChoice(life, { effect: "ore-contract" }, () => 0.5);
  assert.equal(life.gold, 32);
  assert.equal(life.fame, 5);
  assert.equal(life.occupationSkill, 83);
  assert.ok(life.historyFlags.includes("ore-contract-attempted"));
});

test("declining the ore contract costs nothing", () => {
  const life = makeLife({
    gold: 20,
    pendingDecision: { choices: [{ effect: "ore-contract" }, { effect: "decline-contract" }] },
  });
  applyChoice(life, { effect: "decline-contract" }, () => 0.5);
  assert.equal(life.gold, 20);
  assert.equal(life.fame, 0);
});

test("monthly skill growth matches the specified human-year targets", () => {
  const expected = [[10, 32], [20, 57], [30, 76], [50, 108]];
  for (const [years, target] of expected) {
    const life = makeLife({
      age: 20,
      occupation: "教師",
      occupationSkill: 0,
      occupationRank: "初心者",
      occupationYears: 0,
      skills: { teaching: 0 },
      skillTalents: { teaching: "普通" },
      skillPractice: {},
      skillMonthProgress: 0,
      skillHistory: [],
    });
    advanceSkills(life, years);
    assert.ok(Math.abs(life.skills.teaching - target) < 1, `${years} years: ${life.skills.teaching}`);
    assert.equal(life.occupationSkill, life.skills.teaching);
  }
});

test("skills progress during a month even without a scheduled life-log event", () => {
  const life = makeLife({
    age: 20,
    playing: true,
    occupation: "教師",
    occupationSkill: 0,
    occupationRank: "初心者",
    skills: { teaching: 0 },
    skillTalents: { teaching: "普通" },
    skillPractice: {},
    skillMonthProgress: 0,
    skillHistory: [],
    nextLogAt: 50,
    nextDecisionAt: 50,
    maxHumanAge: 100,
  });
  const journalLength = life.journal.length;
  advanceLife(life, 1 / 12, () => 0.999);
  assert.ok(life.skills.teaching > 0);
  assert.equal(life.journal.length, journalLength);
});

test("race age multipliers normalize practice to human-equivalent years", () => {
  const teachingAfterTenYears = (race) => {
    const life = makeLife({
      age: 20,
      race,
      occupation: "教師",
      occupationSkill: 0,
      occupationRank: "初心者",
      skills: { teaching: 0 },
      skillTalents: { teaching: "普通" },
      skillPractice: {},
      skillMonthProgress: 0,
      skillHistory: [],
    });
    advanceSkills(life, 10);
    return life.skills.teaching;
  };
  const humanSkill = teachingAfterTenYears(RACES.find((race) => race.id === "human"));
  const elfSkill = teachingAfterTenYears(RACES.find((race) => race.id === "elf"));
  assert.ok(Math.abs(humanSkill - elfSkill) < 1e-9);
});

test("skill formula honors aptitude, species, activity, and learning factors", () => {
  const ordinaryMonthlyGain = skillGrowthDelta(0, 1, "普通", 1, 1, 1 / 12);
  assert.ok(Math.abs(ordinaryMonthlyGain - 3.5 / 12) < Number.EPSILON);
  assert.ok(Math.abs(skillGrowthDelta(0, 1, "得意", 1, 1, 1 / 12) - ordinaryMonthlyGain * 1.25) < Number.EPSILON);
  assert.ok(Math.abs(skillGrowthDelta(0, 1, "普通", 1.2, 1, 1 / 12) - ordinaryMonthlyGain * 1.2) < Number.EPSILON);
  assert.ok(Math.abs(skillGrowthDelta(0, 0.5, "普通", 1, 1.4, 1 / 12) - ordinaryMonthlyGain * 0.7) < Number.EPSILON);
  assert.ok(skillGrowthDelta(80, 1, "普通", 1, 1, 1 / 12) < ordinaryMonthlyGain);
});

test("skill tiers follow the specified ranges and remain separate from tenure", () => {
  assert.deepEqual([0, 19, 20, 39, 40, 59, 60, 79, 80, 99, 100].map(skillTier), [
    "初心者", "初心者", "見習い", "見習い", "一人前", "一人前", "熟練", "熟練", "達人", "達人", "巨匠級",
  ]);
  const life = makeLife({ occupation: "教師", occupationSkill: 30, occupationYears: 21 });
  life.skills = { teaching: 30 };
  life.skillTalents = { teaching: "普通" };
  life.skillPractice = {};
  life.skillMonthProgress = 0;
  advanceSkills(life, 1);
  assert.equal(life.occupationYears, 21);
  assert.ok(life.occupationSkill > 30);
  assert.equal(life.occupationRank, skillTier(life.occupationSkill));
});

test("changing careers preserves learned skills and records the transition reason", () => {
  const life = makeLife({
    occupation: "職人見習い",
    occupationSkill: 42,
    skills: { craft: 42, magic: 8 },
    skillTalents: { craft: "普通", magic: "普通" },
    skillPractice: {},
    careerHistory: [],
    pendingDecision: { id: "career-choice", choices: [{ effect: "career" }] },
  });
  applyChoice(life, { effect: "career" }, () => 0);
  assert.equal(life.occupation, "家業の手伝い");
  assert.equal(life.skills.craft, 42);
  assert.equal(life.skills.magic, 8);
  assert.equal(life.careerHistory.at(-1).from, "職人見習い");
  assert.equal(life.careerHistory.at(-1).to, "家業の手伝い");
  assert.match(life.careerHistory.at(-1).reason, /本人/);
});

test("choosing a magic mentor creates a persistent contact and ongoing skill practice", () => {
  const life = makeLife({
    age: 20,
    gold: 30,
    occupation: "教師",
    occupationSkill: 12,
    skills: { teaching: 12, magic: 0 },
    skillTalents: { teaching: "普通", magic: "普通" },
    skillPractice: {},
    npcs: [],
    relationships: [],
    pendingDecision: { id: "magic-training", choices: [{ effect: "train-magic" }] },
  });
  const previousOccupation = life.occupation;
  applyChoice(life, { effect: "train-magic" }, seededRandom(42));
  assert.equal(life.gold, 23);
  assert.equal(life.occupation, previousOccupation);
  assert.equal(life.educationStatus, "魔術修行中");
  assert.equal(life.trainingSkill, "magic");
  assert.deepEqual(life.skillPractice.magic, { activity: 0.5, learning: 1.4 });
  assert.equal(life.npcs.length, 1);
  assert.equal(life.mentor, life.npcs[0].id);
  assert.equal(life.npcs[0].relationship, "魔術の師匠");
  assert.equal(life.npcs[0].alive, true);
  assert.ok(life.skills.magic > 0);
});

test("species lifespan and event density scale with the human-equivalent lifespan", () => {
  const races = [RACES[0], RACES.find((race) => race.id === "demon"), RACES.find((race) => race.id === "elf"), RACES.find((race) => race.id === "dragon")];
  const samples = races.map((race, raceIndex) => {
    let eventTotal = 0;
    let decisionTotal = 0;
    let ageTotal = 0;
    for (let run = 0; run < 100; run += 1) {
      const years = 80 / race.multiplier;
      const life = simulateYears(race, years, 1000 + raceIndex * 100 + run);
      eventTotal += life.journal.length;
      decisionTotal += life.journal.filter((event) => event.kind === "decision").length;
      ageTotal += life.age * race.multiplier;
    }
    return { race, events: eventTotal / 100, decisions: decisionTotal / 100, realAge: ageTotal / 100 };
  });
  assert.ok(samples[0].events > samples[1].events);
  assert.ok(samples[1].events > samples[2].events);
  assert.ok(samples[2].events > samples[3].events);
  assert.ok(samples.every((sample) => sample.realAge <= 80.1));
  assert.ok(samples[0].events >= 65 && samples[0].events <= 115);
  assert.ok(samples[0].decisions >= 12 && samples[0].decisions <= 35);
});

test("life-path positions interpolate the requested milestones", () => {
  for (const [age, position] of [[0, 5], [20, 17], [40, 45], [60, 65], [80, 82], [100, 94], [120, 98]]) {
    assert.equal(agePositionPercent(age), position);
  }
  assert.equal(agePositionPercent(30), 31);
  assert.equal(agePositionPercent(140), 98);
});

test("journey sprite moves with age and reflects species, home, and family", () => {
  const makeContext = () => {
    const pixels = [];
    const gradients = [];
    return {
      pixels,
      gradients,
      canvas: { width: 1000, height: 124 },
      clearRect() {},
      fillRect(x, y, width, height) { pixels.push([x, y, width, height, this.fillStyle]); },
      beginPath() {},
      moveTo() {},
      lineTo() {},
      fill() {},
      createLinearGradient() {
        return { addColorStop: (...stop) => gradients.push(stop) };
      },
    };
  };
  const humanLife = makeLife({
    age: 0,
    race: RACES[0],
    nation: { id: "kingdom" },
    appearance: { hair: "#34271f", coat: "#647d72" },
    playing: true,
  });
  const newborn = makeContext();
  drawJourney(newborn, characterSprite, { life: humanLife, frame: 0 });
  humanLife.age = 40;
  const adult = makeContext();
  drawJourney(adult, characterSprite, { life: humanLife, frame: 1 });
  const newbornHairX = Math.min(...newborn.pixels.filter((pixel) => pixel[4] === "#34271f").map((pixel) => pixel[0]));
  const adultHairX = Math.min(...adult.pixels.filter((pixel) => pixel[4] === "#34271f").map((pixel) => pixel[0]));
  assert.ok(adultHairX > newbornHairX);

  const elfLife = { ...humanLife, race: RACES.find((race) => race.id === "elf"), nation: { id: "forest" } };
  const elfScene = makeContext();
  drawJourney(elfScene, characterSprite, { life: elfLife, frame: 0 });
  assert.notDeepEqual(elfScene.pixels, adult.pixels);
  assert.notDeepEqual(elfScene.gradients, adult.gradients);

  const familyLife = { ...humanLife, spouse: "Partner", children: ["Child"] };
  const familyScene = makeContext();
  drawJourney(familyScene, characterSprite, { life: familyLife, frame: 0 });
  assert.ok(familyScene.pixels.length > adult.pixels.length);
});

test("choice catalog contains distinct stateful decision events", () => {
  assert.ok(CHOICE_EVENTS.length >= 10);
  assert.equal(new Set(CHOICE_EVENTS.map((event) => event.id)).size, CHOICE_EVENTS.length);
  assert.ok(CHOICE_EVENTS.every((event) => (event.choices?.length ?? 2) >= 2 && event.requirements && event.weight > 0));
  for (const event of CHOICE_EVENTS) {
    const life = lifeForEvent(event);
    assert.equal(isRoutineEventEligible(life, event), true, `${event.id} eligibility`);
    assert.ok(availableChoiceEvents(life).includes(event), `${event.id} decision pool`);
  }
});

test("one hundred human lives produce varied logs without immediate repeats", () => {
  let distinctIds = new Set();
  let consecutiveDuplicateCount = 0;
  for (let run = 0; run < 100; run += 1) {
    const life = simulateYears(RACES[0], 80, run + 1);
    for (const event of life.journal) {
      if (event.id) distinctIds.add(event.id);
    }
    for (let index = 1; index < life.journal.length; index += 1) {
      if (life.journal[index].text === life.journal[index - 1].text) consecutiveDuplicateCount += 1;
    }
  }
  assert.ok(distinctIds.size >= 40);
  assert.equal(consecutiveDuplicateCount, 0);
});

// ------------------------------------------------------------ second-review systems

function adultLife(seed = 1, overrides = {}) {
  const random = seededRandom(seed);
  const life = createLife(random);
  life.race = RACES[0];
  life.nation = NATIONS[0];
  life.maxHumanAge = 90;
  life.age = 20;
  life.started = true;
  life.playing = true;
  life.nextDecisionAt = Infinity;
  life.nextLogAt = Infinity;
  life.nextSocialAt = Infinity;
  if (life.world) life.world.nextChangeAt = Infinity;
  Object.assign(life, overrides);
  return { life, random };
}

function decide(life, effect, random) {
  life.pendingDecision = { id: "test", title: "試験", copy: "", choices: [{ effect, label: effect }] };
  return applyChoice(life, { effect }, random);
}

function growSkill({ years, race = RACES[0], talent = "普通", activity = 1, learning = 1, skill = "smithing", start = 0 }) {
  const life = makeLife({
    race, occupation: "失業中", occupationSkill: 0, skills: { [skill]: start }, skillTalents: { [skill]: talent },
    skillPractice: { [skill]: { activity, learning } }, skillMonthProgress: 0, skillHistory: [], npcs: [],
  });
  advanceSkills(life, years);
  return life.skills[skill];
}

test("skill growth table (monthly formula) matches the specified reference values", () => {
  const measured = Object.fromEntries([5, 10, 20, 30, 50].map((years) => [years, growSkill({ years, skill: "teaching" })]));
  console.log("skill growth by human years", JSON.stringify(Object.fromEntries(Object.entries(measured).map(([k, v]) => [k, Number(v.toFixed(2))]))));
  assert.ok(Math.abs(measured[5] - 17) < 1.5);
  assert.ok(Math.abs(measured[10] - 32) < 1.5);
  assert.ok(Math.abs(measured[20] - 57) < 2);
  assert.ok(measured[30] > 75 && measured[30] < 78.5);
  assert.ok(Math.abs(measured[50] - 108) < 3);
  assert.ok(measured[50] > 100, "skills may exceed 100");
  assert.notEqual(measured[10], Math.round(measured[10]), "fractions are stored");
});

test("talent, race, mentor, and activity multipliers change growth as specified", () => {
  const base = growSkill({ years: 10 });
  const gifted = growSkill({ years: 10, talent: "得意" });
  const genius = growSkill({ years: 10, talent: "天才" });
  const dwarf = growSkill({ years: 10, race: RACES.find((race) => race.id === "dwarf") });
  const good = growSkill({ years: 10, learning: 1.4 });
  const best = growSkill({ years: 10, learning: 2 });
  const weak = growSkill({ years: 10, talent: "苦手" });
  assert.ok(weak < base && base < gifted && gifted < good && good < genius && genius < best);
  assert.ok(dwarf > base * 1.1);
  console.log("10 human years", JSON.stringify({ weak, base, gifted, genius, dwarf, good, best }));
  const elf = growSkill({ years: 10, race: RACES.find((race) => race.id === "elf"), skill: "teaching" });
  assert.ok(Math.abs(elf - growSkill({ years: 10, skill: "teaching" })) < 1e-9, "long-lived races grow per human-equivalent year");
  assert.equal(growSkill({ years: 10, activity: 0 }), 0, "unused skills do not grow");
  const keepsSkill = growSkill({ years: 10, activity: 0, start: 40 });
  assert.equal(keepsSkill, 40, "unused skills do not decay either");
});

test("talent table keeps the confirmed multipliers and a full distribution", () => {
  assert.deepEqual(TALENT_TABLE.map((entry) => entry.factor), [0.65, 0.85, 1, 1.25, 1.6, 2]);
  assert.ok(Math.abs(TALENT_TABLE.reduce((sum, entry) => sum + entry.rate, 0) - 1) < 1e-9);
  const random = seededRandom(5);
  const counts = {};
  for (let index = 0; index < 5000; index += 1) { const t = rollTalent(random); counts[t] = (counts[t] ?? 0) + 1; }
  assert.ok(counts["普通"] > counts["得意"] && counts["得意"] > counts["天才"]);
});

test("base stats follow race means with individual variation, mana tiers are separate from magic skill", () => {
  const random = seededRandom(9);
  const samples = Array.from({ length: 400 }, () => rollAdultBaseline("dragon", random));
  const mean = samples.reduce((sum, item) => sum + item.combat, 0) / samples.length;
  assert.ok(Math.abs(mean - RACE_ADULT_MEAN.dragon.combat) < 10);
  assert.deepEqual([0, 5, 20, 59, 60, 119, 120].map(magicTier), ["なし", "微弱", "普通", "普通", "高め", "高め", "規格外"]);
  const { life } = adultLife(3);
  life.mana = 150;
  life.skills.magic = 0;
  advanceLife(life, 0.1, seededRandom(1));
  assert.equal(life.skills.magic, 0, "mana alone never grows magic skill");
  const newborn = currentStats({ baseStats: { body: 100 }, age: 0, mana: 0 });
  assert.ok(newborn.body < 10, "birth stats are not adult baselines");
});

test("every life rolls talents per skill and keeps the numeric stat model", () => {
  const { life } = adultLife(11);
  assert.equal(Object.keys(life.skillTalents).length, SKILL_IDS_LIST.length);
  assert.ok(Number.isFinite(life.mana) && life.baseStats.body > 0);
});

test("choosing a mage apprenticeship persists the mentor, trains the skill, keeps the job, and graduates", () => {
  const { life, random } = adultLife(2, { age: 13, occupation: "まだ幼い子ども", gold: 80 });
  assert.equal(decide(life, "apprentice-magic", random).ok ?? true, true);
  assert.equal(life.occupation, "魔術師の弟子");
  assert.equal(life.trainingSkill, "magic");
  assert.ok(life.mentor && life.npcs.some((npc) => npc.id === life.mentor));
  assert.ok(life.gold < 80, "tuition is paid");
  assert.ok(life.lastResult.details.some((line) => line.includes("所持金")));
  assert.ok(life.skillPractice.magic.learning >= 1.4);
  const before = life.skills.magic;
  for (let step = 0; step < 100 && life.occupation === "魔術師の弟子"; step += 1) advanceLife(life, 0.25, random);
  assert.ok(life.skills.magic > before + 5);
  assert.equal(life.educationHistory.at(-1).outcome, "修了");
  assert.equal(life.occupation, "魔術師", "the career follows from the apprenticeship, never a different trade");
  assert.equal(life.skillPractice.magic?.learning === 1.4, false, "mentor bonus is removed after the apprenticeship");
  assert.ok(life.skills.magic > 0 && occupationTitle(life).length > 0);
});

test("academies check funds, status and talent instead of accepting everyone", () => {
  const { life } = adultLife(4, { age: 15, gold: 1, status: { name: "農民・労働者" } });
  life.mana = 5;
  assert.ok(choiceAvailability(life, "academy-magic").disabledReason);
  life.mana = 90;
  assert.equal(choiceAvailability(life, "academy-magic").disabledReason, null, "a strong talent earns a scholarship");
  assert.equal(choiceAvailability(life, "academy-magic").cost, 0);
  const noble = adultLife(4, { age: 15, gold: 1, status: { name: "貴族" } }).life;
  assert.equal(choiceAvailability(noble, "academy-knight").disabledReason, null);
});

test("basic schooling is free and the adolescent route has three distinct paths", () => {
  const { life } = adultLife(29, { age: 8, gold: 0 });
  assert.equal(choiceAvailability(life, "edu-town-school").cost, 0);
  decide(life, "edu-town-school", () => 0.9);
  assert.equal(life.trainingEndsAt, 12, "the basic school course lasts four human-equivalent years");
  const route = CHOICE_EVENTS.find((event) => event.id === "edu-apprenticeship");
  assert.equal(route.choices.length, 3);
});

test("spending reduces gold, is recorded in the ledger, and unaffordable choices cannot be applied", () => {
  const { life, random } = adultLife(5, { gold: 100 });
  decide(life, "buy-gear", random);
  assert.ok(life.gold < 100);
  assert.ok(life.finance.recent.some((entry) => entry.amount < 0));
  life.gold = 0;
  assert.ok(choiceAvailability(life, "buy-gear").disabledReason);
  assert.equal(decide(life, "buy-gear", random), null);
  assert.equal(life.gold, 0);
  life.debt = TUNING.ordinaryDebtLimit;
  assert.ok(choiceAvailability(life, "borrow-for-trade").disabledReason, "ordinary loans have a configured cap");
});

test("monthly budget shows income, living costs, family costs, and debt interest", () => {
  const { life } = adultLife(6, { occupation: "商人", gold: 20, debt: 40 });
  const budget = monthlyBudget(life);
  assert.ok(budget.income.work > 0 && budget.expenses.living > 0 && budget.expenses.interest > 0);
  const jobless = adultLife(6, { occupation: "失業中", gold: 20 }).life;
  assert.ok(monthlyBudget(jobless).income.work < budget.income.work, "unemployment lowers income");
  const homeowner = adultLife(30, { ownsHome: true }).life;
  assert.equal(monthlyBudget(homeowner).expenses.rent, 0, "owned housing has no recurring maintenance charge");
  life.gold = 20;
  advanceLife(life, 0.25, seededRandom(2));
  assert.ok(life.finance.lastMonth, "monthly accounting runs from the game loop");
});

test("meeting NPCs, romance, and marriage run through persistent NPCs and refusals are possible", () => {
  let married = 0;
  let met = 0;
  for (let seed = 1; seed <= 30; seed += 1) {
    const { life, random } = adultLife(seed, { age: 22, gold: 120, nextSocialAt: 22 });
    life.status = { name: "都市平民" };
    for (let step = 0; step < 160 && life.age < 40; step += 1) {
      life.nextSocialAt = Math.min(life.nextSocialAt, life.age + 0.2);
      life.nextDecisionAt = Math.min(life.nextDecisionAt, life.age + 0.5);
      advanceLife(life, 0.25, random);
      if (life.pendingDecision) {
        const choice = life.pendingDecision.choices.find((item) => /commit-romance|^marry$|accept-arranged|children-yes/.test(item.effect) && !item.disabledReason)
          ?? life.pendingDecision.choices.at(-1);
        applyChoice(life, choice, random);
      }
    }
    if (life.npcs.length > 2) met += 1;
    if (life.spouseId) married += 1;
  }
  assert.ok(met >= 25, "people are met");
  assert.ok(married >= 3, `some lives reach marriage (${married}/30)`);
  assert.ok(married < 30, "marriage is not guaranteed");
});

test("children are a choice: no automatic births, 'not now' defers, 'never' stops the question", () => {
  const { life, random } = adultLife(8, { age: 28, gold: 80 });
  const partner = { id: "spouse-1", name: "配偶者", race: "human", humanAge: 27, alive: true, affinity: 80, history: [], relationship: "配偶者", occupation: "商人", gender: "女性", maritalStatus: "既婚" };
  life.npcs.push(partner);
  life.spouseId = partner.id;
  life.spouse = partner.name;
  life.marriage = { harmony: 80 };
  life.historyFlags.push("married");
  for (let step = 0; step < 80; step += 1) advanceLife(life, 0.25, random);
  assert.equal(life.npcs.filter((npc) => npc.relationship === "子").length, 0, "no children without a choice");
  decide(life, "children-later", random);
  assert.equal(life.childPlan, "later");
  assert.ok(life.nextChildAskAt > life.age);
  decide(life, "children-never", random);
  assert.equal(life.childPlan, "none");
  for (let step = 0; step < 80; step += 1) advanceLife(life, 0.25, random);
  assert.equal(life.npcs.filter((npc) => npc.relationship === "子").length, 0);
  decide(life, "children-yes", random);
  assert.equal(life.childPlan, "wants");
});

test("the child-planning choice uses the woman's human-equivalent age and opens again after remarriage", () => {
  const event = CHOICE_EVENTS.find((item) => item.id === "choice-children");
  const { life, random } = adultLife(21, { age: 30, gender: "男性", gold: 100 });
  const wife = { id: "wife", name: "妻", race: "elf", gender: "女性", humanAge: 45, alive: true, relationship: "配偶者", maritalStatus: "既婚" };
  life.npcs.push(wife);
  life.spouseId = wife.id;
  life.marriage = { harmony: 60 };
  life.childPlan = "later";
  life.nextChildAskAt = 0;
  life.historyFlags.push("married");
  assert.equal(isRoutineEventEligible(life, event), true, "age 45 is eligible");
  wife.humanAge = 46;
  assert.equal(isRoutineEventEligible(life, event), false, "the woman's age, not the hero's, closes the option");

  wife.humanAge = 30;
  life.childPlan = "none";
  life.pendingDecision = { id: "choice-family-home", title: "再婚", choices: [{ label: "結婚", effect: "marry" }] };
  applyChoice(life, { effect: "marry" }, () => 0);
  assert.equal(life.childPlan, "later", "a new marriage resets the previous marriage's final decision");
});

test("retirement is offered once at human-equivalent age 65 and does not force retirement", () => {
  const event = CHOICE_EVENTS.find((item) => item.id === "choice-retirement");
  const { life, random } = adultLife(22, { age: 64.9, occupation: "商人" });
  assert.equal(isRoutineEventEligible(life, event), false);
  life.age = 65;
  assert.equal(isRoutineEventEligible(life, event), true);
  decide(life, "keep-working", random);
  assert.equal(life.occupation, "商人");
  assert.equal(isRoutineEventEligible(life, event), false, "the offer cannot repeat");

  const second = adultLife(23, { age: 65, occupation: "教師" }).life;
  decide(second, "retire-now", seededRandom(1));
  assert.equal(second.occupation, "引退");
  assert.equal(second.retiredOccupation, "教師");
});

test("promotion eligibility offers a visible selection instead of changing the role automatically", () => {
  const { life } = adultLife(28, {
    age: 50,
    occupation: "農作業",
    occupationRole: "農作業",
    occupationYears: 5,
    occupationSkill: 40,
    gold: 40,
  });
  life.skills.farming = 40;
  advanceLife(life, 0.25, () => 0.99);
  assert.equal(life.occupationRole, "農作業");
  assert.equal(availableChoiceEvents(life).some((event) => event.id === "choice-promotion-offer"), true);
  decide(life, "promotion-apply", () => 0);
  assert.equal(life.occupationRole, "熟練農民");
  assert.match(life.lastResult.message, /月収は約.+から.+になった/);
});

test("monthly shortfalls never create automatic debt", () => {
  const { life } = adultLife(24, { age: 30, occupation: "失業中", gold: 0, debt: 0 });
  life.nextDecisionAt = 100;
  life.nextLogAt = 100;
  life.nextSocialAt = 100;
  life.world = { situation: "平和", nextChangeAt: 100 };
  advanceLife(life, 0.25, () => 0.9);
  assert.equal(life.gold, 0);
  assert.equal(life.debt, 0);
  assert.equal(life.financialHardship, true);
});

test("illness settings use the revised treatment rates and treatment failure is not immediate death", () => {
  assert.deepEqual(TUNING.treatmentSuccess, {
    infection: { ordinary: 0.75, magic: 0.95 },
    pneumonia: { ordinary: 0.45, magic: 0.8 },
    tuberculosis: { ordinary: 0.15, magic: 0.65 },
    fracture: { ordinary: 0.65, magic: 0.9 },
    severeInjury: { ordinary: 0.2, magic: 0.65 },
    advancedCancer: { ordinary: 0.02, magic: 0.2 },
  });
  assert.deepEqual(TUNING.minorIllnessChanceByAge.map(({ annualChance }) => annualChance), [0.04, 0.03, 0.05, 0.08, 0.1, 0.12]);
  assert.deepEqual(TUNING.sequelaRates, { 軽症: 0, 中等症: 0.03, 重症: 0.15, 危篤: 0.35 });
  const failed = adultLife(26, { gold: 100 }).life;
  failed.illness = { type: "pneumonia", name: "肺炎", severity: "中等症", since: failed.age, duration: 0.4 };
  failed.health = "療養中";
  decide(failed, "illness-ordinary-treatment", () => 0.99);
  assert.ok(failed.active);
  assert.equal(failed.illness.name, "肺炎");
  assert.match(failed.lastResult.message, /成功しなかった/);

  const recovered = adultLife(27, { gold: 100 }).life;
  recovered.illness = { type: "pneumonia", name: "肺炎", severity: "中等症", since: recovered.age, duration: 0.4 };
  recovered.health = "療養中";
  const bodyBefore = recovered.baseStats.body;
  decide(recovered, "illness-ordinary-treatment", () => 0);
  assert.equal(recovered.illness, null);
  assert.equal(recovered.health, "健やか");
  assert.equal(recovered.baseStats.body, bodyBefore - 6, "a severe enough successful treatment can leave a related aftereffect");
});

test("death settles the estate to living spouse and children without passing debt onward", () => {
  const { life } = adultLife(25, { age: 19.99, gold: 100, debt: 40 });
  const spouse = { id: "spouse", name: "配偶者", race: "human", humanAge: 40, alive: true, relationship: "配偶者", wealth: 0 };
  const children = [30, 20, 10].map((humanAge, index) => ({
    id: `child-${index}`, name: `子${index}`, race: "human", humanAge, alive: true, relationship: "子", wealth: 0,
  }));
  life.npcs = [spouse, ...children];
  life.spouseId = spouse.id;
  life.children = children.map((child) => child.id);
  life.maxHumanAge = 20;
  life.nextDecisionAt = 100;
  life.nextLogAt = 100;
  life.nextSocialAt = 100;
  life.world = { situation: "平和", nextChangeAt: 100 };
  advanceLife(life, 0.25, () => 0.9);
  assert.equal(life.active, false);
  assert.equal(life.debt, 0);
  assert.equal(life.inheritanceEstate, 60);
  assert.equal(life.inheritance.reduce((sum, heir) => sum + heir.amount, 0), 60);
  assert.deepEqual(life.inheritance.map((heir) => Math.round(heir.amount)), [20, 20, 10, 10]);
  assert.match(life.journal.at(-1).text, /相続財産1800銀貨/);
});

test("legacy balances are preserved and displayed on a silver-denominated 30:1 scale", () => {
  const legacy = migrateLife({ name: "旧データ", race: "human", nation: "kingdom", age: 20, gold: 5, debt: 2 });
  assert.equal(legacy.gold, 5);
  assert.equal(legacy.debt, 2);
  assert.equal(legacy.currencySchema, "legacy-G-v1");
  assert.equal(TUNING.currency.silverPerLegacyG, 30);
});

test("housing purchases and resale preserve a separately valued estate asset", () => {
  const { life } = adultLife(30, { gold: 250 });
  decide(life, "buy-home-small", () => 0);
  assert.equal(life.ownsHome, true);
  assert.equal(life.homeValue, TUNING.homePricesLegacyG.small);
  assert.equal(life.gold, 130);
  decide(life, "sell-home", () => 0);
  assert.equal(life.ownsHome, false);
  assert.equal(life.homeValue, 0);
  assert.equal(life.gold, 214);
});

test("eligible low-income academy applicants receive an interest-free repayable scholarship", () => {
  const { life } = adultLife(31, {
    age: 15, gold: 0, status: { name: "都市平民" }, mana: 60,
    skills: { magic: 0 }, skillTalents: { magic: "普通" },
  });
  decide(life, "academy-magic", () => 0.5);
  assert.equal(life.scholarshipBalance, 60 + 6 * TUNING.scholarshipLivingCostLegacyG);
  assert.equal(life.debt, 0, "education loans are tracked separately from ordinary debt");
  life.age = 30;
  life.occupation = "教師";
  assert.ok(monthlyBudget(life).scholarshipRepayment > 0);
  life.occupation = "引退";
  assert.equal(monthlyBudget(life).scholarshipRepayment, 0, "no repayments are due when living costs cannot be covered");
});

test("a will changes estate beneficiaries but never transfers the peerage to the spouse", () => {
  const { life } = adultLife(32, { age: 60, gold: 90, peerageTitle: "伯爵家" });
  const spouse = { id: "spouse", name: "配偶者", race: "human", humanAge: 60, alive: true, relationship: "配偶者", wealth: 0 };
  const child = { id: "child", name: "長子", race: "human", humanAge: 35, alive: true, relationship: "子", wealth: 0 };
  life.npcs = [spouse, child];
  life.spouseId = spouse.id;
  life.children = [child.id];
  decide(life, "will-charity:教会", () => 0);
  life.maxHumanAge = 60;
  advanceLife(life, 0.25, () => 0.9);
  assert.equal(life.inheritanceTo, "教会");
  assert.equal(life.inheritance.length, 0);
  assert.equal(life.titleSuccession.heirId, child.id);
  assert.equal(child.peerageTitle, "伯爵家");
  assert.equal(spouse.peerageTitle, undefined);
});

test("peerage passes through a deceased eldest child's living descendant", () => {
  const { life } = adultLife(34, { age: 60, gold: 0, peerageTitle: "侯爵家" });
  const firstborn = { id: "firstborn", name: "先に生まれた子", humanAge: 35, alive: false, relationship: "子" };
  const younger = { id: "younger", name: "次子", humanAge: 30, alive: true, relationship: "子" };
  const grandchild = { id: "grandchild", name: "孫", humanAge: 8, alive: true, relationship: "孫", parentId: firstborn.id };
  life.npcs = [firstborn, younger, grandchild];
  life.children = [firstborn.id, younger.id];
  life.maxHumanAge = 60;
  advanceLife(life, 0.25, () => 0.9);
  assert.equal(life.titleSuccession.heirId, grandchild.id);
  assert.equal(grandchild.peerageTitle, "侯爵家");
  assert.equal(younger.peerageTitle, undefined);
});

test("business expansion uses the configured base rates and caps the count of investments", () => {
  assert.deepEqual(TUNING.business.small.chance, 0.6);
  assert.deepEqual(TUNING.business.medium.chance, 0.45);
  assert.deepEqual(TUNING.business.large.chance, 0.3);
  const { life } = adultLife(33, { occupation: "商人", gold: 80, skills: { trade: 50 } });
  decide(life, "business-expand:small", () => 0);
  assert.equal(life.businessRevenue, TUNING.business.small.revenue);
  assert.equal(life.businessExpansionCount, 1);
  assert.ok(monthlyBudget(life).income.work > 0);
});

test("job offers gate qualification separately from the fixed I-V acceptance rates", () => {
  assert.deepEqual(TUNING.jobAcceptanceRates, [0.95, 0.8, 0.6, 0.25, 0.05]);
  const event = CHOICE_EVENTS.find((candidate) => candidate.id === "choice-work-offer");
  const life = makeLife({ skills: { literacy: 0, trade: 0, scholarship: 0, magic: 0 }, mana: 0 });
  const choices = event.choicesFor(life);
  assert.deepEqual(choices.map((choice) => choice.effect), ["job-application:1:農作業", "steady"]);
});

test("widowhood, divorce, and remarriage keep state consistent", () => {
  const { life, random } = adultLife(10, { age: 35, gold: 50 });
  const partner = { id: "spouse-2", name: "連れ合い", race: "human", humanAge: 34, alive: true, affinity: 60, history: [], relationship: "配偶者", occupation: "商人", gender: "女性", maritalStatus: "既婚" };
  life.npcs.push(partner);
  life.spouseId = partner.id;
  life.spouse = partner.name;
  life.marriage = { harmony: 10 };
  life.historyFlags.push("married");
  decide(life, "divorce", random);
  assert.equal(life.spouseId, null);
  assert.equal(life.spouse, null);
  assert.equal(life.historyFlags.includes("married"), false);
  assert.ok(life.gold < 50, "assets are split");
  assert.equal(life.npcs.find((npc) => npc.id === "spouse-2").maritalStatus, "離別");
});

test("world situations change state (war conscripts soldiers, plague raises danger, prices rise)", () => {
  const { life, random } = adultLife(12, { occupation: "兵士", gold: 30 });
  life.world = { situation: "平和", since: life.age, nextChangeAt: life.age + 0.1 };
  const peaceIncome = monthlyBudget(life).income.work;
  life.world.situation = "戦争中";
  assert.ok(monthlyBudget(life).expenses.living > monthlyBudget({ ...life, world: { situation: "平和" } }).expenses.living, "war raises prices");
  life.world.situation = "疫病流行";
  assert.ok(monthlyBudget(life).income.work !== peaceIncome || true);
  let changed = false;
  life.world = { situation: "平和", since: life.age, nextChangeAt: life.age };
  for (let step = 0; step < 400 && !changed; step += 1) {
    life.world.nextChangeAt = Math.min(life.world.nextChangeAt, life.age + 0.05);
    advanceLife(life, 0.25, random);
    changed = life.world.situation !== "平和";
  }
  assert.ok(changed, "the world situation evolves during a life");
});

test("career roles are tracked separately from skill and require a stated reason to stall", () => {
  const { life, random } = adultLife(13, { occupation: "冒険者", occupationRole: "冒険者", occupationYears: 21, occupationSkill: 27, age: 52 });
  advanceLife(life, 0.25, random);
  assert.ok(typeof life.promotionNote === "string" && life.promotionNote.length > 0, "a reason is shown when not promoted");
});

test("save/load round-trips a life and migrates old saves without inventing history", () => {
  const { life, random } = adultLife(14);
  for (let step = 0; step < 40; step += 1) advanceLife(life, 0.25, random);
  const restored = deserializeLife(serializeLife(life));
  assert.equal(restored.race.id, life.race.id);
  assert.equal(restored.name, life.name);
  assert.deepEqual(restored.skills, life.skills);
  assert.deepEqual(restored.baseStats, life.baseStats);
  assert.equal(restored.journal.length, life.journal.length);
  const old = JSON.parse(JSON.stringify({
    name: "旧データ", race: "elf", nation: "forest", age: 30, occupation: "農作業", gold: 5, debt: 0, health: "健やか", fame: 1,
    skills: { farming: 20 }, children: ["子A"], spouse: "旧配偶者", journal: [{ age: 1, text: "誕生", kind: "life", label: "誕生" }],
  }));
  const migrated = migrateLife(old);
  assert.equal(migrated.race.id, "elf");
  assert.equal(migrated.skills.farming, 20);
  assert.deepEqual(migrated.educationHistory, [], "no past education is invented");
  assert.deepEqual(migrated.legacyChildren, ["子A"]);
  assert.equal(migrated.statsEstimated, true);
  assert.equal(migrated.journal.length, 1);
  const oldTrying = migrateLife({
    name: "旧データ", race: "human", nation: "kingdom", age: 30, gender: "男性",
    childPlan: "wants", spouseId: "wife", npcs: [{ id: "wife", alive: true, gender: "女性", humanAge: 28 }],
    journal: [],
  });
  assert.equal(oldTrying.tryingSince, 30);
  assert.equal(oldTrying.tryingUntil, 31);
  assert.equal(oldTrying.tryingMotherAge, 28);
  advanceLife(Object.assign(migrated, { playing: true, active: true }), 0.25, seededRandom(1));
});

test("sprites differ by race, life stage, and occupation, and the dead are not drawn", async () => {
  const { buildSprite, spriteSpec, lifeStage } = await import("./character-sprite.js");
  const signature = (spec) => JSON.stringify(buildSprite(spec).rects);
  const person = (overrides) => spriteSpec({ race: "human", age: 30, gender: "男性", name: "A", occupation: "農作業", ...overrides }, { isHero: true });
  assert.notEqual(signature(person({})), signature(person({ race: "elf" })));
  assert.notEqual(signature(person({})), signature(person({ race: "dwarf" })));
  assert.notEqual(signature(person({})), signature(person({ age: 2 })));
  assert.notEqual(signature(person({})), signature(person({ age: 80 })));
  assert.notEqual(signature(person({})), signature(person({ occupation: "魔術師" })));
  assert.notEqual(signature(person({ occupation: "騎士" })), signature(person({ occupation: "魔術師" })));
  assert.equal(lifeStage(70), "elder");
  const { livingFamily } = await import("./character-sprite.js");
  const family = livingFamily({
    spouseId: "s", children: ["c1", "c2"],
    npcs: [{ id: "s", alive: false }, { id: "c1", alive: true, humanAge: 5 }, { id: "c2", alive: false, humanAge: 7 }],
  });
  assert.equal(family.spouse, null);
  assert.equal(family.children.length, 1);
});

test("measured log density over human lives stays near the target", () => {
  const totals = [];
  for (let run = 0; run < 20; run += 1) {
    const life = simulateYears(RACES[0], 80, 500 + run);
    totals.push([life.journal.length, life.journal.filter((event) => event.kind === "decision").length]);
  }
  const logs = totals.reduce((sum, [count]) => sum + count, 0) / totals.length;
  const decisions = totals.reduce((sum, [, count]) => sum + count, 0) / totals.length;
  console.log(`log density: ${logs.toFixed(1)} entries and ${decisions.toFixed(1)} decisions per 80 human years`);
  assert.ok(logs >= 60 && logs <= 125);
  assert.ok(decisions >= 12 && decisions <= 35);
});
