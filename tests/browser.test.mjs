// Headless-browser integration test: opens the page like a player, clicks the real buttons and checks that
// a hero is born, time advances, decisions appear, the sprite is drawn and old saves do not stop the game.
// Run: npm i && npm run test:browser   (set CHROMIUM_PATH if Chromium is not at a standard location)
import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "/game.sakusei/";
const BUILD = "test123";
const types = { ".js": "text/javascript", ".html": "text/html", ".css": "text/css" };

let chromium;
try {
  ({ chromium } = await import("playwright-core"));
} catch {
  chromium = null;
}
const executablePath = [process.env.CHROMIUM_PATH, "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome"].find((p) => p && fs.existsSync(p));
const skip = !chromium || !executablePath ? "playwright-core or Chromium not available" : false;

// Serve the files the same way pages.yml publishes them: under /game.sakusei/ with ?v= stamped on imports.
function stamped(file) {
  let text = fs.readFileSync(path.join(root, file), "utf8");
  if (file.endsWith(".js")) text = text.replace(/from "\.\/([a-z-]+)\.js"/g, `from "./$1.js?v=${BUILD}"`).replace("__BUILD_ID__", BUILD);
  if (file === "index.html") text = text.replace(/(href|src)="\.\/(styles\.css|src\/main\.js)"/g, `$1="./$2?v=${BUILD}"`);
  return text;
}
const allowed = new Set(["index.html", "styles.css", "src/main.js", "src/simulation.js", "src/stats.js", "src/save.js", "src/character-sprite.js", "src/names.js"]);
const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname.endsWith("/favicon.ico") || url.pathname === "/favicon.ico") { res.statusCode = 204; return res.end(); }
  if (!url.pathname.startsWith(BASE)) { res.statusCode = 404; return res.end(); }
  const rel = url.pathname.slice(BASE.length) || "index.html";
  if (!allowed.has(rel)) { res.statusCode = 404; return res.end(); }
  res.setHeader("content-type", types[path.extname(rel)] ?? "text/plain");
  res.end(stamped(rel));
});

let browser;
let port;
test.before(async () => {
  if (skip) return;
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  port = server.address().port;
  browser = await chromium.launch({ executablePath, args: ["--no-sandbox"] });
});
test.after(async () => {
  await browser?.close();
  server.close();
});

async function open(context, { legacySave } = {}) {
  const page = await context.newPage();
  const problems = [];
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
  page.on("console", (msg) => { if (msg.type() === "error") problems.push(`console: ${msg.text()}`); });
  page.on("response", (response) => { if (response.status() >= 400) problems.push(`http ${response.status()}: ${response.url()}`); });
  if (legacySave !== undefined) await page.addInitScript((save) => { if (!localStorage.getItem("tomoshibi-save")) localStorage.setItem("tomoshibi-save", save); }, legacySave);
  await page.goto(`http://127.0.0.1:${port}${BASE}`);
  await page.waitForSelector("#prologue-dialog[open]");
  assert.equal(await page.isVisible("#startup-error"), false, "startup warning stays hidden after successful initialization");
  return { page, problems };
}

const age = (page) => page.evaluate(() => window.__game.life.age);
const spriteInk = (page) => page.evaluate(() => {
  const canvas = document.getElementById("character-canvas");
  const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
  const seen = new Set();
  for (let i = 0; i < data.length; i += 4) seen.add(`${data[i]},${data[i + 1]},${data[i + 2]},${data[i + 3]}`);
  return seen.size;
});

