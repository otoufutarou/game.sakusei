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
  compactChoicePreview,
  formatGold,
  monthlyBudget,
  occupationTitle,
  applyRoutineEffect,
  decorateChoice,
  createLife,
  isRoutineEventEligible,
  skillGrowthDelta,
  skillTier,
  routineLogMean,
  SAVE_VERSION,
  selectRoutineEvent,
} from "./simulation.js";
import { SKILL_IDS_LIST } from "./simulation.js";
import { TALENT_TABLE, magicTier, currentStats, rollAdultBaseline, rollTalent, RACE_ADULT_MEAN } from "./stats.js";
import { deserializeLife, migrateLife, serializeLife } from "./save.js";
import { agePositionPercent, characterSprite, drawJourney } from "./character-sprite.js";
import { FAMOUS_FULL_NAMES, generatePersonName, NAME_CULTURES } from "./names.js";

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
  const age = Math.max(event.id === "choice-work-offer" ? 20 : requirements.minAge ?? 0, 1);
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
  if (event.id === "choice-career-graduation") {
    life.graduationPending = true;
    life.graduationSkill = "scholarship";
  }
  if (event.id === "choice-work-practice") life.occupation = "農作業";
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

test("regional names generate 1,000 distinct full names and avoid the famous-name exclusions", () => {
  const random = seededRandom(41027);
  const usedNames = new Set();
  const generated = [];
  for (let index = 0; index < 1000; index += 1) {
    const name = generatePersonName(random, index % 2 ? "男性" : "女性", { usedNames });
    assert.equal(usedNames.has(name.name), false, `duplicate full name ${name.name}`);
    assert.equal(FAMOUS_FULL_NAMES.has(name.name), false, `excluded famous name ${name.name}`);
    usedNames.add(name.name);
    generated.push(name);
  }

  assert.equal(usedNames.size, 1000);
  const distinctGivenNames = new Set(generated.map((person) => person.givenName)).size;
  assert.ok(distinctGivenNames < generated.length, "given-name reuse remains natural");
  assert.ok(NAME_CULTURES.length >= 9);
  assert.ok(NAME_CULTURES.every((culture) =>
    culture.male.length >= 100 && culture.female.length >= 100 && culture.surnames.length >= 20));
});

test("birth family names and IDs remain stable across save/load", () => {
  const life = createLife(seededRandom(92));
  const familySurname = life.name.split("・").at(-1);
  const parents = life.npcs.filter((npc) => ["父", "母"].includes(npc.relationship));

  assert.equal(life.familySurname, familySurname);
  assert.equal(parents.length, 2);
  assert.ok(parents.every((npc) => npc.name.endsWith(`・${familySurname}`)));
  assert.equal(new Set([life.name, ...parents.map((npc) => npc.name)]).size, 3);
  assert.equal(new Set(parents.map((npc) => npc.id)).size, 2);

  const restored = deserializeLife(serializeLife(life));
  assert.equal(restored.name, life.name);
  assert.equal(restored.familySurname, life.familySurname);
  assert.deepEqual(restored.npcs.map(({ id, name, surname, nameCulture }) => ({ id, name, surname, nameCulture })),
    life.npcs.map(({ id, name, surname, nameCulture }) => ({ id, name, surname, nameCulture })));

  const oldSave = { ...life, familySurname: undefined, nameCulture: undefined };
  const migrated = deserializeLife(serializeLife(oldSave));
  assert.equal(migrated.name, life.name);
});

test("children inherit the life family's surname and keep independent NPC IDs", () => {
  const life = createLife(seededRandom(99));
  life.age = 25;
  life.playing = true;
  life.maxHumanAge = 100;
  life.nextLogAt = 100;
  life.nextDecisionAt = 100;
  life.nextSocialAt = 100;
  life.world.nextChangeAt = 100;
  life.pregnancy = { dueAt: 25, motherRace: life.race.id };
  life.spouseId = "test-spouse";
  life.npcs.push({
    id: "test-spouse", name: "アナ・ロッシ", race: life.race.id, humanAge: 25, age: 25,
    gender: life.gender === "女性" ? "男性" : "女性", alive: true, relationship: "配偶者", affinity: 80, history: [],
  });

  advanceLife(life, 0.25, seededRandom(100));
  const child = life.npcs.find((npc) => npc.relationship === "子");
  assert.ok(child);
  assert.equal(child.surname, life.familySurname);
  assert.equal(child.name.split("・").at(-1), life.familySurname);
  assert.equal(new Set(life.npcs.map((npc) => npc.id)).size, life.npcs.length);
});

