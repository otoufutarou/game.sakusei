# 灯火の一生 — Fantasy Life Simulator

A small, original browser prototype for a continuously advancing fantasy-life simulation.

## Run

Open `index.html` in a modern browser. No build step, package installation, server, or external assets are required. If your browser blocks JavaScript modules for `file://` URLs, serve this directory with any static HTTP server.

## Play URL and deployment

The workflow `.github/workflows/pages.yml` publishes the `main` branch to GitHub Pages. For this repository the public address is **`https://otoufutarou.github.io/game.sakusei/`** (a project site). `https://otoufutarou.github.io/` would only work from a separate repository named `otoufutarou.github.io`, which does not exist.

Each deploy copies only the game files into `_site/` and appends `?v=<commit>` to the stylesheet, the entry script and every internal module import, so browsers (including iPhone Safari) cannot reuse an older copy. The footer shows `build: <commit>`; compare it with the latest commit if the screen looks old. There is no Service Worker.

## Game systems

- **Stats:** adult baselines per race with normal individual variation (`src/stats.js`), numeric mana (separate from magic skill), a body-ability age curve, and a per-skill talent rank (苦手 0.65 … 規格外 2.00). All of it is visible in the *詳細ステータス* screen (tap the job chip).
- **Skills:** monthly growth with the confirmed formula, `3.5 × activity × talent × race × learning × 1/(1+(skill/80)^1.5)` per human-equivalent year, stored as decimals, no cap at 100, no decay. Total activity is limited to 1.3 so one stretch of time is not counted twice.
- **Education and careers:** childhood schooling or tutoring, apprenticeships (magic, sword, smithing, tailoring), and academies gated by money, status, talent or scholarship. Mentor, school, training skill and education history are stored; graduation unlocks the matching job. Career ladders (e.g. 見習い → 熟練 → 親方) use tenure plus skill, and the reason a promotion is blocked is shown.
- **People:** persistent NPCs (parents, friends, mentors, partners, spouse, children) with age, job, health, affinity and interaction history. Meetings and visits happen over time; romance, proposals (which can be refused), arranged marriages, divorce, widowhood and remarriage are modelled. Children only come after the player chooses “子供を持ちたい”.
- **Economy:** monthly wages, living cost, rent, family costs, medical costs, debt interest and repayment, a ledger of large transactions, and spending choices with costs. Tap the gold chip for the breakdown.
- **Choices:** each option shows cost and expected effects up front, unaffordable options are disabled with the reason, and a result dialog lists what changed.
- **World:** war, plague, famine, recession and monster raids change prices, income, conscription and danger for the hero and NPCs.
- **Log:** events are logged only when something happens; 80 human-equivalent years average roughly 100–110 entries (about 26 decisions with their results).
- **UI:** compact phone layout (checked at 375/390/430 px), latest four log entries with a full history screen, procedural pixel sprites that follow race, life stage, gender, job and condition, a journey scene with living family members.
- **Save:** the life is autosaved to `localStorage` and can be resumed from the title screen; older saves are migrated without inventing past events.

### Provisional values (not final specification)

Talent rates, per-race standard deviations, charm/luck baselines, the mana tier ranges, the body-ability age curve, the childhood development ramp, wages and prices (the 1G ≈ 5,000 yen idea does not fit the existing 4–60G choice prices, so wages were scaled down), world-event frequencies, mentor quality odds and promotion thresholds are placeholders in `src/stats.js` and `src/simulation.js`. Skill decay for aging or disuse is intentionally not implemented.

## Tests

Run the simulation regression suite with:

```sh
node --experimental-default-type=module --test src/simulation.test.js
```

Browser integration test (headless Chromium, serves the page under `/game.sakusei/` with `?v=` stamping like the deploy, clicks the real buttons, checks age progression, pause/resume, decisions, sprite, reload/resume, legacy and corrupt saves, and console errors):

```sh
npm install && npm run test:browser
```

If the game cannot start, the page now shows the reason (`#startup-error`); an unreadable save is reported in the title dialog and kept until the player starts a new life.
