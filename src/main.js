import {
  actualAge, advanceLife, chooseDecision, createLife, formatGold, livingChildren, monthlyBudget, occupationSkillName, occupationTitle, skillTier, SKILL_IDS_LIST, spendMoney, spendOptions,
} from "./simulation.js";
import { characterSprite, drawJourney, lifeStage, livingFamily } from "./character-sprite.js";
import { STAT_KEYS, STAT_LABELS, abilityLabel, currentStats, magicTier, skillName } from "./stats.js";
import { clearSave, inspectSave, saveToStorage } from "./save.js";

const BUILD_ID = "__BUILD_ID__";
// Prevent the synchronous next-decision jump from running forever if the event scheduler fails to yield.
const NEXT_DECISION_STEP_LIMIT = 100;

const $ = (selector) => document.querySelector(selector);
const elements = {
  worldStatus: $("#world-status"),
  age: $("#age-badge"),
  characterName: $("#character-name"),
  characterSummary: $("#character-summary"),
  occupation: $("#occupation-value"),
  sceneCaption: $("#scene-caption"),
  canvas: $("#character-canvas"),
  lifeProgress: $("#life-progress"),
  lifeProgressFill: $("#life-progress-fill"),
  lifeProgressLabel: $("#life-progress-label"),
  play: $("#toggle-play"),
  next: $("#next-decision"),
  indicator: $("#flow-indicator"),
  gold: $("#gold-value"),
  health: $("#health-value"),
  people: $("#people-value"),
  abilityRows: new Map([...document.querySelectorAll("[data-stat-key]")].map((row) => [row.dataset.statKey, row])),
  eventCount: $("#event-count"),
  eventList: $("#event-list"),
  historyPage: $("#history-page"),
  historyList: $("#history-list"),
  prologueDialog: $("#prologue-dialog"),
  prologueCopy: $("#prologue-copy"),
  prologueNote: $("#prologue-note"),
  birthRecord: $("#birth-record"),
  beginLife: $("#begin-life"),
  resumeLife: $("#resume-life"),
  decisionDialog: $("#decision-dialog"),
  decisionAge: $("#decision-age"),
  decisionTitle: $("#decision-title"),
  decisionCopy: $("#decision-copy"),
  choices: $("#choice-list"),
  resultDialog: $("#result-dialog"),
  statusDialog: $("#status-dialog"),
  statusBody: $("#status-body"),
  spendDialog: $("#spend-dialog"),
  spendSummary: $("#spend-summary"),
  spendList: $("#spend-list"),
  moneyDialog: $("#money-dialog"),
  moneyBody: $("#money-body"),
  endingDialog: $("#ending-dialog"),
  endingCopy: $("#ending-copy"),
  endingRecord: $("#ending-record"),
};

elements.buildId = $("#build-id");
elements.buildId.textContent = `build: ${BUILD_ID}`;

let life = createLife();
let nextDecisionLimitReached = false;
let renderedEventCount = 0;
let lastTimestamp = 0;
let lastSceneKey = null;
let lastSaveAt = 0;
let previousAbilityValues = {};
const abilityChangeTimers = new WeakMap();
let currentDecisionId = null;
let random = Math.random;

const element = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

function formatAge(target = life) {
  return `${actualAge(target)}歳`;
}

function humanAgeNote(target = life) {
  return target.race.multiplier > 1 ? `（人間換算 ${Math.floor(target.age)}歳）` : "";
}

function money(value) {
  return formatGold(value);
}

function createJournalItem(event) {
  const item = element("li", `event-item ${event.kind === "decision" ? "decision-event" : ""} ${event.kind === "world" ? "world-event" : ""} ${event.kind === "death" ? "death-event" : ""}`);
  const content = element("div", "event-content", event.text);
  item.append(element("span", "event-age", `${Math.floor(event.age * life.race.multiplier)}歳`), content);
  return item;
}

function addJournalEvents() {
  if (renderedEventCount === life.journal.length) return;
  elements.eventList.replaceChildren(...life.journal.slice(-4).reverse().map(createJournalItem));
  if (!elements.historyPage.hidden) renderHistory();
  renderedEventCount = life.journal.length;
  elements.eventCount.textContent = String(life.eventCount);
}

function renderHistory() {
  elements.historyList.replaceChildren(...life.journal.slice().reverse().map(createJournalItem));
}

