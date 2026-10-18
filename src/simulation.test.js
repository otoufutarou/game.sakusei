import test from "node:test";
import assert from "node:assert/strict";
import {
  RACES,
  ROUTINE_EVENTS,
  applyChoice,
  isRoutineEventEligible,
  routineLogMean,
  selectRoutineEvent,
} from "./simulation.js";

function makeLife(overrides = {}) {
  return {
    age: 20,
    active: true,
    playing: false,
    eventCount: 0,
    race: RACES[0],
    nation: { id: "kingdom" },
    occupation: "職人見習い",
    occupationSkill: 10,
    gold: 30,
    journal: [],
    eventHistory: [],
    historyFlags: [],
    ...overrides,
  };
}

test("routine log interval scales with each race's age multiplier", () => {
  for (const race of RACES) {
    assert.equal(routineLogMean(makeLife({ race })), race.multiplier);
  }
});

test("routine event requirements filter race, nation, age, and state", () => {
  const demonEvent = ROUTINE_EVENTS.find((event) => event.id === "demon-magic");
  const imperialEvent = ROUTINE_EVENTS.find((event) => event.id === "empire-draft");
  assert.equal(isRoutineEventEligible(makeLife(), demonEvent), false);
  assert.equal(isRoutineEventEligible(makeLife({ race: RACES.find((race) => race.id === "demon") }), demonEvent), true);
  assert.equal(isRoutineEventEligible(makeLife(), imperialEvent), false);
  assert.equal(isRoutineEventEligible(makeLife({ nation: { id: "empire" } }), imperialEvent), true);
  assert.equal(isRoutineEventEligible(makeLife({ age: 10, race: RACES.find((race) => race.id === "demon") }), demonEvent), false);
  assert.equal(isRoutineEventEligible(makeLife({ gold: 2 }), ROUTINE_EVENTS.find((event) => event.id === "trade-opportunity")), false);
});

test("routine selection does not repeat a recent event ID", () => {
  const life = makeLife();
  const first = selectRoutineEvent(life, () => 0);
  life.journal.push({ id: first.id });
  life.eventHistory.push({ id: first.id, age: life.age });
  const second = selectRoutineEvent(life, () => 0);
  assert.ok(first);
  assert.ok(second);
  assert.notEqual(second.id, first.id);
  assert.equal(isRoutineEventEligible(life, first), false);
});

test("choice outcomes unlock later events through persistent state", () => {
  const life = makeLife({ occupationSkill: 0, gold: 10 });
  life.pendingDecision = { choices: [{ effect: "invest" }] };
  applyChoice(life, { effect: "invest" }, () => 0.5);
  const followUp = ROUTINE_EVENTS.find((event) => event.id === "tool-investment");
  assert.equal(life.occupationSkill, 5);
  assert.ok(life.historyFlags.includes("invested-in-tools"));
  assert.equal(isRoutineEventEligible(life, followUp), true);
  assert.equal(isRoutineEventEligible(makeLife({ occupationSkill: 5 }), followUp), false);
});
