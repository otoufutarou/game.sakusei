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
- **Education and careers:** free four-year basic schooling, a three-path choice at ages 12–15, and specialty academies with different course lengths. Promotion eligibility leads to a visible challenge instead of silently changing the role.
- **People:** persistent NPCs (parents, friends, mentors, partners, spouse, children) with age, job, health, affinity and interaction history. Meetings and visits happen over time; romance, proposals (which can be refused), arranged marriages, divorce, widowhood and remarriage are modelled. Children only come after the player chooses “子供を持ちたい”.
- **Economy:** monthly wages, living cost, rent, family costs, medical costs, debt interest and repayment, a ledger of large transactions, and spending choices with costs. New lives start with no personal cash; family assets are shown separately. Household shortfalls do not create automatic debt, and ordinary loans have a cap.
- **Health and family:** age-based illness episodes use separately configured disease and treatment chances. Child planning is offered only when the woman is at most 45 human-equivalent years old; each choice starts a one-year attempt. Retirement is offered once at 65, and death settles liquid assets to a living spouse and children without passing debt on.
- **Choices:** each option shows cost and expected effects up front, unaffordable options are disabled with the reason, and a result dialog lists what changed.
- **World:** war, plague, famine, recession and monster raids change prices, income, conscription and danger for the hero and NPCs.
- **Log:** events are logged only when something happens; 80 human-equivalent years average roughly 100–110 entries (about 26 decisions with their results).
- **UI:** compact phone layout (checked at 375/390/430 px), latest four log entries with a full history screen, procedural pixel sprites that follow race, life stage, gender, job and condition, a journey scene with living family members.
- **Save:** the life is autosaved to `localStorage` and can be resumed from the title screen; older saves are migrated without inventing past events.

### Provisional values (not final specification)

Talent rates, per-race standard deviations, charm/luck baselines, the mana tier ranges, the body-ability age curve, the childhood development ramp, wages and prices (the 1G ≈ 5,000 yen idea does not fit the existing 4–60G choice prices, so wages were scaled down), world-event frequencies, mentor quality odds and promotion thresholds are placeholders in `src/stats.js` and `src/simulation.js`. Skill decay for aging or disuse is intentionally not implemented.

### Version 4 prototype scope

The Version 3 baseline for this prototype is commit `b47c19210b01de7f931c6840e59f3241ce8afa9a`; it remains in history and can be inspected with `git checkout b47c19210b01de7f931c6840e59f3241ce8afa9a`.

Initial adjustable values are in `TUNING` in `src/simulation.js`. Child-conception chances are provisional annual rates of 30% through age 29, 22% at 30–34, 14% at 35–39, and 6% at 40–45; attempts last one year and are offered again after 2–3 years. The child's species provisionally follows the mother. Illness chances are 4%, 3%, 5%, 8%, 10%, and 12% across the age bands 0–17, 18–49, 50–64, 65–74, 75–84, and 85+, halved for two years after recovery. Disease weights, severity weights, natural recovery, treatment prices, and promotion success (25%, retry after three years) are provisional too. Treatment success follows the revised table in the specification.

This is a partial prototype, not a claim that all Version 4 requirements are complete. The economy still uses the existing `G` values: no old-G-to-silver conversion or silver-denominated wage/price rebalance has been applied. Wills, title succession, property valuation/inheritance, scholarship loans, full job qualification/admission rules, comprehensive NPC autonomy, and all specified business-investment/health edge cases remain unimplemented. Version 3 saves are still loaded without converting their existing monetary values.

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