function fillRecords(container, records) {
  container.replaceChildren();
  for (const [labelText, valueText] of records) {
    const cell = element("div");
    cell.append(element("small", "", labelText), element("strong", "", String(valueText)));
    container.append(cell);
  }
}

function showPrologue() {
  const { parents } = life;
  elements.prologueCopy.textContent = `あなたは${life.nation.name}の${life.home}で、${life.race.name}として生を受けた。`;
  fillRecords(elements.birthRecord, [
    ["種族", life.race.name],
    ["最高寿命", `${life.race.lifespan}歳`],
    ["成人年齢", `${Math.floor(18 * life.race.multiplier)}歳`],
    ["出生国", life.nation.name],
    ["出生地", life.home],
    ["身分", life.status.name],
    ["父の職業", parents.father],
    ["母の職業", parents.mother],
    ["家庭の財産", money(parents.gold)],
    ["家庭の借金", money(parents.debt)],
    ["魔力", `${Math.round(life.mana)}（${magicTier(life.mana)}）`],
  ]);
  elements.prologueNote.textContent = "能力・才能・魔力は生まれつきで、見えるのは魔力だけです。詳細は人生の途中でステータスから確認できます。";
  const { life: saved, error: saveError } = inspectSave();
  const warning = $("#save-warning");
  warning.hidden = !saveError;
  warning.textContent = saveError ? `${saveError}。このまま新しい人生を始めると、この保存データは上書きされます。` : "";
  elements.resumeLife.hidden = !saved;
  elements.resumeLife.textContent = saved ? `保存した人生を続ける（${saved.name}・${actualAge(saved)}歳）` : "";
  if (!elements.prologueDialog.open) elements.prologueDialog.showModal();
}

function beginLife() {
  life.started = true;
  life.playing = true;
  nextDecisionLimitReached = false;
  elements.prologueDialog.close();
  lastTimestamp = 0;
  save(true);
  updateControls();
}

function resetView() {
  renderedEventCount = -1;
  lastTimestamp = 0;
  lastSceneKey = null;
  previousAbilityValues = {};
  for (const row of elements.abilityRows.values()) {
    const changeNode = row.querySelector("[data-stat-change]");
    const timer = abilityChangeTimers.get(changeNode);
    if (timer !== undefined) clearTimeout(timer);
    abilityChangeTimers.delete(changeNode);
    changeNode.textContent = "";
  }
  currentDecisionId = null;
  elements.eventList.replaceChildren();
  addJournalEvents();
  updateLifeDisplay();
  updateControls();
  drawScene(true);
}

function resumeLife() {
  const { life: saved } = inspectSave();
  if (!saved) return;
  life = saved;
  delete life.nextDecisionLimitReached;
  nextDecisionLimitReached = false;
  life.started = true;
  life.playing = false;
  elements.prologueDialog.close();
  resetView();
  if (!life.active) showEnding();
}

function save(force = false) {
  const now = Date.now();
  if (!force && now - lastSaveAt < 4000) return;
  lastSaveAt = now;
  if (life.active && life.started) saveToStorage(life);
  else if (!life.active) clearSave();
}

function updateControls() {
  const waiting = Boolean(life.pendingDecision);
  const ended = !life.active;
  const paused = !life.playing;
  const nextStepLimited = nextDecisionLimitReached && !waiting && !ended;
  elements.play.disabled = ended || waiting || !life.started;
  elements.play.innerHTML = life.playing ? 'Ⅱ <span>一時停止</span>' : '▶ <span>再開</span>';
  elements.play.setAttribute("aria-label", life.playing ? "一時停止" : "再開");
  elements.next.disabled = ended || waiting || !life.started;
  elements.indicator.classList.toggle("paused", paused);
  const indicatorLabel = ended ? "人生の終わり" : waiting ? "選択待ち" : nextStepLimited ? "次へで続行" : paused ? "一時停止" : "進行中";
  elements.indicator.innerHTML = `<i></i>${indicatorLabel}`;
  elements.indicator.setAttribute("aria-label", nextStepLimited
    ? "安全上の上限まで進行しました。次の選択までをもう一度押すと続きます。"
    : indicatorLabel);
  document.querySelectorAll("[data-speed]").forEach((button) => {
    const selected = Number(button.dataset.speed) === life.speed;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
    button.disabled = ended || !life.started;
  });
}

