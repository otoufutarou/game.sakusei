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
  spendMoney,
  spendOptions,
  chooseDecision,
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
  if (event.id === "choice-work-mentor") life.occupation = "農作業";
  if (event.id === "choice-first-career") life.careerCrossroads = true;
  if (event.id === "choice-work-offer") life.nextCareerReviewAt = 0;
  if (event.id === "choice-dungeon") life.nextDungeonAt = life.age;
  if (event.id === "choice-demon-king" || event.id === "choice-demon-relief") life.demonKingActive = true;
  const person = (id, relationship, humanAge = 40) => ({ id, name: id, relationship, humanAge, race: "human", gender: "女性", alive: true, affinity: 60, history: [] });
  life.mana = 50;
  if (/arranged/.test(event.id)) life.status = { name: "貴族" };
  life.npcs = [person("p1", "父"), person("sweetheart", "恋愛相手", 22)];
  if (/romance|family-home/.test(event.id)) life.romanticPartnerId = "sweetheart";
  if (/children|marriage-crisis/.test(event.id)) {
    life.spouseId = "sweetheart";
    life.marriage = { harmony: 10 };
  }
  life.siblings = 1;
  life.npcs.push(person("buddy", "友人", 25));
  if (event.id === "choice-name-child") {
    life.npcs.push({ ...person("newborn", "子", 0), nameDecided: false });
    life.children = ["newborn"];
  }
  if (event.id === "married-anniversary") {
    life.age = 25;
    life.spouse = "Spouse";
    life.marriage = { since: 20, harmony: 60 };
    life.historyFlags.push("married");
  }
  if (/^(child-(first|starts|helps|growing)|elder-young|choice-child-)/.test(event.id)) {
    const child = person("kid", "子", /first/.test(event.id) ? 2 : /starts/.test(event.id) ? 7 : 12);
    life.npcs.push(child);
    life.children = ["kid"];
    if (event.id === "choice-child-wedding") Object.assign(child, { maritalStatus: "既婚" });
    if (event.id === "choice-child-home") Object.assign(child, { humanAge: 26, independent: true });
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
  life.demonKingRiseAt = Infinity;
  life.demonKingStarted = true;
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
    assert.equal(actualAge({ age: 1, race }), race.multiplier, "a log at human-equivalent age 1 displays at the race's actual age");
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

test("infancy reliably explains race, lifespan, status and world without decisions", () => {
  for (const race of RACES) {
    const life = createLife(seededRandom(91));
    Object.assign(life, { race, started: true, playing: true, nextLogAt: Infinity, nextSocialAt: Infinity });
    life.world.nextChangeAt = Infinity;
    while (life.age < 3) advanceLife(life, 0.25, () => 0.99);
    const infancy = life.journal.filter((entry) => entry.id?.startsWith("infancy-"));
    assert.deepEqual(infancy.map((entry) => entry.age), [0.5, 1, 2, 3]);
    assert.match(infancy[0].text, new RegExp(`${race.lifespan}歳`));
    assert.ok(infancy[0].text.includes(race.name));
    assert.ok(infancy[1].text.includes(life.status.name));
    assert.match(infancy[3].text, /魔術や魔物/);
    assert.equal(life.pendingDecision, null);
    const restored = deserializeLife(serializeLife(life));
    restored.playing = true;
    advanceLife(restored, 0.25, () => 0.99);
    assert.equal(restored.journal.filter((entry) => entry.id?.startsWith("infancy-")).length, 4);
  }
});

test("older saves gain future scheduling defaults without invented childhood or changed balances", () => {
  const life = migrateLife({ race: "beastkin", nation: "kingdom", age: 30, gold: 123, debt: 4 });
  assert.equal(life.childhoodContextThrough, 30);
  assert.equal(life.dungeonOffers, 0);
  assert.equal(life.nextDungeonAt, 31);
  assert.equal(life.gold, 123);
  assert.equal(life.debt, 4);
  assert.equal(life.demonKingRiseAt, 45);
  assert.deepEqual(life.journal, []);
});

test("new careers reset a different required skill, while same-skill transitions retain it", () => {
  const life = makeLife({ skills: { craft: 42, farming: 18 }, gold: 100 });
  decide(life, "open-shop-choice", () => 0.5);
  assert.equal(life.occupation, "工房主");
  assert.equal(life.occupationSkill, 42);
  const choiceEvent = CHOICE_EVENTS.find((event) => event.id === "choice-work-offer");
  const craftChoice = choiceEvent.choicesFor(life).find((choice) => choice.effect === "career-change:職人見習い");
  assert.ok(craftChoice.preview.join("").includes("引き継げて有利"));
  decide(life, "career-change:農作業", () => 0.5);
  assert.equal(life.occupationSkill, 0);
  assert.equal(life.skills.farming, 0);
  assert.equal(life.skills.craft, 42, "unrelated learned skills remain recorded");
  advanceSkills(life, 1);
  assert.ok(life.occupationSkill > 0);
  decide(life, "career-change:職人見習い", () => 0.5);
  assert.equal(life.occupationSkill, 0, "switching back is also a different skill");
  assert.equal(life.occupationRank, "初心者");
  assert.ok(life.lastResult.details.some((detail) => detail.includes("技能-")));
});

test("first-career stale choices cannot bypass minimum age or aptitude", () => {
  const life = makeLife({ age: 12, occupation: "家業の手伝い", skills: {}, baseStats: { body: 30, combat: 30 } });
  decide(life, "career-first:冒険者", () => 0);
  assert.equal(life.occupation, "家業の手伝い");
  decide(life, "career-first:魔術師", () => 0);
  assert.equal(life.occupation, "家業の手伝い");

  const route = CHOICE_EVENTS.find((event) => event.id === "choice-first-career");
  assert.equal(isRoutineEventEligible(makeLife({ age: 12, occupation: "家業の手伝い", careerCrossroads: true }), route), false);
  const firstCareer = makeLife({
    age: 13, occupation: "家業の手伝い", careerCrossroads: true, skills: {},
    baseStats: { body: 20, combat: 20, dexterity: 10, intellect: 10, charm: 10, luck: 10 },
  });
  firstCareer.pendingDecision = { id: "choice-first-career", title: "進路", choices: [{ effect: "career-first:農作業", label: "農作業" }] };
  firstCareer.gold = 0;
  decide(firstCareer, "career-first:農作業", () => 0);
  assert.match(firstCareer.lastResult.message, /月給は約2\.8G/);
});

test("ore contract odds and outcomes no longer depend on the frozen dexterity field", () => {
  const apprentice = makeLife({ occupationSkill: 20, dexterity: 200 });
  const expert = makeLife({ occupationSkill: 80, dexterity: 0 });
  assert.match(decorateChoice(apprentice, { effect: "ore-contract" }).preview.join(""), /36%/);
  assert.match(decorateChoice(expert, { effect: "ore-contract" }).preview.join(""), /84%/);
  decide(apprentice, "ore-contract", () => 0.5);
  decide(expert, "ore-contract", () => 0.5);
  assert.equal(apprentice.gold, 22, "low skill fails despite high legacy dexterity");
  assert.equal(expert.gold, 42, "high skill succeeds despite zero legacy dexterity");
});

test("poverty relief is a debt-free guild task for every occupation", () => {
  assert.ok(!CHOICE_EVENTS.some((event) => event.id === "choice-business-loan"));
  assert.ok(!ROUTINE_EVENTS.some((event) => event.id === "wealth-loan"));
  for (const occupation of ["魔術師", "農作業", "商人"]) {
    const life = makeLife({ occupation, gold: 0 });
    assert.ok(availableChoiceEvents(life).some((event) => event.id === "choice-guild-herbs"));
    decide(life, "gather-herbs", () => 0.5);
    assert.equal(life.gold, 3);
    assert.equal(life.debt, 0);
    assert.equal(life.occupation, occupation);
    assert.ok(choiceAvailability(life, "borrow-for-trade").disabledReason);
  }
});

test("decision cooldowns survive journal churn and generic fallbacks have stable identities", () => {
  const life = makeLife({
    age: 30, gold: 2,
    eventHistory: [{ id: "choice-guild-herbs", age: 29 }, { id: "choice-household-budget", age: 25 }],
    journal: Array.from({ length: 25 }, (_, index) => ({ id: `unrelated-${index}` })),
  });
  assert.ok(!availableChoiceEvents(life).some((event) => ["choice-guild-herbs", "choice-household-budget"].includes(event.id)));
  const { life: fallback } = adultLife(8, {
    age: 17, occupation: "失業中", nextDecisionAt: 17, skills: {}, gold: 0,
    eventHistory: CHOICE_EVENTS.map((event) => ({ id: event.id, age: 16 })),
  });
  advanceLife(fallback, 0.01, () => 0.99);
  assert.equal(fallback.pendingDecision, null, "no repetitive job-practice fallback for a nonworker");
  const { life: generic } = adultLife(9, {
    age: 50, occupation: "引退", nextDecisionAt: 50, gold: 0,
    eventHistory: CHOICE_EVENTS.map((event) => ({ id: event.id, age: 50 })),
  });
  advanceLife(generic, 0.01, () => 0.99);
  assert.equal(generic.pendingDecision.id, "choice-fallback-middle");
  chooseDecision(generic, "save", () => 0.99);
  generic.journal = Array.from({ length: 25 }, (_, index) => ({ id: `unrelated-${index}` }));
  generic.nextDecisionAt = generic.age;
  advanceLife(generic, 0.01, () => 0.99);
  assert.equal(generic.pendingDecision, null, "journal churn cannot bypass the stable fallback cooldown");
});

test("dungeon uses the exact 70/10/5/15 outcome intervals and never adds debt", () => {
  const counts = { slime: 0, treasure: 0, dragon: 0, goblin: 0 };
  for (let index = 0; index < 100; index += 1) {
    const life = makeLife({ gold: 100 });
    decide(life, "dungeon-enter", () => (index + 0.5) / 100);
    const delta = life.gold - 100;
    counts[delta === 1 ? "slime" : delta === 50 ? "treasure" : delta === -20 ? "dragon" : "goblin"] += 1;
    assert.ok([1, 50, -20, -5].includes(delta));
    assert.equal(life.debt, 0);
    assert.equal(life.finance.recent.at(-1).amount, delta);
  }
  assert.deepEqual(counts, { slime: 70, treasure: 10, dragon: 5, goblin: 15 });
  for (const roll of [0.8, 0.85]) {
    const life = makeLife({ gold: 2 });
    decide(life, "dungeon-enter", () => roll);
    assert.equal(life.gold, 0);
    assert.equal(life.debt, 0);
  }
});

test("dungeon opportunities occur twice after adulthood, counting refusals and reloads", () => {
  for (const race of RACES) {
    const { life } = adultLife(99, { race, age: 21.75, nextDungeonAt: 22, nextDecisionAt: Infinity, occupation: "引退" });
    advanceLife(life, 0.25, () => 0.99);
    assert.equal(life.pendingDecision.id, "choice-dungeon-1");
    assert.equal(life.age, 22);
    chooseDecision(life, "dungeon-decline", () => 0.5);
    const restored = deserializeLife(serializeLife(life));
    Object.assign(restored, { playing: true, age: 47.75, nextDecisionAt: Infinity, nextLogAt: Infinity, nextSocialAt: Infinity });
    advanceLife(restored, 0.25, () => 0.99);
    assert.equal(restored.pendingDecision.id, "choice-dungeon-2");
    chooseDecision(restored, "dungeon-decline", () => 0.5);
    assert.equal(restored.dungeonOffers, 2);
    assert.ok(!availableChoiceEvents(restored).some((event) => event.id === "choice-dungeon"));
    assert.equal(deserializeLife(serializeLife(restored)).nextDungeonAt, Infinity);
    assert.equal(isRoutineEventEligible(makeLife({ age: 17 }), CHOICE_EVENTS.find((event) => event.id === "choice-dungeon")), false);
  }
});

test("reloading an unanswered dungeon invitation does not consume an opportunity", () => {
  const { life } = adultLife(99, { age: 22, nextDungeonAt: 22, occupation: "引退" });
  advanceLife(life, 0.01, () => 0.99);
  assert.equal(life.pendingDecision.id, "choice-dungeon-1");
  assert.equal(life.dungeonOffers, 0);
  const restored = deserializeLife(serializeLife(life));
  restored.playing = true;
  advanceLife(restored, 0.01, () => 0.99);
  assert.equal(restored.pendingDecision.id, "choice-dungeon-1");
  assert.equal(restored.dungeonOffers, 0);
  chooseDecision(restored, "dungeon-decline", () => 0.5);
  assert.equal(restored.dungeonOffers, 1);
  assert.equal(restored.nextDungeonAt, 48);
});

test("economy budgets cover youth, spouses, promotions and business rather than only single beginners", () => {
  const spouse = { id: "spouse", alive: true, occupation: "教師" };
  for (const [occupation, role] of [["農作業", "農地所有者"], ["商人", "商会主"], ["教師", "学院長"], ["魔術師", "宮廷魔術師"], ["聖職者", "司祭"]]) {
    for (const owned of [false, true]) {
      const life = makeLife({
        age: 50, occupation, occupationRole: role, occupationSkill: 100,
        ownsHome: owned, homeType: "small", spouseId: spouse.id, npcs: [spouse],
        businessOccupation: occupation, businessRevenue: 1.2, world: { situation: "平和" },
      });
      const budget = monthlyBudget(life);
      assert.equal(budget.expenses.family, TUNING.adultLivingCostLegacyG);
      assert.ok(budget.net > 0 && budget.net < budget.totalIncome * 0.65, `${role}: ${budget.net}`);
      assert.ok(budget.totalExpense > budget.totalIncome * 0.35, "higher earners still pay household and lifestyle costs");
      assert.ok(Math.abs(budget.totalIncome - budget.totalExpense - budget.repayment - budget.scholarshipRepayment - budget.net) < 1e-9);
    }
  }
  const youth = makeLife({ age: 13, occupation: "農作業", occupationSkill: 0 });
  assert.ok(monthlyBudget(youth).net < 0.3, "dependent youth contribute wages to their household");
  const business = makeLife({ occupation: "魔術師", businessOccupation: "商人", businessRevenue: 100 });
  assert.equal(monthlyBudget(business).income.work, monthlyBudget({ ...business, businessRevenue: 0 }).income.work, "an inactive business cannot multiply another career's pay");
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
      age: 12,
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

test("working grows occupation skill automatically, while paid expert guidance adds a lump of skill", () => {
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
  const automaticGrowth = life.skills.teaching;
  assert.ok(automaticGrowth > 0);
  assert.equal(life.journal.length, journalLength);
  const goldBeforeTraining = life.gold;
  decide(life, "work-mentor-training", () => 0.999);
  assert.ok(life.skills.teaching > automaticGrowth + 3.9);
  assert.equal(life.gold, goldBeforeTraining - 5);
  assert.match(life.lastResult.message, /玄人に5G/);
});

test("chosen ongoing practice grows a separate skill alongside career experience", () => {
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
  assert.ok(life.skills.teaching > 0);
});

test("decades of work advance occupation skill beyond the beginner ranks", () => {
  const life = makeLife({
    age: 60,
    occupation: "冒険者",
    occupationSkill: 0,
    occupationRank: "初心者",
    occupationYears: 45,
    skills: { adventuring: 0 },
    skillTalents: { adventuring: "普通" },
    skillPractice: {},
    skillMonthProgress: 0,
    skillHistory: [],
  });
  advanceSkills(life, 45);
  assert.ok(life.occupationSkill >= 60, `45 years of work produced skill ${life.occupationSkill}`);
  assert.ok(["熟練", "達人", "巨匠級"].includes(skillTier(life.occupationSkill)));
});

test("paid expert-guidance choices stop appearing once career skill reaches apprentice level", () => {
  const event = CHOICE_EVENTS.find((candidate) => candidate.id === "choice-work-mentor");
  assert.ok(event);
  assert.equal(isRoutineEventEligible(makeLife({ age: 18, occupationSkill: 19 }), event), true);
  assert.equal(isRoutineEventEligible(makeLife({ age: 18, occupationSkill: 20 }), event), false);
  assert.equal(isRoutineEventEligible(makeLife({ age: 18, occupationSkill: 0, gold: 4 }), event), false);
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

test("magic mentor results reflect mana and stop after reaching the final tier", () => {
  const event = CHOICE_EVENTS.find((item) => item.id === "choice-magic-training");
  const results = [
    [50, "魔力を安全に扱うすべを覚えた。"],
    [51, "魔力を自在に動かせるようになった。"],
    [70, "魔力を自在に動かせるようになった。"],
    [71, "あなたほど魔法の才能が豊かな人は珍しいと師に褒められた。"],
    [100, "あなたほど魔法の才能が豊かな人は珍しいと師に褒められた。"],
    [101, "大魔法を扱えるようになった。魔術師ならば大成するだろう。"],
    [119, "大魔法を扱えるようになった。魔術師ならば大成するだろう。"],
    [120, "あなたほど魔法に卓越していれば、歴史に残る大魔術師になるだろう。あなたに教えることはもう何も無い。"],
  ];
  for (const [mana, expected] of results) {
    const life = makeLife({
      age: 20, gold: 30, mana, historyFlags: ["awakened-magic"], npcs: [],
      skills: { magic: 0 }, skillTalents: { magic: "普通" }, skillPractice: {},
      pendingDecision: { id: "magic-training", choices: [{ effect: "train-magic" }] },
    });
    applyChoice(life, { effect: "train-magic" }, seededRandom(42));
    assert.equal(life.lastResult.message, expected, `mana ${mana}`);
    if (mana >= 120) {
      life.trainingPlan = null;
      assert.equal(isRoutineEventEligible(life, event), false);
    }
  }
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
  assert.ok(samples[0].events >= 110 && samples[0].events <= 230);
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

test("the school-age stage no longer shows a generic fallback decision", () => {
  const life = createLife(() => 0.5);
  life.age = 9;
  life.maxHumanAge = 80;
  life.playing = true;
  life.nextDecisionAt = life.age;
  life.nextLogAt = Infinity;
  life.nextSocialAt = Infinity;
  life.eventHistory.push({ id: "edu-childhood", age: 6 });
  advanceLife(life, 0.25, () => 0.5);
  assert.equal(life.pendingDecision, null);
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
  life.nextDungeonAt = Infinity;
  life.demonKingRiseAt = Infinity;
  life.demonKingStarted = true;
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
  life.nextDecisionAt = Infinity;
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
  const route = CHOICE_EVENTS.find((event) => event.id === "choice-first-career");
  const routeChoices = route.choicesFor({ ...life, age: 13, occupation: "家業の手伝い" });
  assert.ok(routeChoices.some((choice) => choice.effect.startsWith("career-first:")));
  assert.ok(routeChoices.some((choice) => choice.effect === "path-academy"));
});

test("will choices contain only the requested groups, with children conditional", () => {
  const event = CHOICE_EVENTS.find((item) => item.id === "choice-will");
  const { life } = adultLife(44, { age: 60 });
  life.npcs = [
    { id: "friend-1", name: "友人一", alive: true, relationship: "友人" },
    { id: "friend-2", name: "友人二", alive: true, relationship: "友人" },
    { id: "acquaintance", name: "知人", alive: true, relationship: "知人" },
  ];
  const choices = event.choicesFor(life);
  assert.equal(choices.filter((choice) => choice.effect === "will-friends-equal").length, 1);
  assert.deepEqual(choices.map((choice) => choice.label), [
    "法律に沿って家族に相続をする", "友人に全額を遺す",
    life.gender === "男性" ? "妻に全額を遺す" : "夫に全額を遺す", "協会に寄付をする",
  ]);
  assert.ok(choices.find((choice) => choice.effect === "will-spouse").disabledReason);
  assert.equal(chooseDecision({ ...life, pendingDecision: { choices } }, "will-spouse"), null);
  const spouse = { id: "spouse", name: "配偶者の名前", gender: "女性", alive: true };
  life.spouseId = spouse.id;
  life.npcs.push(spouse);
  life.children = [{ id: "child-1", name: "子の名前", alive: true }];
  const withChildren = event.choicesFor(life);
  assert.equal(withChildren.length, 5);
  assert.equal(withChildren[2].label, "妻に全額を遺す");
  assert.equal(withChildren[2].disabledReason, null);
  assert.equal(withChildren[3].label, "子供に全額を遺す");
  assert.equal(withChildren[3].effect, "will-equal-children");
  assert.equal(withChildren.some((choice) => /will-person:|will-oldest-child/.test(choice.effect)), false);
  life.npcs = [spouse];
  assert.ok(decorateChoice(life, event.choicesFor(life)[1]).disabledReason);
});

test("wills are scheduled once each at human-equivalent ages 70 and 85 across races and reloads", () => {
  for (const race of RACES) {
    let life = adultLife(44, {
      race, age: 69.9, occupation: "引退", occupationRole: "引退",
      world: { situation: "平和", nextChangeAt: Infinity },
    }).life;
    for (const age of [70, 85]) {
      life.age = age - 0.1;
      life.nextDecisionAt = Infinity;
      life.nextLogAt = Infinity;
      life.playing = true;
      advanceLife(life, 0.25, () => 0.99);
      assert.equal(life.age, age);
      assert.equal(life.pendingDecision?.id, "choice-will", race.id);
      chooseDecision(life, "will-legal", () => 0.5);
      life = deserializeLife(serializeLife(life));
      assert.equal(availableChoiceEvents(life).some((event) => event.id === "choice-will"), false);
    }
    assert.deepEqual(life.eventHistory.filter((entry) => entry.id === "choice-will").map((entry) => entry.age), [70, 85]);
    for (const age of [60, 69, 71, 78, 84, 86, 100]) {
      life.age = age;
      assert.equal(availableChoiceEvents(life).some((event) => event.id === "choice-will"), false);
    }
  }
});

test("will scheduling does not replay missed ages or let legacy entries block age 85", () => {
  const life = adultLife(44, { age: 80, occupation: "引退" }).life;
  life.eventHistory.push({ id: "choice-will", age: 60 });
  life.journal.push({ id: "choice-will", text: "昔の遺言" });
  assert.equal(availableChoiceEvents(life).some((event) => event.id === "choice-will"), false);
  life.age = 85;
  assert.ok(availableChoiceEvents(life).some((event) => event.id === "choice-will"));
  life.age = 86;
  assert.equal(availableChoiceEvents(life).some((event) => event.id === "choice-will"), false);
});

test("loading any save removes automatic household logs but keeps other events and balances", () => {
  for (const saveVersion of [1, SAVE_VERSION]) {
    const life = migrateLife({
      saveVersion, race: "human", nation: "kingdom", age: 80, gold: 123, debt: 45,
      journal: [
        { id: "finance-expense-32", text: "収入より支出が多い" },
        { id: "finance-shortfall", text: "借入枠を使い切った" },
        { label: "家計", text: "家計の通知" },
        { id: "wedding", text: "結婚した" },
      ],
    });
    assert.deepEqual(life.journal, [{ id: "wedding", text: "結婚した" }]);
    assert.equal(life.gold, 123);
    assert.equal(life.debt, 45);
  }
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
  assert.ok(!life.journal.at(-1).text.includes("友人一"));
  assert.ok(!life.journal.at(-1).text.includes("友人二"));
  assert.match(life.journal.at(-1).text, /友人へ均等に相続/);
});

test("steady living does not create money and deliberate saving yields only a small reserve", () => {
  const { life, random } = adultLife(45, { gold: 20 });
  decide(life, "steady", random);
  assert.equal(life.gold, 20);
  decide(life, "save", random);
  assert.equal(life.gold, 21);
});

test("ordinary wages build a retirement reserve instead of merely breaking even", () => {
  const farmer = adultLife(46, { occupation: "農作業", occupationRole: "農作業", occupationSkill: 0, occupationYears: 0 }).life;
  farmer.world = { situation: "平和" };
  const budget = monthlyBudget(farmer);
  assert.equal(budget.income.work, 3.5 * TUNING.wageMultiplier);
  assert.equal(budget.expenses.living, TUNING.adultLivingCostLegacyG);
  assert.equal(budget.expenses.rent, TUNING.homeRentLegacyG);
  assert.ok(budget.net >= 0.6 && budget.net < 1, "ordinary wages retain a meaningful but limited monthly surplus");
  const retirement = monthlyBudget({ ...farmer, age: 65, occupation: "引退", occupationRole: "引退" });
  const workingYears = 65 - 20;
  const savings = budget.net * 12 * workingYears;
  assert.ok(savings + retirement.net * 12 * 5 > savings * 0.75, "five retired years do not consume lifetime savings");
  assert.ok(savings + retirement.net * 12 * 25 > 0, "ordinary savings can support retirement to human age 90");
  const indebted = monthlyBudget({ ...farmer, debt: TUNING.ordinaryDebtLimit });
  assert.ok(indebted.repayment > 0 && indebted.net >= 0, "ordinary workers can pay down capped debt");
});

test("career salary previews label adverse conditions as occurring during that situation", () => {
  const life = adultLife(46, {
    age: 30, nextCareerReviewAt: 0,
    world: { situation: "魔王君臨" },
  }).life;
  const event = CHOICE_EVENTS.find((item) => item.id === "choice-work-offer");
  const choices = event.choicesFor(life).filter((choice) => choice.effect.startsWith("career-change:"));
  assert.ok(choices.length > 0);
  assert.ok(choices.every((choice) => choice.preview.some((line) => line.startsWith("月給（魔王君臨時）"))));
});

test("a working lifetime funds old age through monthly accounting for every race", () => {
  for (const race of RACES) {
    const life = adultLife(46, {
      race, gold: 0, age: 20, maxHumanAge: 120,
      occupation: "農作業", occupationRole: "農作業", occupationSkill: 0,
      nextCareerReviewAt: Infinity,
      npcs: [], children: [], spouseId: null,
      world: { situation: "平和", nextChangeAt: Infinity },
    }).life;
    const advanceTo = (age) => {
      let steps = 0;
      while (life.age < age && life.active && steps++ < 1000) {
        life.nextDecisionAt = Infinity;
        life.nextLogAt = Infinity;
        if (life.pendingDecision) {
          assert.equal(life.pendingDecision.id, "choice-will");
          chooseDecision(life, "will-legal", () => 0.99);
          life.nextDecisionAt = Infinity;
          life.nextLogAt = Infinity;
        }
        advanceLife(life, Math.min(0.25, age - life.age), () => 0.99);
      }
      assert.equal(life.age, age);
    };
    advanceTo(65);
    const savings = life.gold;
    decide(life, "retire-now", () => 0.99);
    advanceTo(70);
    assert.ok(life.gold > savings * 0.75, `${race.id}: savings survive the first five retired years`);
    advanceTo(100);
    assert.ok(life.gold > 0, `${race.id}: a long retirement retains savings`);
    assert.equal(life.debt, 0);
  }
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

test("ordinary lifetime savings build a reserve without unbounded wealth", () => {
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
      demonKingRiseAt: Infinity,
      demonKingStarted: true,
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
  console.log(`peak assets p50/p70/p90: ${peakAssets[Math.floor(peakAssets.length / 2)]}/${seventiethPercentile}/${ninetiethPercentile}`);
  assert.ok(seventiethPercentile >= homePrice && seventiethPercentile <= homePrice * 5,
    `70th percentile assets ${seventiethPercentile}G should include a retirement reserve without runaway wealth`);
  assert.ok(peakAssets.filter((assets) => assets < homePrice * 0.75).length > 0, "some workers remain below the home threshold");
  assert.ok(ninetiethPercentile < homePrice * 7, "ordinary careers retain an upper bound on typical lifetime savings");
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
  assert.deepEqual(TUNING.annualConceptionChanceByAge.map(({ chance }) => chance), [0.9, 0.9, 0.9, 0.9]);
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

test("failed conception attempts continue every year until a child is conceived", () => {
  const { life } = adultLife(9, { age: 28, gender: "男性" });
  const partner = { id: "wife", name: "配偶者", race: "human", humanAge: 27, alive: true, gender: "女性", relationship: "配偶者", occupation: "商人", history: [] };
  life.npcs = [partner];
  life.spouseId = partner.id;
  life.childPlan = "wants";
  life.tryingSince = life.age;
  life.tryingUntil = life.age + 1;
  life.tryingMotherAge = partner.humanAge;

  for (let quarter = 0; quarter < 4; quarter += 1) advanceLife(life, 0.25, () => 0.999);
  assert.equal(life.childPlan, "wants");
  assert.ok(life.tryingUntil > life.age);
  assert.ok(life.journal.some((entry) => /この年は子供を授からなかった/.test(entry.text)));
  for (let quarter = 0; quarter < 4; quarter += 1) advanceLife(life, 0.25, () => 0.999);
  assert.equal(life.childPlan, "wants");
  assert.equal(life.journal.filter((entry) => /この年は子供を授からなかった/.test(entry.text)).length, 2);
});

test("social encounters happen about half as often, while all races retain the same human-equivalent log cadence", () => {
  assert.equal(TUNING.socialMeanYears, 5.2);
  const life = createLife(seededRandom(123));
  assert.ok(life.nextSocialAt >= 13);
  assert.equal(routineLogMean({ race: RACES.find((race) => race.id === "demon") }), routineLogMean({ race: RACES[0] }));
});

test("the demon king causes a prolonged downturn and offers the appropriate role-specific choice", () => {
  const { life } = adultLife(91, {
    age: 44.9,
    occupation: "兵士",
    occupationSkill: 30,
    demonKingStarted: false,
    demonKingActive: false,
    demonKingRiseAt: 45,
  });
  life.world = { situation: "平和", since: life.age, nextChangeAt: Infinity };
  advanceLife(life, 0.25, () => 0.99);
  assert.equal(life.world.situation, "魔王君臨");
  assert.match(life.journal.find((event) => event.id === "demon-king-rise").text, /北に魔王が君臨/);
  assert.equal(life.pendingDecision.id, "choice-demon-king");
  const farmer = { ...life, occupation: "農作業" };
  assert.ok(monthlyBudget(farmer).income.work < monthlyBudget({ ...farmer, world: { situation: "平和" } }).income.work);
  const merchant = { ...life, occupation: "商人" };
  assert.ok(monthlyBudget(merchant).income.work < monthlyBudget({ ...merchant, world: { situation: "平和" } }).income.work);

  life.gold = 0;
  const fameBefore = life.fame;
  decide(life, "demon-king-join", () => 0.5);
  assert.equal(life.gold, 200);
  assert.equal(life.fame, fameBefore + 20);
  assert.equal(life.demonKingDefeated, true);
  assert.equal(life.world.situation, "平和");
  assert.equal(life.demonKingHazardPending, true, "participation carries a deferred injury/death risk");

  const cleric = adultLife(92, {
    age: 47.5,
    occupation: "聖職者",
    demonKingActive: true,
    demonKingStarted: true,
  }).life;
  const clericGold = cleric.gold;
  decide(cleric, "demon-relief", () => 0);
  assert.equal(cleric.gold, clericGold + 50);
  assert.equal(cleric.fame, 30);
  assert.equal(cleric.illness.type, "trauma");
  assert.equal(cleric.illness.name, "精神的トラウマ");

  const civilian = adultLife(93, { age: 47.5, occupation: "農作業", demonKingActive: true }).life;
  assert.equal(availableChoiceEvents(civilian).some((event) => event.id === "choice-demon-king" || event.id === "choice-demon-relief"), false);

  const externalVictory = adultLife(94, { age: 50, occupation: "引退", demonKingActive: true, demonKingStarted: true }).life;
  externalVictory.world = { situation: "魔王君臨", since: 50, nextChangeAt: 50 + TUNING.demonKingDurationYears };
  externalVictory.situation = "魔王君臨";
  for (let quarter = 0; quarter < TUNING.demonKingDurationYears * 4; quarter += 1) advanceLife(externalVictory, 0.25, () => 0.99);
  assert.equal(externalVictory.demonKingDefeated, true);
  assert.equal(externalVictory.world.situation, "平和");
});

test("fame milestones are logged only once when crossing their thresholds", () => {
  const life = makeLife({ fame: 0, home: "農村" });
  applyRoutineEffect(life, { effect: { fame: 120 } }, () => 0.5);
  decide(life, "steady", () => 0.5);
  const milestones = life.journal.filter((event) => event.id?.startsWith("fame-milestone-"));
  assert.deepEqual(milestones.map((event) => event.id), ["fame-milestone-25", "fame-milestone-50", "fame-milestone-100"]);
  assert.match(milestones[0].text, /村のみんな/);
  assert.match(milestones[1].text, /村一番/);
  assert.match(milestones[2].text, /歴史に刻まれた/);
  decide(life, "steady", () => 0.5);
  assert.equal(life.journal.filter((event) => event.id?.startsWith("fame-milestone-")).length, 3);
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
  assert.deepEqual(event.choicesFor(life).map((choice) => choice.effect), [
    "keep-working", "retire-now", "retirement-neighbor-help",
  ]);

  const second = adultLife(23, { age: 65, occupation: "教師" }).life;
  decide(second, "retire-now", seededRandom(1));
  assert.equal(second.occupation, "引退");
  assert.equal(second.retiredOccupation, "教師");

  const lightWork = adultLife(24, { age: 65, occupation: "農作業" }).life;
  decide(lightWork, "retirement-neighbor-help", seededRandom(1));
  assert.equal(lightWork.occupation, "隣家の手伝い");
  assert.equal(monthlyBudget(lightWork).income.work, 2);

  const skilled = adultLife(25, { age: 65, occupation: "農作業", occupationSkill: 60 }).life;
  assert.ok(event.choicesFor(skilled).some((choice) => choice.effect === "retirement-take-apprentice"));
  decide(skilled, "retirement-take-apprentice", seededRandom(1));
  assert.equal(skilled.occupation, "引退");
  assert.equal(skilled.retiredOccupation, "農作業");
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

test("monthly shortfalls still respect the debt cap without household journal spam", () => {
  const { life } = adultLife(24, { age: 30, occupation: "失業中", gold: 0, debt: 0 });
  life.nextDecisionAt = 100;
  life.nextLogAt = 100;
  life.nextSocialAt = 100;
  life.world = { situation: "平和", nextChangeAt: 100 };
  advanceLife(life, 0.25, () => 0.9);
  assert.equal(life.gold, 0);
  assert.ok(life.debt > 0 && life.debt <= TUNING.ordinaryDebtLimit);
  assert.equal(life.financialHardship, true);
  assert.ok(life.finance.recent.some((item) => item.label === "生活費の借入"));
  assert.equal(life.journal.some((event) => event.label === "家計" || event.id?.startsWith("finance-")), false);

  for (let year = 0; year < 80; year += 1) advanceLife(life, 0.25, () => 0.99);
  assert.equal(life.debt, TUNING.ordinaryDebtLimit);
  assert.equal(life.journal.some((event) => /借入上限/.test(event.text)), false);
});

test("illness settings use the revised treatment rates and treatment failure is not immediate death", () => {
  assert.deepEqual(TUNING.treatmentSuccess, {
    infection: { ordinary: 0.75, magic: 0.95 },
    pneumonia: { ordinary: 0.45, magic: 0.8 },
    tuberculosis: { ordinary: 0.15, magic: 0.65 },
    fracture: { ordinary: 0.65, magic: 0.9 },
    severeInjury: { ordinary: 0.2, magic: 0.65 },
    trauma: { ordinary: 0.6, magic: 0.85 },
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
  assert.ok(failed.nextDecisionAt > failed.age, "failed treatment waits for the condition to worsen before asking again");

  const recovered = adultLife(27, { gold: 100 }).life;
  recovered.illness = { type: "pneumonia", name: "肺炎", severity: "中等症", since: recovered.age, duration: 0.4 };
  recovered.health = "療養中";
  const bodyBefore = recovered.baseStats.body;
  decide(recovered, "illness-ordinary-treatment", () => 0);
  assert.equal(recovered.illness, null);
  assert.equal(recovered.health, "健やか");
  assert.equal(recovered.baseStats.body, bodyBefore - 6, "a severe enough successful treatment can leave a related aftereffect");

  const injured = adultLife(28, { gold: 0, debt: 0 }).life;
  injured.illness = { type: "fracture", name: "骨折", severity: "中等症", since: injured.age, duration: 0.4 };
  injured.health = "療養中";
  assert.equal(choiceAvailability(injured, "illness-ordinary-treatment").cost, 5);
  assert.equal(choiceAvailability(injured, "illness-ordinary-treatment").disabledReason, null);
  assert.equal(choiceAvailability(injured, "illness-magic-treatment").cost, 20);
  decide(injured, "illness-ordinary-treatment", () => 0);
  assert.equal(injured.debt, 5, "medical care can borrow the shortfall");
  assert.equal(injured.illness, null);

  const worsening = adultLife(29, { age: 30 }).life;
  worsening.illness = { type: "fracture", name: "骨折", severity: "中等症", since: 29, duration: 0.4 };
  worsening.illnessUntil = worsening.age + TUNING.injuryReviewYears;
  worsening.health = "療養中";
  worsening.nextDecisionAt = Infinity;
  for (let quarter = 0; quarter < 9; quarter += 1) advanceLife(worsening, 0.25, () => 0.99);
  assert.equal(worsening.illness.severity, "重症");
  assert.equal(worsening.pendingDecision?.id, "choice-illness-treatment");
  assert.ok(worsening.journal.some((event) => /以前負った怪我が悪化/.test(event.text)));
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

test("periodic job changes offer up to three destinations with an explanatory note", () => {
  const event = CHOICE_EVENTS.find((candidate) => candidate.id === "choice-work-offer");
  const life = makeLife({ age: 30, occupation: "職人見習い", skills: { literacy: 0, trade: 5, scholarship: 5, magic: 0, craft: 5 }, mana: 0 });
  life.nextCareerReviewAt = 30;
  assert.equal(isRoutineEventEligible(life, event), true);
  life.nextCareerReviewAt = 40;
  assert.equal(isRoutineEventEligible(life, event), false, "not before the scheduled review");
  life.nextCareerReviewAt = 30;
  const choices = event.choicesFor(life);
  assert.equal(choices.at(-1).effect, "steady");
  const jobs = choices.slice(0, -1);
  assert.ok(jobs.length >= 1 && jobs.length <= 3);
  assert.ok(jobs.every((choice) => choice.effect.startsWith("career-change:")));
  assert.ok(jobs.every((choice) => choice.preview.some((line) => line.startsWith("メリット:")) || choice.preview.length <= 2));
  const recessionOptions = event.choicesFor({
    ...life, occupation: "失業中", skills: { ...life.skills, trade: 5 }, world: { situation: "不況" },
  });
  assert.ok(recessionOptions[0].preview[0].includes("不況"));
  event.prepare(life, () => 0.5, {});
  assert.ok(life.nextCareerReviewAt >= 35 && life.nextCareerReviewAt <= 40, "next review comes 5-10 years later");
});

function firstCareerJobs(life) {
  const event = CHOICE_EVENTS.find((candidate) => candidate.id === "choice-first-career");
  return event.choicesFor(life).filter((choice) => choice.effect.startsWith("career-first:")).map((choice) => choice.effect.split(":")[1]);
}

test("the first career choice is built from abilities and is offered after leaving school", () => {
  const strong = makeLife({ age: 14, occupation: "家業の手伝い", baseStats: { body: 85, combat: 80, intellect: 50, dexterity: 45, charm: 50, luck: 50 } });
  const strongJobs = firstCareerJobs(strong);
  assert.equal(strongJobs.length, 3);
  assert.ok(strongJobs.includes("兵士"));
  assert.ok(!strongJobs.includes("冒険者"), "adventuring requires age 15");
  strong.age = 15;
  assert.ok(firstCareerJobs(strong).includes("冒険者"));
  const plain = makeLife({ age: 14, occupation: "家業の手伝い", baseStats: { body: 45, combat: 40, intellect: 50, dexterity: 50, charm: 50, luck: 50 } });
  const plainJobs = firstCareerJobs(plain);
  assert.equal(plainJobs.length, 3);
  assert.ok(!plainJobs.includes("兵士") && !plainJobs.includes("冒険者"));
  assert.ok(plainJobs.includes("農作業") || plainJobs.includes("服飾店の見習い"));

  const life = createLife(() => 0.5);
  life.race = RACES[0];
  life.started = true;
  life.playing = true;
  life.nextLogAt = Infinity;
  life.nextSocialAt = Infinity;
  life.world.nextChangeAt = Infinity;
  life.pendingDecision = null;
  life.age = 7;
  life.eventHistory.push({ id: "edu-childhood", age: 6 });
  life.nextDecisionAt = Infinity;
  decide(life, "edu-town-school", () => 0.5);
  for (let step = 0; step < 60 && !life.pendingDecision; step += 1) advanceLife(life, 0.25, () => 0.5);
  assert.ok(life.journal.some((entry) => entry.text.includes("町の学校を卒業した")));
  assert.equal(life.pendingDecision?.title, "進路を決める");
  assert.ok(life.pendingDecision.choices.some((choice) => choice.effect === "path-academy"));
  chooseDecision(life, life.pendingDecision.choices[0].effect, () => 0.5);
  assert.notEqual(life.occupation, "家業の手伝い");
  assert.ok(life.historyFlags.includes("first-career-done"));
});

test("a child who never attends school still reaches the career choice, and giving up on academy returns to it", () => {
  const life = createLife(() => 0.5);
  life.race = RACES[0];
  life.started = true;
  life.playing = true;
  life.nextLogAt = Infinity;
  life.nextSocialAt = Infinity;
  life.world.nextChangeAt = Infinity;
  life.age = 14;
  life.nextDecisionAt = Infinity;
  for (let step = 0; step < 8 && !life.pendingDecision; step += 1) advanceLife(life, 0.25, () => 0.5);
  assert.equal(life.pendingDecision?.title, "進路を決める");
  chooseDecision(life, "path-academy", () => 0.5);
  advanceLife(life, 0.25, () => 0.5);
  assert.equal(life.pendingDecision?.id, "edu-academy");
  chooseDecision(life, "academy-skip", () => 0.5);
  advanceLife(life, 0.25, () => 0.5);
  assert.equal(life.pendingDecision?.title, "進路を決める");
  assert.ok(!life.pendingDecision.choices.some((choice) => choice.effect === "path-academy"));
});

test("a calling from the church lets a magically gifted character become a priest after years of service", () => {
  const call = CHOICE_EVENTS.find((event) => event.id === "choice-church-calling");
  const gifted = makeLife({ age: 20, occupation: "農作業", mana: 30 });
  assert.equal(isRoutineEventEligible(gifted, call), true);
  assert.equal(isRoutineEventEligible({ ...gifted, mana: 5 }, call), false);
  decide(gifted, "church-join", () => 0.5);
  assert.equal(gifted.occupation, "聖職者");
  const trainee = monthlyBudget(gifted).income.work;
  gifted.occupationYears = 9;
  gifted.age = 30;
  decide(gifted, "promotion-apply", () => 0);
  assert.equal(gifted.occupationRole, "司祭");
  assert.ok(monthlyBudget(gifted).income.work > trainee * 2);
});

test("practising skills raises the matching base ability", () => {
  const life = makeLife({ age: 20, occupation: "兵士", skills: { combat: 0 }, baseStats: { body: 50, combat: 50, intellect: 50, dexterity: 50, charm: 50, luck: 50 } });
  decide(life, "work-mentor-training", () => 0.5);
  assert.ok(life.baseStats.combat > 50);
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
  assert.ok(logs >= 110 && logs <= 230);
  assert.ok(decisions >= 12 && decisions <= 35);
});

test("monthly budget includes lifestyle and home upkeep so savings stay modest", () => {
  const life = makeLife({ age: 30, occupation: "農作業", occupationRole: "農作業", occupationSkill: 0, world: { situation: "平和" } });
  const budget = monthlyBudget(life);
  assert.ok(budget.expenses.lifestyle > 0);
  assert.equal(budget.expenses.upkeep, 0);
  const owner = { ...life, ownsHome: true, homeType: "small", homeValue: 120 };
  assert.ok(monthlyBudget(owner).expenses.upkeep > 0, "owned homes need upkeep");
  const rich = { ...life, occupationRole: "農地所有者" };
  assert.ok(monthlyBudget(rich).expenses.lifestyle > budget.expenses.lifestyle, "lifestyle costs grow with rank");
});

test("お金を使う options require funds, apply effects and respect cooldowns", () => {
  const life = createLife(() => 0.5);
  Object.assign(life, { started: true, age: 30, gold: 100, skills: { ...life.skills }, occupation: "農作業" });
  const options = spendOptions(life);
  assert.ok(options.length >= 8);
  assert.ok(options.find((o) => o.id === "repair-home").disabledReason, "needs a home");
  const before = life.gold;
  const result = spendMoney(life, "buy-books");
  assert.ok(result);
  assert.ok(life.gold < before);
  assert.ok(life.journal.at(-1).text.includes("参考書"));
  assert.equal(spendMoney(life, "buy-books"), null, "cooldown applies");
  life.gold = 1;
  assert.equal(spendMoney(life, "party"), null, "too poor");
  assert.ok(spendOptions(life).find((o) => o.id === "party").disabledReason.includes("所持金"));
  life.gold = 100;
  const happy = life.happiness;
  spendMoney(life, "keep-pet");
  assert.ok(life.happiness > happy);
  assert.equal(spendMoney(life, "keep-pet"), null, "only one pet");
});

test("a newborn child is named by choosing among suggested names", () => {
  const life = createLife(() => 0.5);
  const child = { id: "kid", name: "仮・名", relationship: "子", humanAge: 0, alive: true, gender: "女性", affinity: 70, nameDecided: false, history: [] };
  life.npcs.push(child);
  life.children = ["kid"];
  life.started = true;
  life.playing = true;
  life.nextDecisionAt = life.age;
  advanceLife(life, 0.1, () => 0.5);
  assert.equal(life.pendingDecision?.title, "子どもの名前");
  assert.equal(life.pendingDecision.choices.length, 3);
  assert.equal(life.pendingDecision.nameInput, undefined, "there is no free-text name field");
  const candidate = life.pendingDecision.choices[0].effect.slice("name-child:".length);
  chooseDecision(life, life.pendingDecision.choices[0].effect);
  assert.equal(child.name.split("・")[0], candidate.split("・")[0]);
  assert.equal(child.nameDecided, true);
});

test("child milestones offer schooling, wedding and home funding choices with costs", () => {
  const life = createLife(() => 0.5);
  life.gold = 100;
  life.started = true;
  life.age = 40;
  const child = { id: "kid", name: "アリア", relationship: "子", humanAge: 13, alive: true, gender: "女性", affinity: 50, history: [] };
  life.npcs.push(child);
  life.children = ["kid"];
  life.playing = true;
  life.pendingDecision = null;
  life.nextDecisionAt = life.age;
  advanceLife(life, 0.1, () => 0.5);
  assert.ok(life.pendingDecision.copy.includes("アリア"));
  chooseDecision(life, "child-school-academy");
  assert.equal(child.education, "学院");
  assert.equal(life.gold, 50);
  Object.assign(child, { humanAge: 25, independent: true, maritalStatus: "既婚", spouseName: "ロイ" });
  life.playing = true;
  life.nextDecisionAt = life.age;
  advanceLife(life, 0.1, () => 0.5);
  assert.ok(life.pendingDecision.id.startsWith("choice-child-"));
  const decision = life.pendingDecision;
  const effect = decision.choices[0].effect;
  chooseDecision(life, effect);
  assert.ok(life.gold < 50);
});
