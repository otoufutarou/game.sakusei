import { advanceLife, actualAge, chooseDecision, createLife, occupationTitle } from "./simulation.js";
import { characterSprite, drawJourney } from "./character-sprite.js";

const $ = (selector) => document.querySelector(selector);
const elements = {
  worldStatus: $("#world-status"),
  year: $("#year-display"),
  chapter: $("#chapter-display"),
  age: $("#age-badge"),
  characterName: $("#character-name"),
  characterSummary: $("#character-summary"),
  race: $("#race-tag"),
  status: $("#status-tag"),
  home: $("#home-detail"),
  occupation: $("#occupation-detail"),
  sceneCaption: $("#scene-caption"),
  canvas: $("#character-canvas"),
  play: $("#toggle-play"),
  next: $("#next-decision"),
  indicator: $("#flow-indicator"),
  gold: $("#gold-value"),
  health: $("#health-value"),
  fame: $("#fame-value"),
  people: $("#people-value"),
  eventCount: $("#event-count"),
  eventList: $("#event-list"),
  historyPage: $("#history-page"),
  historyList: $("#history-list"),
  prologueDialog: $("#prologue-dialog"),
  prologueCopy: $("#prologue-copy"),
  birthRecord: $("#birth-record"),
  beginLife: $("#begin-life"),
  decisionDialog: $("#decision-dialog"),
  decisionAge: $("#decision-age"),
  decisionTitle: $("#decision-title"),
  decisionCopy: $("#decision-copy"),
  choices: $("#choice-list"),
  endingDialog: $("#ending-dialog"),
  endingCopy: $("#ending-copy"),
  endingRecord: $("#ending-record"),
};

let life = createLife();
let renderedEventCount = 0;
let lastTimestamp = 0;
let lastDrawAt = 0;
let fastForwardToDecision = false;
let currentDecisionId = null;
let random = Math.random;

function formatAge() {
  return `${actualAge(life)}歳`;
}

function createJournalItem(event) {
  const item = document.createElement("li");
  item.className = `event-item ${event.kind === "decision" ? "decision-event" : ""} ${event.kind === "world" ? "world-event" : ""} ${event.kind === "death" ? "death-event" : ""}`;
  const age = document.createElement("span");
  age.className = "event-age";
  age.textContent = `${Math.floor(event.age * life.race.multiplier)}歳`;
  const content = document.createElement("div");
  content.className = "event-content";
  const label = document.createElement("span");
  label.className = "event-kind";
  label.textContent = event.label;
  const text = document.createElement("div");
  text.textContent = event.text;
  content.append(label, text);
  item.append(age, content);
  return item;
}

function addJournalEvents() {
  if (renderedEventCount === life.journal.length) return;
  const events = life.journal.slice(-3).reverse();
  elements.eventList.replaceChildren(...events.map(createJournalItem));
  if (!elements.historyPage.hidden) renderHistory();
  renderedEventCount = life.journal.length;
  elements.eventCount.textContent = String(life.eventCount);
}

function renderHistory() {
  elements.historyList.replaceChildren(...life.journal.slice().reverse().map(createJournalItem));
}

function showPrologue() {
  const { parents } = life;
  elements.prologueCopy.textContent = `あなたは${life.nation.name}の${life.home}で、${life.race.name}として生を受けた。`;
  const records = [
    ["種族", life.race.name],
    ["最高寿命", `${life.race.lifespan}歳`],
    ["成人年齢", `${Math.floor(18 * life.race.multiplier)}歳`],
    ["出生国", life.nation.name],
    ["出生地", life.home],
    ["身分", life.status.name],
    ["父の職業", parents.father],
    ["母の職業", parents.mother],
    ["家庭の財産", `${parents.gold}G`],
    ["家庭の借金", `${parents.debt}G`],
    ["出生時の魔力", life.magicPower],
  ];
  elements.birthRecord.replaceChildren();
  for (const [labelText, valueText] of records) {
    const cell = document.createElement("div");
    const label = document.createElement("small");
    const value = document.createElement("strong");
    label.textContent = labelText;
    value.textContent = valueText;
    cell.append(label, value);
    elements.birthRecord.append(cell);
  }
  elements.prologueDialog.showModal();
}