test("routine event catalog meets every required category count", () => {
  const counts = Object.groupBy(ROUTINE_EVENTS, (event) => event.category);
  assert.ok((counts["幼少期・教育"]?.length ?? 0) >= 6);
  assert.ok((counts["職業・昇進"]?.length ?? 0) >= 7);
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
      skillPractice: { teaching: { activity: 1, learning: 1 } },
      skillMonthProgress: 0,
      skillHistory: [],
    });
    advanceSkills(life, years);
    assert.ok(Math.abs(life.skills.teaching - target) < 1, `${years} years: ${life.skills.teaching}`);
    assert.equal(life.occupationSkill, life.skills.teaching);
  }
});

test("skills stay fixed over time unless the player chooses to practice", () => {
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
  assert.equal(life.skills.teaching, 0);
  assert.equal(life.journal.length, journalLength);
  decide(life, "work-practice", () => 0.999);
  assert.equal(life.skills.teaching, 1);
});

test("chosen ongoing practice grows its skill without passive career skill growth", () => {
  const life = makeLife({
    age: 20,
    playing: true,
    occupation: "教師",
    occupationSkill: 0,
    occupationRank: "初心者",
    skills: { magic: 0, teaching: 0 },
    skillTalents: { magic: "普通", teaching: "普通" },
    skillPractice: {},
    skillMonthProgress: 0,
    skillHistory: [],
    nextLogAt: 50,
    nextDecisionAt: 50,
    maxHumanAge: 100,
    pendingDecision: { id: "magic-training", choices: [{ effect: "self-study-magic" }] },
  });
  applyChoice(life, { effect: "self-study-magic" }, () => 0.5);
  const selectedMagic = life.skills.magic;
  advanceLife(life, 0.25, () => 0.999);
  assert.ok(life.skills.magic > selectedMagic);
  assert.equal(life.skills.teaching, 0);
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
      skillPractice: { teaching: { activity: 1, learning: 1 } },
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
  life.skillPractice = { teaching: { activity: 1, learning: 1 } };
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
    pendingDecision: { id: "career-choice", choices: [{ effect: "career-start:家業の手伝い" }] },
  });
  applyChoice(life, { effect: "career-start:家業の手伝い" }, () => 0);
  assert.equal(life.occupation, "家業の手伝い");
  assert.equal(life.skills.craft, 42);
  assert.equal(life.skills.magic, 8);
  assert.equal(life.careerHistory.at(-1).from, "職人見習い");
  assert.equal(life.careerHistory.at(-1).to, "家業の手伝い");
  assert.match(life.careerHistory.at(-1).reason, /本人/);
});

test("stale career choices cannot assign an unqualified or unknown occupation", () => {
  const life = makeLife({
    occupation: "職人見習い",
    pendingDecision: { id: "stale-career-choice", choices: [{ effect: "career-start:魔術師" }] },
  });
  applyChoice(life, { effect: "career-start:魔術師" }, () => 0);
  assert.equal(life.occupation, "職人見習い");
  assert.match(life.lastResult.message, /適性や技能を満たしていない/);
  life.pendingDecision = { id: "unknown-career-choice", choices: [{ effect: "career-start:未知の職業" }] };
  applyChoice(life, { effect: "career-start:未知の職業" }, () => 0);
  assert.equal(life.occupation, "職人見習い");
  const alreadyWorking = makeLife({
    age: 20,
    occupation: "農作業",
    skills: { farming: 5 },
    pendingDecision: { id: "duplicate-career-choice", choices: [{ effect: "career-change:農作業" }] },
  });
  applyChoice(alreadyWorking, { effect: "career-change:農作業" }, () => 0);
  assert.match(alreadyWorking.lastResult.message, /すでに農作業として働いている/);
});

