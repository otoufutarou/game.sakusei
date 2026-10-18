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
  applyChoice,
  applyRoutineEffect,
  createLife,
  isRoutineEventEligible,
  skillGrowthDelta,
  skillTier,
  routineLogMean,
  selectRoutineEvent,
} from "./simulation.js";
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
  });
  if (requirements.requiresFlag) life.historyFlags.push(requirements.requiresFlag);
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
  assert.ok(CHOICE_EVENTS.every((event) => event.choices.length >= 2 && event.requirements && event.weight > 0));
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
