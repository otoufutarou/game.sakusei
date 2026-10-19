# 灯火の一生 — Fantasy Life Simulator

A small, original browser prototype for a continuously advancing fantasy-life simulation.

## Run

Open `index.html` in a modern browser. No build step, package installation, server, or external assets are required. If your browser blocks JavaScript modules for `file://` URLs, serve this directory with any static HTTP server.

## Play URL and deployment

The workflow `.github/workflows/pages.yml` publishes the `main` branch to GitHub Pages. For this repository the public address is **`https://otoufutarou.github.io/game.sakusei/`** (a project site). `https://otoufutarou.github.io/` would only work from a separate repository named `otoufutarou.github.io`, which does not exist.

Each deploy copies only the game files into `_site/` and appends `?v=<commit>` to the stylesheet, the entry script and every internal module import, so browsers (including iPhone Safari) cannot reuse an older copy. The footer shows `build: <commit>`; compare it with the latest commit if the screen looks old. There is no Service Worker.

## Game systems

- **Stats:** adult baselines per race with normal individual variation (`src/stats.js`), numeric mana (separate from magic skill), and a per-skill talent rank (苦手 0.65 … 規格外 2.00). Base abilities remain fixed; all are visible in the *詳細ステータス* screen (tap the job chip).
- **Skills:** monthly growth with the confirmed formula, `3.5 × activity × talent × race × learning × 1/(1+(skill/80)^1.5)` per human-equivalent year, stored as decimals, no cap at 100, no decay. Total activity is limited to 1.3 so one stretch of time is not counted twice.
- **Education and careers:** four-year primary schooling and tutoring draw tuition from the parents' assets. Academy tuition is also parent-funded when they can afford it; otherwise eligible applicants may use a scholarship or their own funds. Family tuition spending appears in the choice result, not the player's personal ledger. A three-path choice at ages 12–15 leads into specialty academies or work. Promotion eligibility leads to a visible challenge instead of silently changing the role.
- **People:** persistent NPCs (parents, friends, mentors, partners, spouse, children) with age, job, health, affinity and interaction history. Meetings and visits happen over time; romance, proposals (which can be refused), arranged marriages, divorce, widowhood and remarriage are modelled. Children only come after the player chooses “子供を持ちたい”.
- **Names:** `src/names.js` contains curated, Japanese-transliterated British, French, German, Italian, Spanish, Portuguese, Dutch, Nordic and Eastern European name pools. These are edited cultural/historical selections, not a direct copy of current ranking data; public reference datasets include [ONS](https://www.ons.gov.uk/peoplepopulationandcommunity/birthsdeathsandmarriages/livebirths/datasets/babynamesenglandandwalesbabynamesstatisticsgirls), [INSEE](https://www.insee.fr/fr/statistiques/3536630), [ISTAT](https://www.istat.it/it/archivio/nomi), [INE Spain](https://www.ine.es/dyngs/INEbase/es/operacion.htm?c=Estadistica_C&cid=1254736177009), [INE Portugal](https://www.ine.pt/), [Meertens Institute](https://www.meertens.knaw.nl/nvb/), and national Nordic and Eastern European statistics offices. New names are unique within a life; immediate family keeps its surname, while each NPC retains a separate ID.
- **Economy:** monthly wages, living cost, rent, family costs, medical costs, ordinary debt and repayment, a ledger, valued homes with sale proceeds, and scholarship loans with income-based repayment. Ordinary wages are tuned around the price of a small home; famine sharply raises costs and cuts farm income, and recession reduces merchant and business income. New lives start with no personal cash; family assets are shown separately and can fund education. Household shortfalls do not create automatic debt, and ordinary loans have a cap.
- **Living costs and spending:** adults also pay 交際費・その他 (grows with rank) and owned homes/pets have monthly upkeep, so only a small surplus remains and a home takes many years to afford. The *お金を使う* screen lets the player spend surplus on trips, books, home repair, a pet, hot springs, parties, gifts, gear or donations; each shows cost and effect, is disabled when funds are short, and raises stats or 幸福度 (`happiness`, 0–100).
- **Children:** a newborn is named by the player (candidates or free text). Children trigger schooling, wedding and home-purchase funding choices, plus growth log entries.
- **Health and family:** age-based illness episodes use configured disease and treatment chances; severe aftereffects have a one-time recovery-treatment option. The first child-planning choice is guaranteed about six months after marriage when a partner can conceive; each choice starts a one-year attempt. Retirement is offered once at 65; death settles property and liquid assets using either the legal shares or the current will, including equal distribution to friends as a group.
- **Choices:** each option shows cost and expected effects up front, unaffordable options are disabled with the reason, and a result dialog lists what changed.
- **World:** war, plague, famine, recession and monster raids change prices, income and danger for the hero and NPCs.
- **Log:** events are logged only when something happens; 80 human-equivalent years average roughly 130–140 entries (about 24 decisions with their results), with dense childhood, adult, family and old-age everyday entries.
- **UI:** compact phone layout (checked at 375/390/430 px), latest four log entries with a full history screen, a lifespan progress bar, and a static compositional pixel scene. The pixel scene and status appear before the recent log; current base abilities remain visible as bars between status and log, with brief change indicators. Regional scenery, homes, work sites, age-stage sprites and living family update when their underlying life state changes.
- **Save:** the life is autosaved to `localStorage` and can be resumed from the title screen; older saves are migrated without inventing past events.

### Provisional values (not final specification)

Talent rates, per-race standard deviations, charm/luck baselines, mana tier ranges, wages and living costs, world-event frequencies, mentor quality odds and promotion thresholds are provisional in `src/stats.js` and `src/simulation.js`. Skill decay for aging or disuse is intentionally not implemented.

### Version 4 prototype scope

The Version 3 baseline for this prototype is commit `b47c19210b01de7f931c6840e59f3241ce8afa9a`; it remains in history and can be inspected with `git checkout b47c19210b01de7f931c6840e59f3241ce8afa9a`.

Initial adjustable values are in `TUNING` in `src/simulation.js`. Child-conception chances are provisional annual rates of 30% through age 29, 22% at 30–34, 14% at 35–39, and 6% at 40–45; attempts last one year and are offered again after 2–3 years. The child's species provisionally follows the mother. Illness chances are 4%, 3%, 5%, 8%, 10%, and 12% across the age bands 0–17, 18–49, 50–64, 65–74, 75–84, and 85+, halved for two years after recovery. Disease weights, severity weights, natural recovery, treatment prices, and promotion success (25%, retry after three years) are provisional too. Treatment success follows the revised table in the specification.

#### Additional prototype values and boundaries

- **Currency:** balances, wages, and prices are shown directly in G. Existing saved numeric balances remain unchanged; old silver-denominated log text is converted on older saves and rounded to two decimal places.
- **Homes:** small/large/estate purchase prices are 120/400/1,666⅔ G; sale returns a random 70–90% of the recorded price. Home value is included in the death estate as if liquidated. No ownership maintenance charge is currently applied. Rent remains 0.7 G/month.
- **Scholarships:** if the applicant meets normal admission rules, has less cash than tuition, and meets the relevant aptitude threshold (magic 60 mana, knight 70 combat, academic 70 intellect), the prototype lends the tuition total plus 12 G per course year. It is interest-free and separate from normal debt. Repayment is 10% of income only when basic expenses and ordinary scheduled debt repayment leave enough cash; no income/shortfall means no repayment. These course costs and living allowances are provisional.
- **Business expansion:** farm and trade businesses may make at most three investments, with a four-year offer cooldown. Small/medium/large costs are 8/20/40 G and base success rates 60/45/30%; failure loses 100/65/40% of the stake. Success adds 0.25/0.6/1.2 G to monthly income, which is affected by economic conditions. Relevant skill adjusts chance by at most ±10 percentage points (overall cap 20–70%); base odds are configurable.
- **Careers and skills:** graduation and job-offer decisions list eligible destinations explicitly, with monthly pay and required skill/current skill shown for each. Players choose the job directly; there are no hidden acceptance rolls. Job offers recur no more than once every eight years for employed characters and every two years for unemployed characters. Skills grow only through chosen training or work-practice events; ability baselines remain fixed. The career catalog remains intentionally small.
- **Wills and titles:** age 60 offers a free, repeatable will choice for legal shares, spouse, oldest/equal children, a living known NPC, or a listed charity/state. An unavailable named beneficiary falls back to legal shares. A generic peerage transfers separately through the oldest child's line, including a living descendant if that child has died. Collateral-family branches, renunciation, estates/land, and country-specific succession laws are not yet modeled. Wills do not affect that title.
- **Aftereffects:** each recorded body-ability aftereffect can receive one recovery attempt (40 G, 35% success). Recovery prices and odds are provisional.

This remains a partial Version 4 prototype. Still out of scope or incomplete: comprehensive NPC household careers, marriage and childbearing; full country- and status-specific school/job qualification matrices; property ownership transfer as a physical asset (the estate liquidates it); collateral succession through siblings and their descendants; detailed inheritance disputes, land and title renunciation; the complete income/tax, rent, loan-interest and luxury-lifestyle economy; full business investment tiers for every occupation; and full illness aftermath/death/cure statistics and long-run Monte Carlo balance reporting. Do not treat these as completed. Version 3 can be restored from commit `b47c19210b01de7f931c6840e59f3241ce8afa9a`; current saves remain loadable and their stored balances are unchanged.

## Tests

Run the simulation regression suite with:

```sh
node --experimental-default-type=module --test src/simulation.test.js
```

Browser integration test (headless Chromium, serves the page under `/game.sakusei/` with `?v=` stamping like the deploy, clicks the real buttons, checks age progression, pause/resume, decisions, sprite, reload/resume, legacy and corrupt saves, and console errors):

```sh
npm install && npm run test:browser
```

For a manual browser review, serve the repository with a static HTTP server and open `/game.sakusei/` or `index.html`; inspect the birth, choice preview/result, status/economy panels, and death summary. Verify the build identifier shown in the footer. A successful local test does not confirm the deployed GitHub Pages site. If the game cannot start, the page shows the reason (`#startup-error`); an unreadable save is reported in the title dialog and kept until the player starts a new life.