function familySummary() {
  const parts = [];
  const spouse = life.spouseId ? life.npcs?.find((npc) => npc.id === life.spouseId) : null;
  if (spouse) parts.push(`配偶者 ${spouse.name}${spouse.alive ? "" : "（故人）"}`);
  else if (life.spouse) parts.push(`配偶者 ${life.spouse}`);
  else if (life.widowedAt != null) parts.push("配偶者とは死別");
  const children = livingChildren(life);
  const legacy = life.legacyChildren?.length ?? 0;
  if (children.length + legacy) parts.push(`子 ${children.length + legacy}人`);
  const partner = life.romanticPartnerId ? life.npcs?.find((npc) => npc.id === life.romanticPartnerId) : null;
  if (partner && !spouse) parts.push(`交際相手 ${partner.name}`);
  if (life.pregnancy) parts.push("子を授かっている");
  if (!parts.length) parts.push(life.npcs?.some((npc) => npc.relationship === "友人") ? "友人あり" : "家族と暮らしている");
  return parts.join(" ・ ");
}

function updateLifeDisplay() {
  const situation = life.world?.situation ?? life.situation;
  elements.worldStatus.textContent = situation === "平和" ? `${life.nation.name} — 平穏` : `${life.nation.name} — ${situation}`;
  elements.age.textContent = formatAge();
  const lifespan = life.maxHumanAge ?? life.race.lifespan / life.race.multiplier;
  const progress = Math.max(0, Math.min(100, Math.round((life.age / lifespan) * 100)));
  elements.lifeProgress.setAttribute("aria-valuenow", String(progress));
  elements.lifeProgressFill.style.width = `${progress}%`;
  elements.lifeProgressLabel.textContent = `人生の歩み ${progress}%`;
  elements.characterName.textContent = life.name;
  elements.characterSummary.textContent = `${life.race.name}・${life.gender}・${life.status?.name ?? ""}${humanAgeNote() ? ` ${humanAgeNote()}` : ""}`;
  elements.occupation.textContent = occupationTitle(life);
  elements.sceneCaption.textContent = `${life.nation.name}・${life.home}`;
  elements.canvas.parentElement.dataset.region = life.nation.id;
  elements.gold.textContent = `${money(life.gold)}${life.debt > 0.5 ? `（借${money(life.debt)}）` : ""}`;
  elements.health.textContent = life.illness
    ? `${life.illness.name}・${life.illness.severity}`
    : life.health;
  elements.people.textContent = familySummary();
  const skillLabel = `職業技能（${occupationSkillName(life)}）`;
  const skillRow = elements.abilityRows.get("occupationSkill");
  const label = skillRow.querySelector("[data-occupation-skill-label]");
  label.textContent = skillLabel;
  label.title = skillLabel;
  skillRow.querySelector(".ability-track").setAttribute("aria-label", skillLabel);
  updateBaseAbilities({ ...currentStats(life), occupationSkill: life.occupationSkill ?? 0, fame: life.fame ?? 0 });
}

function updateBaseAbilities(stats) {
  for (const key of elements.abilityRows.keys()) {
    const row = elements.abilityRows.get(key);
    if (!row) continue;
    const value = Math.round(stats[key]);
    const ariaValue = Math.min(Number(row.dataset.statMax) || 200, Math.max(0, value));
    const valueNode = row.querySelector("[data-stat-value]");
    const changeNode = row.querySelector("[data-stat-change]");
    const track = row.querySelector(".ability-track");
    const max = Number(row.dataset.statMax) || 200;
    const percentage = Math.min(100, Math.max(0, (stats[key] / max) * 100));
    valueNode.textContent = String(value);
    track.setAttribute("aria-valuenow", String(ariaValue));
    track.setAttribute("aria-valuetext", String(value));
    track.firstElementChild.style.width = `${percentage}%`;

    const previous = previousAbilityValues[key];
    if (previous !== undefined && previous !== value) {
      const delta = value - previous;
      const text = `${delta > 0 ? "+" : "−"}${Math.abs(delta)}`;
      const changeId = Number(changeNode.dataset.changeId ?? 0) + 1;
      changeNode.dataset.changeId = String(changeId);
      changeNode.textContent = text;
      changeNode.classList.toggle("decrease", delta < 0);
      const previousTimer = abilityChangeTimers.get(changeNode);
      if (previousTimer !== undefined) clearTimeout(previousTimer);
      const timer = setTimeout(() => {
        if (changeNode.dataset.changeId === String(changeId)) changeNode.textContent = "";
        abilityChangeTimers.delete(changeNode);
      }, 1800);
      abilityChangeTimers.set(changeNode, timer);
    }
    previousAbilityValues[key] = value;
  }
}