function beginLife() {
  life.started = true;
  life.playing = true;
  elements.prologueDialog.close();
  lastTimestamp = 0;
  updateControls();
}

function updateControls() {
  const waiting = Boolean(life.pendingDecision);
  const ended = !life.active;
  const paused = !life.playing;
  elements.play.disabled = ended || waiting || !life.started;
  elements.play.innerHTML = life.playing ? 'Ⅱ <span>一時停止</span>' : '▶ <span>再開</span>';
  elements.play.setAttribute("aria-label", life.playing ? "一時停止" : "再開");
  elements.next.disabled = ended || waiting || !life.started;
  elements.indicator.classList.toggle("paused", paused);
  elements.indicator.innerHTML = `<i></i>${ended ? "人生の終わり" : waiting ? "決断待ち" : paused ? "一時停止" : "進行中"}`;
  document.querySelectorAll("[data-speed]").forEach((button) => {
    const selected = Number(button.dataset.speed) === life.speed;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
    button.disabled = ended || !life.started;
  });
}

function updateLifeDisplay() {
  elements.worldStatus.textContent = life.situation === "平和" ? "世界は穏やかです" : `${life.nation.name} — ${life.situation}`;
  elements.year.textContent = `人間換算 ${Math.floor(life.age)}年`;
  elements.chapter.textContent = String(Math.min(99, Math.floor(life.age / 10) + 1)).padStart(2, "0");
  elements.age.textContent = formatAge();
  elements.characterName.textContent = life.name;
  const humanAge = Math.floor(life.age);
  elements.characterSummary.textContent = `${life.gender} · 人間換算 ${humanAge} 歳`;
  elements.race.textContent = life.race.name;
  elements.status.textContent = life.status.name;
  elements.home.textContent = `${life.nation.name}・${life.home}`;
  elements.occupation.textContent = `${occupationTitle(life)} ${life.occupationRank}・技能${Math.floor(life.occupationSkill)}・勤続${Math.floor(life.occupationYears)}年`;
  elements.sceneCaption.textContent = life.race.id === "dragon" ? "山の巣のそば" : life.age < 6 ? "新しい物語のはじまり" : life.home;
  elements.canvas.parentElement.dataset.region = life.race.id === "dragon" ? "dragon" : life.nation.id;
  elements.gold.textContent = `${Math.floor(life.gold)} G${life.debt > 0 ? ` · 借金${Math.floor(life.debt)}G` : ""}`;
  elements.health.textContent = life.health;
  elements.fame.textContent = life.fame > 20 ? "知られた人" : life.fame > 5 ? "少し知られる" : "無名";
  const family = [
    life.spouse ? "配偶者" : "",
    life.children.length ? `子 ${life.children.length}人` : "",
    life.siblings ? `きょうだい ${life.siblings}人` : "",
  ].filter(Boolean);
  elements.people.textContent = family.length
    ? family.join("・")
    : life.relationships.length > 0 ? `友人 ${life.relationships.length}人` : "家族";
}

function showDecision() {
  const decision = life.pendingDecision;
  if (!decision || elements.decisionDialog.open || currentDecisionId === decision.id) return;
  currentDecisionId = decision.id;
  elements.decisionAge.textContent = formatAge();
  elements.decisionTitle.textContent = decision.title;
  elements.decisionCopy.textContent = decision.copy;
  elements.choices.replaceChildren();
  for (const choice of decision.choices) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-button";
    button.textContent = choice.label;
    button.addEventListener("click", () => {
      chooseDecision(life, choice.effect, random);
      currentDecisionId = null;
      elements.decisionDialog.close();
      addJournalEvents();
      updateLifeDisplay();
      updateControls();
    });
    elements.choices.append(button);
  }
  elements.decisionDialog.showModal();
  updateControls();
}