test("new life: hero is born, time runs, pause/resume, decisions, sprite, reload", { skip, timeout: 120000 }, async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const { page, problems } = await open(context);

  assert.equal(await page.textContent("#build-id"), `build: ${BUILD}`);
  const name = await page.textContent("#character-name");
  assert.ok(name && name !== "---", `hero name rendered: ${name}`);
  assert.notEqual(await page.textContent("#occupation-value"), "---");
  assert.notEqual((await page.textContent("#people-value")).trim(), "");
  assert.ok((await page.textContent("#birth-record")).includes("出生国"));
  assert.ok((await spriteInk(page)) > 3, "sprite drawn before the life starts");
  assert.equal(await page.locator("#ability-bars [data-stat-key]").count(), 6);
  assert.equal(await page.locator("#event-list").evaluate((events) => Boolean(events.compareDocumentPosition(document.querySelector("#ability-bars")) & Node.DOCUMENT_POSITION_FOLLOWING)), true);
  assert.equal(await page.locator("#ability-bars").evaluate((bars) => Boolean(bars.compareDocumentPosition(document.querySelector("#character-canvas")) & Node.DOCUMENT_POSITION_FOLLOWING)), true);
  assert.ok(Number(await page.locator('[data-stat-key="body"] .ability-track').getAttribute("aria-valuenow")) >= 0);

  await page.click("#begin-life");
  await page.click("#next-decision");
  await page.waitForSelector("#decision-dialog[open]", { timeout: 60000 });
  const decisions = [];
  let maxAge = 0;
  // Make several real choices, always through the visible buttons.
  for (let i = 0; i < 4; i += 1) {
    await page.waitForSelector("#decision-dialog[open]", { timeout: 60000 });
    await page.waitForTimeout(50);
    decisions.push(await page.textContent("#decision-title"));
    maxAge = Math.max(maxAge, await age(page));
    await page.locator("#choice-list button:not([disabled])").first().click();
    await page.waitForSelector("#result-dialog[open]");
    await page.click("#close-result");
    if (i < 3 && !(await page.evaluate(() => window.__game.life.pendingDecision))) await page.click("#next-decision");
  }
  assert.ok(maxAge > 0, "age advanced");
  assert.ok(Number(await page.textContent("#event-count")) > 0, "journal has entries");
  assert.ok((await spriteInk(page)) > 3);

  // Pause stops time, resume restarts it.
  await page.click("#toggle-play");
  assert.equal(await page.evaluate(() => window.__game.life.playing), false);
  const pausedAt = await age(page);
  await page.waitForTimeout(700);
  assert.equal(await age(page), pausedAt, "age frozen while paused");
  await page.click("#toggle-play");
  await page.click('[data-speed="8"]');
  await page.waitForFunction((before) => window.__game.life.age > before || window.__game.life.pendingDecision, pausedAt, { timeout: 20000 });

  // Detailed status shows real numbers.
  await page.evaluate(() => window.__game.openStatus());
  assert.match(await page.textContent("#status-body"), /\d+（/);
  await page.evaluate(() => document.getElementById("status-dialog").close());

  // Save, reload, resume.
  if (await page.evaluate(() => window.__game.life.pendingDecision)) {
    await page.locator("#choice-list button:not([disabled])").first().click();
    await page.click("#close-result");
  }
  await page.click("#toggle-play");
  await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
  const savedAge = await page.evaluate(() => Number(JSON.parse(localStorage.getItem("tomoshibi-save")).age));
  await page.reload();
  await page.waitForSelector("#prologue-dialog[open]");
  assert.ok(await page.isVisible("#resume-life"), "resume offered after reload");
  await page.click("#resume-life");
  assert.ok(Math.abs((await age(page)) - savedAge) < 1e-6);
  await page.click("#toggle-play");
  await page.click('[data-speed="8"]');
  await page.waitForFunction((before) => window.__game.life.age > before || window.__game.life.pendingDecision, savedAge, { timeout: 20000 });

  console.log(`# browser=${browser.version()} decisions=${decisions.length} maxAge=${maxAge.toFixed(1)} titles=${decisions.join("|")}`);
  assert.deepEqual(problems, []);
  await context.close();
});

const legacySave = JSON.stringify({
  name: "古い・旅人", gender: "男", race: "human", nation: "kingdom", home: "村", family: "温かな",
  parents: { father: "農夫", mother: "薬師", gold: 10, debt: 0 }, age: 12, active: true, health: "健やか",
  gold: 20, debt: 0, occupation: "見習い", skills: { literacy: 5 }, dexterity: 40, situation: "平和",
  appearance: { hair: "黒", coat: "青" }, children: ["太郎"], journal: [{ kind: "life", label: "出来事", text: "古い記録", age: 3 }], eventCount: 1,
});

test("legacy save migrates and the game keeps running", { skip, timeout: 120000 }, async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const { page, problems } = await open(context, { legacySave });
  assert.ok(await page.isVisible("#resume-life"), "legacy save offered");
  await page.click("#resume-life");
  assert.equal(await page.textContent("#character-name"), "古い・旅人");
  await page.click("#next-decision");
  await page.waitForFunction(() => window.__game.life.pendingDecision || window.__game.life.age > 13, null, { timeout: 60000 });
  assert.deepEqual(problems, []);
  await context.close();
});

test("corrupt save never blocks a new life and is reported, not silently deleted", { skip, timeout: 60000 }, async () => {
  const context = await browser.newContext();
  const { page, problems } = await open(context, { legacySave: "{not json" });
  assert.notEqual(await page.textContent("#character-name"), "---");
  assert.equal(await page.evaluate(() => localStorage.getItem("tomoshibi-save")), "{not json", "unreadable save is kept");
  assert.ok(await page.isVisible("#save-warning"), "reason shown to the player");
  await page.click("#begin-life");
  await page.click("#next-decision");
  await page.waitForFunction(() => window.__game.life.age > 0.2 || window.__game.life.pendingDecision, null, { timeout: 30000 });
  assert.deepEqual(problems, []);
  await context.close();
});