// --------------------------------------------------------------- dialogs

function renderStatus() {
  const body = elements.statusBody;
  body.replaceChildren();
  const stats = currentStats(life);
  const section = (title, rows, extra) => {
    const wrap = element("section");
    wrap.append(element("h3", "", title));
    if (rows) {
      const grid = element("div", "kv");
      for (const [key, value] of rows) grid.append(element("span", "", key), element("span", "", String(value)));
      wrap.append(grid);
    }
    if (extra) wrap.append(...extra);
    body.append(wrap);
  };
  section("基本", [
    ["名前", life.name],
    ["種族・年齢", `${life.race.name}・${formatAge()}${humanAgeNote()}`],
    ["身分", life.status?.name ?? "-"],
    ["職業", `${life.occupation}／${occupationTitle(life)}`],
    ["勤続年数", `${Math.floor(life.occupationYears)}人間換算年`],
    ["教育状態", life.educationStatus ?? "-"],
    ["健康", life.health],
    ["所持金", money(life.gold)],
    ["幸福度", `${Math.round(life.happiness ?? 50)}／100`],
    ["借金", money(life.debt)],
    ["奨学金残高", money(life.scholarshipBalance ?? 0)],
    ["住居評価額", life.ownsHome ? money(life.homeValue ?? 0) : "借家"],
    ["遺言", life.will?.type === "legal" ? "通常の相続" : life.will?.type === "charity" ? `${life.will.charity}へ寄付` : "指定先あり"],
    ...(life.peerageTitle ? [["爵位", life.peerageTitle]] : []),
    ["名声", Math.round(life.fame)],
  ], life.promotionNote ? [element("p", "note", `昇進: ${life.promotionNote}`)] : null);
  section("基礎能力", STAT_KEYS.map((key) => key === "dexterity"
    ? [`職業技能（${occupationSkillName(life)}）`, `${Math.round(life.occupationSkill ?? 0)}（${skillTier(life.occupationSkill ?? 0)}）`]
    : [STAT_LABELS[key], `${Math.round(stats[key])}（${abilityLabel(stats[key])}）`]), [
    element("p", "note", `評価は人間基準の目安です。${life.race.id === "dragon" ? "ドラゴンには同じ基準を当てはめられません。" : ""}${life.statsEstimated ? "古い保存データのため、能力は種族平均からの推定値です。" : ""}`),
  ]);
  section("魔力", [["魔力量", Math.round(stats.mana)], ["魔力区分", magicTier(stats.mana)], ["魔術技能", `${Math.round(life.skills.magic ?? 0)}（${skillTier(life.skills.magic ?? 0)}）`]], [
    element("p", "note", "魔力量は生まれつき、魔術技能は学習と経験で伸びます。魔力が高くても技能は自動では伸びません。"),
  ]);
  const skillWrap = [];
  const prev = life.skillAnnual?.prev ?? {};
  const ordered = SKILL_IDS_LIST.filter((skill) => (life.skills[skill] ?? 0) > 0.05 || ["literacy"].includes(skill)).sort((a, b) => (life.skills[b] ?? 0) - (life.skills[a] ?? 0));
  for (const skill of ordered) {
    const value = life.skills[skill] ?? 0;
    const row = element("div", "skill-row");
    row.append(element("span", "", `${skillName(skill)}  ${Math.round(value)}（${skillTier(value)}）`));
    const before = prev[skill];
    const changed = before !== undefined && Math.round(value) !== Math.round(before);
    row.append(element("span", changed ? "change" : "", changed ? `${Math.round(before)} → ${Math.round(value)}` : ""));
    row.append(element("small", "", `才能: ${life.skillTalents?.[skill] ?? "普通"}`));
    skillWrap.push(row);
  }
  if (!skillWrap.length) skillWrap.push(element("p", "note", "まだ身についた技能はありません。"));
  section("技能（才能ランク・熟練段階）", null, [...skillWrap, element("p", "note", "技能値は内部では小数で保存され、表示のみ整数に丸めています。矢印は約1年前との比較です。")]);
  const history = (life.educationHistory ?? []).map((item) => {
    const end = item.endAge == null ? "在籍中" : `${Math.floor(item.endAge * life.race.multiplier)}歳まで`;
    const detail = [item.mentor ? `師匠: ${item.mentor}` : null, item.outcome].filter(Boolean).join("／");
    return element("p", "note", `${Math.floor(item.startAge * life.race.multiplier)}歳〜${end}：${item.name}${detail ? `（${detail}）` : ""}`);
  });
  const records = Object.entries(life.careerRecords ?? {}).map(([name, record]) => element("p", "note", `過去の職業: ${name}（${record.role}・${Math.floor(record.years)}年）`));
  section("学歴・修行歴・職歴", null, [...(history.length ? history : [element("p", "note", "教育・修行の記録はまだありません。")]), ...records]);
  const npcs = (life.npcs ?? []).filter((npc) => npc.relationship !== "父" && npc.relationship !== "母").slice(-8);
  if (npcs.length) {
    section("主な人間関係", null, npcs.map((npc) => element("p", "note", `${npc.name}（${npc.relationship}・${npc.occupation}${npc.alive ? "" : "・故人"}）親密度${Math.round(npc.affinity)}`)));
  }
}

