# 灯火の一生 — Fantasy Life Simulator

A small, original browser prototype for a continuously advancing fantasy-life simulation.

## Run

Open `index.html` in a modern browser. No build step, package installation, server, or external assets are required. If your browser blocks JavaScript modules for `file://` URLs, serve this directory with any static HTTP server.

## Game systems

- Each life generates a name, species, nation, status, home, parents, household finances, and magical potential. A birth prologue shows those generated details and waits for the player to start.
- Life time is tracked in human-equivalent years; displayed age and lifespan use each species' multiplier.
- Event logs are scheduled rather than emitted every year. The 52-event routine catalog checks age, species, nation, occupation, resources, and prior choices; IDs cannot recur in the latest 20 log entries, and one-time events stay unavailable for that life.
- Contextual decisions can affect money, debt, skill, fame, health, magic, work, and relationships. Occupation skill, rank, and years of service progress with time; marriage and children are reflected in state and on the life-path scene.
- Skills are stored separately from jobs and grow monthly from work or recorded practice using the specified aptitude, race, activity, learning, and diminishing-return factors; changing jobs preserves prior skills.
- The parchment interface shows the latest three events. The complete journal is available on a separate screen; the pixel character moves along a regional life path and changes with species, age, work, and family.
- Pause, resume, 1×/2×/4×/8× speed, and fast-forward to the next decision are available.

This remains a browser prototype, not a complete implementation of the full 38-chapter specification. Event and mortality rates are initial balance values in `src/simulation.js`; persistent simulation of all NPCs, full relationship and family systems, and other unimplemented chapters are not represented as finished features.

## Tests

Run the simulation regression suite with:

```sh
node --experimental-default-type=module --test src/simulation.test.js
```