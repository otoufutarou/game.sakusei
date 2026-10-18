# 灯火の一生 — Fantasy Life Simulator

A small, original browser prototype for a continuously advancing fantasy-life simulation.

## Run

Open `index.html` in a modern browser. No build step, package installation, server, or external assets are required. If your browser blocks JavaScript modules for `file://` URLs, serve this directory with any static HTTP server.

## Prototype scope

- Every new life generates its name, gender, species, nation, social status, and family background automatically.
- The clock advances continuously in human-equivalent years. Pause, resume, choose 1×/2×/4×/8× speed, or wait for the next decision.
- The event journal records life events; decision events pause time until an option is chosen. Death ends the life and opens a summary.
- The original pixel character is drawn from editable frame data in `src/character-sprite.js`; replace its palette or frame rows to change the art.
- This is a vertical slice, not the full 38-chapter simulation. Family, career, nation, and world simulation are deliberately simplified.

## Assumptions and provisional values

This repository had no application code or technology configuration, so the prototype uses native HTML, CSS, and JavaScript with no dependencies. This is a provisional choice.

Event timing, decision timing, aging/death rates, and choice outcomes are initial tuning values in `src/simulation.js`, not confirmed final balance. A mundane life is represented by ordinary outcomes, not a separate mode or score. Succession disputes and vampire thralls are outside this slice; neither the question of counting the protagonist among succession candidates nor the aggregate-stat test for thrall conversion is interpreted here. Family planning, marriage, detailed NPC autonomy, careers, and changing world states are also outside this slice.