function renderMoney() {
  const body = elements.moneyBody;
  body.replaceChildren();
  const budget = monthlyBudget(life);
  const section = (title, rows, notes = []) => {
    const wrap = element("section");
    wrap.append(element("h3", "", title));
    const grid = element("div", "kv");
    for (const [key, value] of rows) grid.append(element("span", "", key), element("span", "", value));
    wrap.append(grid, ...notes.map((text) => element("p", "note", text)));
    body.append(wrap);
  };
  section("現在", [["所持金", money(life.gold)], ["借金残高", money(life.debt)]]);
  section("今月の見込み（毎月）", [
    ["本人の収入", money(budget.income.work)],
    ["配偶者の収入", money(budget.income.spouse)],
    ["生活費", `-${money(budget.expenses.living)}`],
    ["家賃", `-${money(budget.expenses.rent)}`],
    ["家族の支出", `-${money(budget.expenses.family)}`],
    ["交際費・その他", `-${money(budget.expenses.lifestyle ?? 0)}`],
    ["住居・ペットの維持費", `-${money(budget.expenses.upkeep ?? 0)}`],
    ["医療費", `-${money(budget.expenses.medical)}`],
    ["借金の利息", `-${money(budget.expenses.interest)}`],
    ["借金の返済", `-${money(budget.repayment)}`],
    ["奨学金の返済", `-${money(budget.scholarshipRepayment ?? 0)}`],
    ["差引", `${budget.net >= 0 ? "+" : ""}${money(budget.net)}`],
  ], ["金額は暫定の設定です。毎月の家計処理は人生ログには表示されません。"]);
  const recent = (life.finance?.recent ?? []).slice(-8).reverse();
  const wrap = element("section");
  wrap.append(element("h3", "", "直近の大きな収入・支出"));
  if (recent.length) {
    const grid = element("div", "kv");
    for (const item of recent) grid.append(element("span", "", `${Math.floor(item.age * life.race.multiplier)}歳 ${item.label}`), element("span", item.amount >= 0 ? "plus" : "minus", `${item.amount >= 0 ? "+" : ""}${money(item.amount)}`));
    wrap.append(grid);
  } else wrap.append(element("p", "note", "まだ大きな出入りはありません。"));
  body.append(wrap);
}

function openStatus() {
  renderStatus();
  if (!elements.statusDialog.open) elements.statusDialog.showModal();
}

function renderSpend() {
  elements.spendSummary.textContent = `所持金 ${money(life.gold)}　幸福度 ${Math.round(life.happiness ?? 50)}／100　余裕のあるお金で、暮らしを豊かにできます。`;
  elements.spendList.replaceChildren();
  for (const option of spendOptions(life)) {
    const button = element("button", "choice-button");
    button.type = "button";
    button.append(element("strong", "", option.label));
    const list = element("ul");
    for (const line of option.preview) list.append(element("li", "", line));
    button.append(list);
    if (option.disabledReason) {
      button.disabled = true;
      button.append(element("span", "reason", `選べません：${option.disabledReason}`));
    }
    button.addEventListener("click", () => {
      if (!spendMoney(life, option.id)) return;
      addJournalEvents();
      updateLifeDisplay();
      renderSpend();
      showResult();
      save(true);
    });
    elements.spendList.append(button);
  }
}