test("steady previews preserve choice-specific context and use a neutral fallback", () => {
  const life = makeLife();
  const jobOfferSteady = decorateChoice(life, {
    effect: "steady",
    preview: ["月給: 現在の職業を継続", "転職せず、今の仕事に取り組む"],
  });
  assert.deepEqual(jobOfferSteady.preview, ["月給: 現在の職業を継続", "転職せず、今の仕事に取り組む"]);
  assert.deepEqual(decorateChoice(life, { effect: "steady" }).preview, ["費用: なし", "今の暮らしを続ける"]);
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
  const childWithParents = makeLife({
    age: 5,
    parents: { father: "兵士", mother: "仕立て屋" },
    appearance: { hair: "#34271f", coat: "#647d72" },
  });
  const parentsScene = makeContext();
  parentsScene.canvas.height = 150;
  drawJourney(parentsScene, characterSprite, { life: childWithParents });
  assert.ok(Math.max(...parentsScene.pixels.filter((pixel) => pixel[4] === "#657491").map((pixel) => pixel[2])) >= 18,
    "parents are drawn at the hero's pixel scale rather than half size");
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
  assert.equal(elfScene.gradients.length, 0);
  assert.equal(adult.gradients.length, 0);

  const scaledHero = { ...humanLife, occupation: "兵士", appearance: { hair: "#34271f", coat: "#647d72" } };
  const adultAlone = makeContext();
  adultAlone.canvas.height = 150;
  drawJourney(adultAlone, characterSprite, { life: scaledHero });
  const householdLife = {
    ...scaledHero,
    spouseId: "adult",
    children: ["child"],
    npcs: [
      { id: "adult", name: "Adult", humanAge: 40, alive: true, occupation: "兵士", race: "human" },
      { id: "child", name: "Child", humanAge: 8, alive: true, occupation: "服飾店の見習い", race: "human" },
    ],
  };
  const householdScene = makeContext();
  householdScene.canvas.height = 150;
  drawJourney(householdScene, characterSprite, { life: householdLife });
  assert.equal(
    Math.max(...householdScene.pixels.filter((pixel) => pixel[4] === "#657491").map((pixel) => pixel[3])),
    Math.max(...adultAlone.pixels.filter((pixel) => pixel[4] === "#657491").map((pixel) => pixel[3])),
    "adult household members use the hero's pixel scale",
  );
  const childAlone = makeContext();
  childAlone.canvas.height = 150;
  drawJourney(childAlone, characterSprite, {
    life: { ...scaledHero, age: 8, occupation: "服飾店の見習い" },
  });
  assert.equal(
    Math.max(...householdScene.pixels.filter((pixel) => pixel[4] === "#8fb0c4").map((pixel) => pixel[3])),
    Math.max(...childAlone.pixels.filter((pixel) => pixel[4] === "#8fb0c4").map((pixel) => pixel[3])),
    "children use the same pixel scale as a child hero",
  );

  const familyLife = { ...humanLife, spouse: "Partner", children: ["Child"] };
  const familyScene = makeContext();
  drawJourney(familyScene, characterSprite, { life: familyLife, frame: 0 });
  assert.ok(familyScene.pixels.length > adult.pixels.length);

  const pausedScene = makeContext();
  drawJourney(pausedScene, characterSprite, { life: { ...humanLife, age: 0, playing: false }, frame: 99 });
  assert.deepEqual(pausedScene.pixels, newborn.pixels);

  const ownedHomeScene = makeContext();
  drawJourney(ownedHomeScene, characterSprite, {
    life: { ...humanLife, ownsHome: true, homeType: "estate" },
  });
  assert.notDeepEqual(ownedHomeScene.pixels, newborn.pixels);

  const regionalScenes = ["kingdom", "empire", "forest", "mountain", "demon-realm"].map((id) => {
    const scene = makeContext();
    drawJourney(scene, characterSprite, { life: { ...humanLife, nation: { id } } });
    return JSON.stringify(scene.pixels);
  });
  assert.equal(new Set(regionalScenes).size, regionalScenes.length);
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

test("school fallback is informative, meaningful, and presented only once", () => {
  const life = createLife(() => 0.5);
  life.age = 9;
  life.maxHumanAge = 80;
  life.playing = true;
  life.nextDecisionAt = life.age;
  life.nextLogAt = Infinity;
  life.nextSocialAt = Infinity;
  life.eventHistory.push({ id: "edu-childhood", age: 6 });

  advanceLife(life, 0.25, () => 0.5);
  assert.equal(life.pendingDecision.title, "これからの学び");
  assert.ok(life.pendingDecision.choices.every((choice) => choice.preview.length === 2));
  const workChoice = life.pendingDecision.choices.find((choice) => choice.effect === "work");
  assert.match(workChoice.preview[1], /所持金/);
  assert.match(workChoice.preview[1], /注意:/);
  const fame = life.fame;
  const skill = life.skills.literacy ?? 0;
  applyChoice(life, { effect: "study" }, () => 0.5);
  assert.equal(life.fame, fame);
  assert.ok(life.skills.literacy > skill, "studying grants literacy rather than fame");

  life.nextDecisionAt = life.age;
  advanceLife(life, 0.25, () => 0.5);
  assert.equal(life.pendingDecision, null, "the resolved school fallback is not presented again");
  assert.equal(life.eventHistory.filter((event) => event.id === "choice-fallback-school").length, 1);
});

test("fallback alternatives have distinct mechanical outcomes", () => {
  const worker = makeLife({ age: 10, gold: 3, skills: {}, baseStats: {} });
  decide(worker, "work", () => 0.5);
  assert.equal(worker.gold, 5);
  assert.equal(Object.values(worker.skills).reduce((sum, value) => sum + value, 0), 2);
  assert.equal(worker.fame, 0);

  const mentor = makeLife({ skills: {}, baseStats: {} });
  decide(mentor, "mentor", () => 0.5);
  assert.equal(mentor.skills.teaching, 3);
  assert.equal(mentor.fame, 2);

  const resting = makeLife({ health: "療養中", illness: null, skills: {}, baseStats: {} });
  decide(resting, "rest", () => 0.5);
  assert.equal(resting.health, "健やか");
  assert.ok(resting.relationships.some((relationship) => relationship.type === "family-support"));
  assert.equal(resting.fame, 0);
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
  assert.equal(newborn.body, 100, "age does not passively change a base stat");
  assert.equal(currentStats({ baseStats: { body: 100 }, age: 100, mana: 0 }).body, newborn.body);
});

test("every life rolls talents per skill and keeps the numeric stat model", () => {
  const { life } = adultLife(11);
  assert.equal(Object.keys(life.skillTalents).length, SKILL_IDS_LIST.length);
  assert.ok(Number.isFinite(life.mana) && life.baseStats.body > 0);
});

test("a chosen mage apprenticeship trains skills and opens an explicit career choice at graduation", () => {
  const { life, random } = adultLife(2, { age: 13, occupation: "まだ幼い子ども", gold: 80 });
  life.mana = 80;
  assert.equal(decide(life, "apprentice-magic", random).ok ?? true, true);
  assert.equal(life.occupation, "魔術師の弟子");
  assert.equal(life.trainingSkill, "magic");
  assert.ok(life.mentor && life.npcs.some((npc) => npc.id === life.mentor));
  assert.ok(life.gold < 80, "tuition is paid");
  assert.ok(life.lastResult.details.some((line) => line.includes("所持金")));
  assert.ok(life.skillPractice.magic.learning >= 1.4);
  const before = life.skills.magic;
  for (let step = 0; step < 100 && !life.graduationPending; step += 1) advanceLife(life, 0.25, random);
  assert.ok(life.skills.magic > before + 5);
  assert.equal(life.educationHistory.at(-1).outcome, "修了");
  assert.equal(life.occupation, "魔術師の弟子", "graduation does not assign a career without a choice");
  const mageChoice = life.pendingDecision.choices.find((choice) => choice.effect === "career-graduate:魔術師");
  assert.ok(mageChoice);
  assert.ok(life.pendingDecision.choices.filter((choice) => choice.effect.startsWith("career-graduate:")).length >= 3);
  assert.match(mageChoice.preview[0], /月給:/);
  assert.match(mageChoice.preview[1], /必要技能:/);
  applyChoice(life, mageChoice, random);
  assert.equal(life.occupation, "魔術師");
  assert.equal(life.skillPractice.magic?.learning === 1.4, false, "mentor bonus is removed after the apprenticeship");
  assert.ok(life.skills.magic > 0 && occupationTitle(life).length > 0);
});

test("academies check family funds, scholarships, status and talent", () => {
  const { life } = adultLife(4, { age: 15, gold: 1, status: { name: "農民・労働者" } });
  life.mana = 5;
  assert.ok(choiceAvailability(life, "academy-magic").disabledReason);
  life.mana = 90;
  assert.equal(choiceAvailability(life, "academy-magic").disabledReason, null, "a strong talent earns a scholarship");
  assert.equal(choiceAvailability(life, "academy-magic").cost, 0);
  life.parents.gold = 100;
  life.mana = 25;
  const familyFunded = choiceAvailability(life, "academy-magic");
  assert.equal(familyFunded.disabledReason, null);
  assert.equal(familyFunded.payer, "parents");
  assert.equal(familyFunded.cost, 60);
  const noble = adultLife(4, { age: 15, gold: 1, status: { name: "貴族" } }).life;
  assert.equal(choiceAvailability(noble, "academy-knight").disabledReason, null);
  assert.equal(choiceAvailability(noble, "academy-knight").payer, "player", "noble family funding is not charged to a missing parent balance");
});

test("primary education uses parental funds and keeps its preview to two lines", () => {
  const { life } = adultLife(29, { age: 8, gold: 0 });
  life.parents.gold = 10;
  assert.equal(choiceAvailability(life, "edu-town-school").cost, 4);
  assert.equal(choiceAvailability(life, "edu-town-school").payer, "parents");
  assert.equal(choiceAvailability(life, "edu-tutor").cost, 12);
  assert.ok(choiceAvailability(life, "edu-tutor").disabledReason, "the family's resources still gate the more expensive tutor");
  life.playing = true;
  life.nextDecisionAt = life.age;
  life.nextLogAt = Infinity;
  life.nextSocialAt = Infinity;
  advanceLife(life, 0.25, () => 0.9);
  assert.equal(life.pendingDecision.title, "学びのはじまり");
  assert.ok(life.pendingDecision.choices.filter((choice) => ["edu-town-school", "edu-tutor"].includes(choice.effect))
    .every((choice) => choice.preview.length === 2));
  assert.deepEqual(life.pendingDecision.choices.find((choice) => choice.effect === "edu-town-school").preview, [
    "費用: 親の財産から4G",
    "メリット: 読み書きの基礎を4年間学ぶ／デメリット: 家族の蓄えを使う",
  ]);
  applyChoice(life, { effect: "edu-town-school" }, () => 0.9);
  assert.equal(life.parents.gold, 6);
  assert.equal(life.gold, 0, "tuition is not taken from the child's empty wallet");
  assert.equal(life.trainingEndsAt, 12, "the basic school course lasts four human-equivalent years");
  assert.ok(life.lastResult.details.some((line) => line.includes("親の財産-")));
  const route = CHOICE_EVENTS.find((event) => event.id === "edu-apprenticeship");
  const routeChoices = route.choicesFor({ ...life, age: 13, occupation: "まだ幼い子ども" });
  assert.ok(routeChoices.some((choice) => choice.effect.startsWith("career-start:")));
  assert.ok(routeChoices.some((choice) => choice.effect === "path-academy"));
});

test("friend inheritance is represented by one equal-share option", () => {
  const event = CHOICE_EVENTS.find((item) => item.id === "choice-will");
  const { life } = adultLife(44, { age: 60 });
  life.npcs = [
    { id: "friend-1", name: "友人一", alive: true, relationship: "友人" },
    { id: "friend-2", name: "友人二", alive: true, relationship: "友人" },
    { id: "acquaintance", name: "知人", alive: true, relationship: "知人" },
  ];
  const choices = event.choicesFor(life);
  assert.equal(choices.filter((choice) => choice.effect === "will-friends-equal").length, 1);
  assert.equal(choices.some((choice) => choice.effect === "will-person:friend-1" || choice.effect === "will-person:friend-2"), false);
  assert.ok(choices.some((choice) => choice.effect === "will-person:acquaintance"), "other named contacts remain selectable");
});

test("a grouped friend inheritance is shared equally among living friends", () => {
  const { life } = adultLife(47, { age: 60, gold: 90 });
  life.npcs = [
    { id: "friend-1", name: "友人一", alive: true, relationship: "友人" },
    { id: "friend-2", name: "友人二", alive: true, relationship: "友人" },
  ];
  decide(life, "will-friends-equal", () => 0.5);
  life.age = life.maxHumanAge - 0.01;
  life.nextDecisionAt = Infinity;
  life.nextLogAt = Infinity;
  life.nextSocialAt = Infinity;
  life.world.nextChangeAt = Infinity;
  advanceLife(life, 0.25, () => 0.99);
  assert.deepEqual(life.inheritance.map((heir) => [heir.id, heir.amount]), [["friend-1", 45], ["friend-2", 45]]);
});

test("steady living does not create money and deliberate saving yields only a small reserve", () => {
  const { life, random } = adultLife(45, { gold: 20 });
  decide(life, "steady", random);
  assert.equal(life.gold, 20);
  decide(life, "save", random);
  assert.equal(life.gold, 21);
});

test("ordinary wage cash flow leaves only a modest monthly surplus", () => {
  const farmer = adultLife(46, { occupation: "農作業", occupationRole: "農作業", occupationSkill: 0, occupationYears: 0 }).life;
  farmer.world = { situation: "平和" };
  const budget = monthlyBudget(farmer);
  assert.equal(budget.income.work, 3.9 * TUNING.wageMultiplier);
  assert.equal(budget.expenses.living, TUNING.adultLivingCostLegacyG);
  assert.equal(budget.expenses.rent, TUNING.homeRentLegacyG);
  assert.ok(budget.net > 0 && budget.net < 0.75, "an ordinary farmer's monthly cash flow stays near break-even");
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

test("famine hurts farmers, recessions reduce merchant and business income, and home costs match value", () => {
  const farmer = adultLife(6, { occupation: "農作業", occupationSkill: 0 }).life;
  farmer.world = { situation: "平和" };
  const normalFarmBudget = monthlyBudget(farmer);
  farmer.world = { situation: "飢饉" };
  const famineFarmBudget = monthlyBudget(farmer);
  assert.ok(famineFarmBudget.income.work < normalFarmBudget.income.work);
  assert.ok(famineFarmBudget.net < normalFarmBudget.net);

  const merchant = adultLife(7, { occupation: "商人", occupationSkill: 0, businessRevenue: 1 }).life;
  merchant.world = { situation: "平和" };
  const normalMerchantIncome = monthlyBudget(merchant).income.work;
  merchant.world = { situation: "不況" };
  assert.ok(monthlyBudget(merchant).income.work < normalMerchantIncome);

  const homeEvent = ROUTINE_EVENTS.find((event) => event.id === "wealth-property");
  assert.equal(homeEvent.requirements.minimumGold, TUNING.homePricesLegacyG.small);
  assert.equal(homeEvent.effect.gold, -TUNING.homePricesLegacyG.small);
  const buyer = makeLife({ age: 30, gold: TUNING.homePricesLegacyG.small });
  applyRoutineEffect(buyer, homeEvent, () => 0.5);
  assert.equal(buyer.gold, 0);
  assert.equal(buyer.ownsHome, true);
  assert.equal(buyer.homeValue, TUNING.homePricesLegacyG.small);
});

test("choice summaries retain important conditions and durations", () => {
  const preview = compactChoicePreview(["費用: 8G", "条件: 10歳以上", "期間: 約5年", "デメリット: 修行中は収入がない"]);
  assert.equal(preview.length, 2);
  assert.ok(preview[1].includes("条件: 10歳以上"));
  assert.ok(preview[1].includes("期間: 約5年"));
});

test("ordinary lifetime savings stay near one small home for most careers", () => {
  const jobs = ["農作業", "商人", "職人見習い", "兵士", "教師", "冒険者", "服飾店の見習い"];
  const peakAssets = [];
  for (let seed = 1; seed <= 210; seed += 1) {
    const random = seededRandom(seed * 51);
    const life = createLife(random);
    Object.assign(life, {
      age: 20,
      occupation: jobs[(seed - 1) % jobs.length],
      occupationSkill: 0,
      occupationYears: 0,
      occupationRole: undefined,
      gold: 0,
      playing: true,
      started: true,
      maxHumanAge: 65,
      nextDecisionAt: 20.5,
      nextLogAt: 20.25,
      nextSocialAt: Infinity,
      status: { name: "都市平民" },
      parents: null,
    });
    let peak = 0;
    let guard = 0;
    while (life.active && life.age < 65 && guard++ < 5_000) {
      if (life.pendingDecision) {
        const choice = life.pendingDecision.choices.find((item) => item.effect === "steady" || item.effect === "save")
          ?? life.pendingDecision.choices.at(-1);
        if (choice) applyChoice(life, choice, random);
        life.playing = true;
      }
      advanceLife(life, 0.25, random);
      peak = Math.max(peak, life.gold + (life.homeValue ?? 0));
    }
    peakAssets.push(peak);
  }
  peakAssets.sort((left, right) => left - right);
  const homePrice = TUNING.homePricesLegacyG.small;
  const seventiethPercentile = peakAssets[Math.floor(peakAssets.length * 0.7)];
  const ninetiethPercentile = peakAssets[Math.floor(peakAssets.length * 0.9)];
  assert.ok(seventiethPercentile >= homePrice * 0.75 && seventiethPercentile <= homePrice * 2.5,
    `70th percentile assets ${seventiethPercentile}G should stay near one small home (${homePrice}G)`);
  assert.ok(peakAssets.filter((assets) => assets < homePrice * 0.75).length > 0, "some workers remain below the home threshold");
  assert.ok(ninetiethPercentile < homePrice * 3.5, "ordinary careers should not commonly accumulate several home prices");
});

test("meeting NPCs, romance, and marriage run through persistent NPCs and refusals are possible", () => {
  let married = 0;
  let met = 0;
  for (let seed = 1; seed <= 30; seed += 1) {
    const { life, random } = adultLife(seed, { age: 22, gold: 200, nextSocialAt: 22 });
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

test("marriage guarantees a child-planning decision within six months", () => {
  const { life } = adultLife(14, { age: 30, gold: 20 });
  const partner = { id: "partner", name: "配偶者", race: "human", humanAge: 29, alive: true, affinity: 100, history: [], relationship: "恋愛相手", occupation: "農作業", gender: "女性", maritalStatus: "未婚" };
  life.npcs.push(partner);
  life.romanticPartnerId = partner.id;
  life.historyFlags.push("romantic-partner", "committed-relationship");
  decide(life, "marry", () => 0);
  assert.equal(life.spouseId, partner.id);
  assert.equal(life.nextDecisionAt, life.age + 0.5);
  advanceLife(life, 0.25, () => 0.99);
  assert.equal(life.pendingDecision, null);
  advanceLife(life, 0.25, () => 0.99);
  assert.equal(life.pendingDecision?.id, "choice-children");
  assert.match(life.pendingDecision.copy, /一人目の子供/);
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
  assert.match(life.journal.at(-1).text, /相続財産60G/);
});

test("balances stay unchanged in G and old silver-denominated log text is migrated", () => {
  assert.equal(formatGold(0.04), "0.04G");
  assert.equal(formatGold(12.3), "12.3G");
  assert.equal(formatGold(1666.666), "1,666.67G");
  const legacy = migrateLife({
    name: "旧データ", race: "human", nation: "kingdom", age: 20, gold: 5, debt: 2,
    nextDecisionLimitReached: true,
    journal: [{ text: "相続財産1800銀貨" }],
  });
  assert.equal(legacy.gold, 5);
  assert.equal(legacy.debt, 2);
  assert.equal(legacy.currencySchema, "legacy-G-v1");
  assert.equal(legacy.nextDecisionLimitReached, undefined);
  assert.equal(legacy.journal[0].text, "相続財産60G");
  const originalEntry = { id: "1銀貨", text: "1銀貨を受け取った" };
  const detailedResult = {
    title: "相続", choice: "1銀貨を受け取る", message: "受取額は1銀貨", details: ["残額1銀貨"], age: 22,
  };
  const migratedText = migrateLife({
    name: "旧データ", race: "human", nation: "kingdom", age: 20, saveVersion: SAVE_VERSION - 1,
    journal: [originalEntry], lastResult: detailedResult,
  });
  assert.deepEqual(migratedText.journal[0], { id: "1銀貨", text: "0.03Gを受け取った" });
  assert.notEqual(migratedText.journal[0], originalEntry);
  assert.equal(originalEntry.text, "1銀貨を受け取った");
  assert.equal(migratedText.lastResult.choice, "0.03Gを受け取る");
  assert.equal(migratedText.lastResult.details[0], "残額0.03G");
  assert.equal(detailedResult.choice, "1銀貨を受け取る");
  const fractional = migrateLife({
    name: "旧データ", race: "human", nation: "kingdom", age: 20, saveVersion: SAVE_VERSION - 1,
    journal: [{ text: "1銀貨と15銀貨" }],
  });
  assert.equal(fractional.journal[0].text, "0.03Gと0.5G");
  const current = migrateLife({
    name: "現行データ", race: "human", nation: "kingdom", age: 20, saveVersion: SAVE_VERSION,
    journal: [{ text: "メモ: 1銀貨という言葉" }],
  });
  assert.equal(current.journal[0].text, "メモ: 1銀貨という言葉");
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
    parents: { father: "農夫", mother: "薬師", gold: 0, debt: 0 },
  });
  decide(life, "academy-magic", () => 0.5);
  assert.equal(life.scholarshipBalance, 60 + 6 * TUNING.scholarshipLivingCostLegacyG);
  assert.equal(life.debt, 0, "education loans are tracked separately from ordinary debt");
  life.age = 30;
  life.occupation = "教師";
  life.occupationRole = "主任教師";
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

test("job offers show explicit career destinations with salary and skill requirements", () => {
  const event = CHOICE_EVENTS.find((candidate) => candidate.id === "choice-work-offer");
  const life = makeLife({ skills: { literacy: 0, trade: 0, scholarship: 0, magic: 0 }, mana: 0 });
  const choices = event.choicesFor(life);
  assert.equal(choices.at(-1).effect, "steady");
  assert.ok(choices.slice(0, -1).length >= 2);
  assert.ok(choices.slice(0, -1).every((choice) => choice.effect.startsWith("career-change:")));
  assert.ok(choices.slice(0, 2).every((choice) => choice.preview.length === 2
    && choice.preview[0].startsWith("月給") && choice.preview[1].startsWith("必要技能:")));
  const recessionOptions = event.choicesFor({
    ...life, occupation: "失業中", skills: { ...life.skills, trade: 5 }, world: { situation: "不況" },
  });
  assert.ok(recessionOptions.find((choice) => choice.effect === "career-change:商人").preview[0].includes("不況"));
  const unemployed = makeLife({ age: 16, occupation: "失業中", skills: { manual: 0, farming: 0, craft: 0 } });
  unemployed.eventHistory.push({ id: event.id, age: 14 });
  assert.equal(isRoutineEventEligible(unemployed, event), true, "unemployed teenagers can receive explicit job options");
  unemployed.age = 15;
  assert.equal(isRoutineEventEligible(unemployed, event), false, "an unemployed character waits two years between offers");
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

test("war and plague adjust prices and income, and the world situation evolves", () => {
  const { life, random } = adultLife(12, { occupation: "兵士", gold: 30 });
  life.world = { situation: "平和", since: life.age, nextChangeAt: life.age + 0.1 };
  const peacefulBudget = monthlyBudget(life);
  const warBudget = monthlyBudget({ ...life, world: { situation: "戦争中" } });
  assert.ok(warBudget.expenses.living > peacefulBudget.expenses.living, "war raises prices");
  assert.ok(warBudget.income.work > peacefulBudget.income.work, "war slightly raises soldiers' wages");
  const plagueBudget = monthlyBudget({ ...life, world: { situation: "疫病流行" } });
  assert.ok(plagueBudget.expenses.living > peacefulBudget.expenses.living);
  assert.ok(plagueBudget.income.work < peacefulBudget.income.work);
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
  const legacyHome = migrateLife({
    name: "旧所有者", race: "human", nation: "kingdom", age: 30, saveVersion: SAVE_VERSION - 1,
    ownsHome: true, homeType: "small", homeValue: 40, journal: [],
  });
  assert.equal(legacyHome.homeValue, TUNING.homePricesLegacyG.small);
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