function showEnding() {
  if (life.active || elements.endingDialog.open) return;
  fastForwardToDecision = false;
  elements.endingCopy.textContent = `${life.name}は${life.nation.name}の${life.status.name}の家に生まれ、人間換算${Math.floor(life.deathAge)}年の人生を歩みました。`;
  elements.endingRecord.replaceChildren();
  const records = [
    ["種族", life.race.name],
    ["実年齢", `${Math.floor(life.deathAge * life.race.multiplier)}歳`],
    ["人間換算", `${Math.floor(life.deathAge)}年`],
    ["最期", life.deathCause],
    ["最後の仕事", occupationTitle(life)],
    ["財産", `${Math.floor(life.gold)} G`],
    ["人生の記録", `${life.eventCount} 件`],
  ];
  for (const [labelText, valueText] of records) {
    const cell = document.createElement("div");
    const label = document.createElement("small");
    const value = document.createElement("strong");
    label.textContent = labelText;
    value.textContent = valueText;
    cell.append(label, value);
    elements.endingRecord.append(cell);
  }
  elements.endingDialog.showModal();
  updateControls();
}

function drawScene(timestamp, force = false) {
  if (!force && timestamp - lastDrawAt < 180) return;
  lastDrawAt = timestamp;
  const frame = Math.floor(timestamp / 380) % 2;
  drawJourney(elements.canvas.getContext("2d"), characterSprite, { life, frame });
  elements.canvas.setAttribute("aria-label", `${life.playing ? "歩く" : "待機する"}${life.race.name}の主人公`);
}

function tick(timestamp) {
  if (!lastTimestamp) lastTimestamp = timestamp;
  const elapsedSeconds = Math.min((timestamp - lastTimestamp) / 1000, 0.2);
  lastTimestamp = timestamp;
  if (life.active && life.playing) {
    const speed = fastForwardToDecision ? 8 : life.speed;
    advanceLife(life, elapsedSeconds * 0.1 * speed, random);
    addJournalEvents();
    updateLifeDisplay();
    if (life.pendingDecision) {
      fastForwardToDecision = false;
      showDecision();
    }
    if (!life.active) showEnding();
  }
  if (timestamp - lastDrawAt > 180) drawScene(timestamp);
  requestAnimationFrame(tick);
}

function startNewLife() {
  if (elements.decisionDialog.open) elements.decisionDialog.close();
  if (elements.endingDialog.open) elements.endingDialog.close();
  if (elements.prologueDialog.open) elements.prologueDialog.close();
  life = createLife();
  renderedEventCount = 0;
  lastTimestamp = 0;
  fastForwardToDecision = false;
  currentDecisionId = null;
  elements.eventList.replaceChildren();
  addJournalEvents();
  updateLifeDisplay();
  updateControls();
  drawScene(performance.now(), true);
  showPrologue();
}

elements.play.addEventListener("click", () => {
  if (!life.active || life.pendingDecision) return;
  life.playing = !life.playing;
  lastTimestamp = 0;
  updateControls();
});
elements.prologueDialog.addEventListener("cancel", (event) => event.preventDefault());
elements.decisionDialog.addEventListener("cancel", (event) => event.preventDefault());
elements.endingDialog.addEventListener("cancel", (event) => event.preventDefault());
elements.next.addEventListener("click", () => {
  if (!life.active || life.pendingDecision) return;
  life.playing = true;
  fastForwardToDecision = true;
  lastTimestamp = 0;
  updateControls();
});
document.querySelectorAll("[data-speed]").forEach((button) => {
  button.addEventListener("click", () => {
    life.speed = Number(button.dataset.speed);
    updateControls();
  });
});
$("#new-life").addEventListener("click", startNewLife);
$("#ending-new-life").addEventListener("click", startNewLife);
elements.beginLife.addEventListener("click", beginLife);
$("#open-history").addEventListener("click", () => {
  elements.historyPage.hidden = false;
  renderHistory();
});
$("#open-history-inline").addEventListener("click", () => {
  elements.historyPage.hidden = false;
  renderHistory();
});
$("#close-history").addEventListener("click", () => {
  elements.historyPage.hidden = true;
});

addJournalEvents();
updateLifeDisplay();
updateControls();
drawScene(performance.now(), true);
showPrologue();
requestAnimationFrame(tick);