function openSpend() {
  renderSpend();
  if (!elements.spendDialog.open) elements.spendDialog.showModal();
}

function openMoney() {
  renderMoney();
  if (!elements.moneyDialog.open) elements.moneyDialog.showModal();
}

function showDecision() {
  const decision = life.pendingDecision;
  if (!decision || elements.decisionDialog.open || currentDecisionId === decision.id) return;
  currentDecisionId = decision.id;
  elements.decisionAge.textContent = `${formatAge()}${humanAgeNote()}　所持金 ${money(life.gold)}`;
  elements.decisionTitle.textContent = decision.title;
  elements.decisionCopy.textContent = decision.copy;
  elements.choices.replaceChildren();
  for (const choice of decision.choices) {
    const button = element("button", "choice-button");
    button.type = "button";
    button.append(element("strong", "", choice.label));
    if (choice.preview?.length) {
      const list = element("ul");
      for (const line of choice.preview) list.append(element("li", "", line));
      button.append(list);
    }
    if (choice.disabledReason) {
      button.disabled = true;
      button.append(element("span", "reason", `選べません：${choice.disabledReason}`));
    }
    button.addEventListener("click", () => {
      const applied = chooseDecision(life, choice.effect, random);
      if (!applied) return;
      currentDecisionId = null;
      elements.decisionDialog.close();
      addJournalEvents();
      updateLifeDisplay();
      updateControls();
      showResult();
      save(true);
    });
    elements.choices.append(button);
  }
  elements.decisionDialog.showModal();
  updateControls();
}

function showResult() {
  const result = life.lastResult;
  if (!result) return;
  $("#result-choice").textContent = `選んだ道：${result.choice}`;
  $("#result-title").textContent = result.title;
  $("#result-message").textContent = result.message;
  const list = $("#result-details");
  list.replaceChildren(...(result.details ?? []).map((line) => element("li", "", line)));
  if (!elements.resultDialog.open) elements.resultDialog.showModal();
}

function showEnding() {
  if (life.active || elements.endingDialog.open) return;
  clearSave();
  elements.endingCopy.textContent = `${life.name}は${life.nation.name}の${life.status?.name ?? ""}の家に生まれ、${formatAge({ ...life, age: life.deathAge })}の人生を歩みました。`;
  fillRecords(elements.endingRecord, [
    ["種族", life.race.name],
    ["享年", `${Math.floor(life.deathAge * life.race.multiplier)}歳`],
    ["人間換算", `${Math.floor(life.deathAge)}年`],
    ["最期", life.deathCause],
    ["最後の仕事", occupationTitle(life)],
    ["死亡時の財産", money(life.inheritanceEstate ?? life.gold)],
    ["相続", life.inheritance?.length
      ? life.inheritance.map((heir) => `${heir.name} ${money(heir.amount)}`).join("、")
      : life.inheritanceTo ?? "相続先なし"],
    ["清算した借金", money(life.debtSettledAtDeath ?? 0)],
    ["爵位継承", life.titleSuccession?.heirName ?? life.titleSuccession?.destination ?? "該当なし"],
    ["子供", `${(life.npcs ?? []).filter((npc) => npc.relationship === "子").length}人`],
    ["人生の記録", `${life.eventCount} 件`],
  ]);
  elements.endingDialog.showModal();
  updateControls();
}

function sceneStateKey(target) {
  const personKey = (person) => [
    lifeStage(person.age ?? person.humanAge ?? 0),
    person.gender ?? "",
    person.race?.id ?? person.race ?? "",
    person.occupation ?? "",
    person.health ?? "",
  ];
  const family = livingFamily(target);
  return JSON.stringify([
    target.active,
    target.nation?.id,
    target.home,
    target.homeType,
    target.ownsHome,
    target.status?.name,
    target.occupation,
    target.occupationRole,
    target.educationStatus,
    target.school?.name,
    target.health,
    target.illness?.name,
    lifeStage(target.age),
    target.age < 12 ? target.parents : null,
    family.spouse ? personKey(family.spouse) : null,
    family.children.map(personKey),
  ]);
}

function drawScene(force = false) {
  const key = sceneStateKey(life);
  if (!force && key === lastSceneKey) return;
  lastSceneKey = key;
  drawJourney(elements.canvas.getContext("2d"), characterSprite, { life });
  elements.canvas.setAttribute("aria-label", `${life.race.name}の主人公。職業: ${life.occupation}。${life.nation.name}の生活風景`);
}

function anyModalOpen() {
  return [elements.decisionDialog, elements.resultDialog, elements.endingDialog, elements.prologueDialog].some((dialog) => dialog.open);
}

function advanceToNextDecision() {
  if (!life.active || life.pendingDecision) return;
  nextDecisionLimitReached = false;
  life.playing = true;
  let steps = 0;
  while (life.active && !life.pendingDecision && steps < NEXT_DECISION_STEP_LIMIT) {
    advanceLife(life, 0.25, random);
    steps += 1;
  }
  nextDecisionLimitReached = life.active && !life.pendingDecision && steps >= NEXT_DECISION_STEP_LIMIT;
  life.playing = false;
  addJournalEvents();
  updateLifeDisplay();
  updateControls();
  if (life.pendingDecision) showDecision();
  if (!life.active) showEnding();
  else save(true);
}

function tick(timestamp) {
  if (!lastTimestamp) lastTimestamp = timestamp;
  const elapsedSeconds = Math.min((timestamp - lastTimestamp) / 1000, 0.2);
  lastTimestamp = timestamp;
  if (life.active && life.playing && !anyModalOpen()) {
    nextDecisionLimitReached = false;
    advanceLife(life, elapsedSeconds * 0.1 * life.speed, random);
    addJournalEvents();
    updateLifeDisplay();
    if (life.pendingDecision) {
      showDecision();
    }
    if (!life.active) showEnding();
    save();
  }
  drawScene();
  requestAnimationFrame(tick);
}

function startNewLife() {
  for (const dialog of document.querySelectorAll("dialog[open]")) dialog.close();
  life = createLife();
  nextDecisionLimitReached = false;
  resetView();
  showPrologue();
}

elements.play.addEventListener("click", () => {
  if (!life.active || life.pendingDecision) return;
  life.playing = !life.playing;
  nextDecisionLimitReached = false;
  lastTimestamp = 0;
  updateControls();
  save(true);
});
document.querySelectorAll("dialog").forEach((dialog) => {
  if (!["status-dialog", "money-dialog", "spend-dialog"].includes(dialog.id)) dialog.addEventListener("cancel", (event) => event.preventDefault());
});
document.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => document.getElementById(button.dataset.close).close()));
$("#close-result").addEventListener("click", () => elements.resultDialog.close());
elements.next.addEventListener("click", () => {
  if (!life.active || life.pendingDecision) return;
  advanceToNextDecision();
});
document.querySelectorAll("[data-speed]").forEach((button) => {
  button.addEventListener("click", () => {
    life.speed = Number(button.dataset.speed);
    updateControls();
  });
});
$("#new-life").addEventListener("click", () => {
  if (life.started && life.active && !window.confirm("今の人生を終えて、新しい人生を始めますか？（保存データは上書きされます）")) return;
  clearSave();
  startNewLife();
});
$("#ending-new-life").addEventListener("click", startNewLife);
$("#ending-history").addEventListener("click", () => {
  elements.endingDialog.close();
  elements.historyPage.hidden = false;
  renderHistory();
});
elements.beginLife.addEventListener("click", beginLife);
elements.resumeLife.addEventListener("click", resumeLife);
$("#open-status").addEventListener("click", openStatus);
$("#open-status-2").addEventListener("click", openStatus);
$("#open-money").addEventListener("click", openMoney);
$("#open-spend").addEventListener("click", openSpend);
const openHistory = () => {
  elements.historyPage.hidden = false;
  renderHistory();
};
$("#open-history").addEventListener("click", openHistory);
$("#open-history-inline").addEventListener("click", openHistory);
$("#close-history").addEventListener("click", () => {
  elements.historyPage.hidden = true;
  if (!life.active) showEnding();
});
window.addEventListener("pagehide", () => save(true));
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    save(true);
    if (life.playing && life.started) {
      life.playing = false;
      updateControls();
    }
  }
});

addJournalEvents();
updateLifeDisplay();
updateControls();
drawScene(true);
showPrologue();
requestAnimationFrame(tick);

// Exposed for browser-side verification only.
window.__game = { get life() { return life; }, openStatus, openMoney };
$("#startup-error").hidden = true;
