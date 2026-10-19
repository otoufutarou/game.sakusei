// Procedural pixel people. A person is built on a small logical grid (about 20×34 for an adult,
// roughly the 32×48 target) from parts chosen by race, life stage, gender, occupation and condition,
// and is always drawn at an integer scale so the pixels stay crisp.
export const characterSprite = { width: 20, height: 34, kind: "procedural" };

export const SKIN = {
  human: "#e2b98e", beastkin: "#d6a572", dwarf: "#d9a47c", demon: "#b58aa4",
  elf: "#efd2b0", dragon: "#6f9a6a", vampire: "#ebddd6",
};

const OUTFITS = {
  "兵士": { coat: "#657491", trim: "#c9ced6", hat: "helmet", prop: "spear" },
  "騎士": { coat: "#a9b1bd", trim: "#a3342f", hat: "helmet", prop: "sword", cape: "#a3342f" },
  "騎士学院生": { coat: "#7f93ad", trim: "#c9ced6", prop: "sword" },
  "魔術師": { coat: "#5d4b8c", trim: "#d8b96f", hat: "wizard", prop: "staff" },
  "魔術師の弟子": { coat: "#7a6aa8", trim: "#d8b96f", prop: "staff" },
  "魔術学院生": { coat: "#6b5aa0", trim: "#e8e0c0", prop: "book" },
  "農作業": { coat: "#8a7650", trim: "#6b5a3a", hat: "straw", prop: "hoe" },
  "家業の手伝い": { coat: "#8a7650", trim: "#6b5a3a" },
  "冒険者": { coat: "#87634c", trim: "#4a3a2c", prop: "sword", cape: "#5e4636" },
  "教師": { coat: "#786984", trim: "#e8e0c0", prop: "book" },
  "学者": { coat: "#4f5f78", trim: "#e8e0c0", prop: "book" },
  "学術院生": { coat: "#5d7090", trim: "#e8e0c0", prop: "book" },
  "商人": { coat: "#6f8a5a", trim: "#d8b96f", prop: "pouch" },
  "鍛冶職人": { coat: "#6b5545", trim: "#2d2823", prop: "hammer" },
  "工房主": { coat: "#6b5545", trim: "#d8b96f", prop: "hammer" },
  "服飾店の見習い": { coat: "#8fb0c4", trim: "#e8d0d8" },
  "職人見習い": { coat: "#9b8456", trim: "#5c4a30" },
};

export function lifeStage(humanAge) {
  if (humanAge < 3) return "baby";
  if (humanAge < 12) return "child";
  if (humanAge < 18) return "teen";
  return humanAge >= 65 ? "elder" : "adult";
}

const STAGE_SHAPE = {
  baby: { height: 13, head: 7, body: 5, legs: 3 },
  child: { height: 21, head: 8, body: 7, legs: 6 },
  teen: { height: 28, head: 8, body: 10, legs: 10 },
  adult: { height: 33, head: 8, body: 12, legs: 13 },
  elder: { height: 31, head: 8, body: 12, legs: 11 },
};

function hashText(text) {
  let value = 0;
  for (const character of String(text ?? "")) value = (value * 31 + character.charCodeAt(0)) >>> 0;
  return value;
}

// Everything the picture depends on, read from game state.
export function spriteSpec(person, { isHero = false } = {}) {
  const raceId = person.race?.id ?? person.race ?? "human";
  const humanAge = person.age ?? person.humanAge ?? 20;
  const stage = lifeStage(humanAge);
  const occupation = isHero ? person.occupation : person.occupation;
  const royal = isHero && ["王族", "貴族"].includes(person.status?.name);
  const outfit = { ...(OUTFITS[occupation] ?? { coat: person.appearance?.coat ?? "#647d72", trim: "#d8b96f" }) };
  if (royal && !OUTFITS[occupation]) Object.assign(outfit, { coat: "#7b2f4a", trim: "#e6c75a", hat: person.status.name === "王族" ? "crown" : "feather" });
  else if (isHero && !OUTFITS[occupation] && person.appearance?.coat) outfit.coat = person.appearance.coat;
  const gender = person.gender ?? "その他";
  const hairStyle = gender === "女性" ? (hashText(person.name) % 2 ? "long" : "tied") : gender === "男性" ? "short" : (hashText(person.name) % 2 ? "short" : "medium");
  const ill = ["療養中", "重病", "病気", "回復中"].includes(person.health);
  const hair = stage === "elder" ? "#b9b4a8" : person.appearance?.hair ?? ["#34271f", "#5a3a28", "#8a5a30", "#c8a050", "#2a2a3a"][hashText(person.name) % 5];
  return { raceId, stage, gender, hairStyle, hair, outfit, occupation, ill, skin: SKIN[raceId] ?? SKIN.human, royal };
}

// Returns pixel rectangles on the logical grid, origin at the top-left, feet on the last row.
export function buildSprite(spec) {
  const shape = STAGE_SHAPE[spec.stage];
  const rects = [];
  const add = (x, y, w, h, color) => rects.push({ x, y, w, h, color });
  const dwarf = spec.raceId === "dwarf";
  const bodyW = spec.stage === "baby" ? 6 : dwarf ? 11 : spec.stage === "child" ? 7 : 9;
  const centre = 10;
  const heightBonus = spec.raceId === "elf" && spec.stage === "adult" ? 1 : 0;
  const legH = dwarf ? Math.max(2, shape.legs - 4) : shape.legs + heightBonus;
  const bodyH = shape.body;
  const headH = shape.head;
  const top = 34 - (headH + bodyH + legH);
  const headY = top;
  const bodyY = top + headH;
  const legY = bodyY + bodyH;
  const left = centre - Math.floor(bodyW / 2);
  const headW = shape.head;
  const headX = centre - Math.floor(headW / 2);
  const skin = spec.ill ? "#cdbfb0" : spec.skin;
  const { coat, trim } = spec.outfit;
  const dark = "#352b24";

  if (spec.outfit.cape && spec.stage !== "baby") add(left - 1, bodyY, bodyW + 2, bodyH + 2, spec.outfit.cape);
  if (spec.raceId === "dragon") {
    add(left - 4, bodyY, 4, bodyH - 2, "#4f7a55");
    add(left + bodyW, bodyY, 4, bodyH - 2, "#4f7a55");
  }
  if (["beastkin", "demon", "dragon"].includes(spec.raceId)) add(left + bodyW, legY - 2, 3, 2, spec.raceId === "beastkin" ? spec.hair : skin);

  const legW = Math.max(2, Math.floor(bodyW / 2) - 1);
  add(left + 1, legY, legW, legH, "#544334");
  add(left + bodyW - 1 - legW, legY, legW, legH, "#544334");
  add(left, legY + legH - 1, legW + 1, 1, dark);
  add(left + bodyW - legW, legY + legH - 1, legW + 1, 1, dark);

  add(left, bodyY, bodyW, bodyH, coat);
  if (spec.stage !== "baby") add(left + Math.floor(bodyW / 2) - 1, bodyY, 2, bodyH, trim);
  add(left - 1, bodyY + 1, 1, Math.max(3, bodyH - 4), coat);
  add(left + bodyW, bodyY + 1, 1, Math.max(3, bodyH - 4), coat);
  add(left - 1, bodyY + bodyH - 3, 1, 1, skin);
  add(left + bodyW, bodyY + bodyH - 3, 1, 1, skin);
  if (spec.outfit.prop === "hammer" || spec.outfit.prop === "hoe") add(left + 2, bodyY + 4, bodyW - 4, bodyH - 5, "#6b5545");

  add(headX, headY + 1, headW, headH - 1, skin);
  add(headX + 2, headY + Math.floor(headH / 2), 1, 1, dark);
  add(headX + headW - 3, headY + Math.floor(headH / 2), 1, 1, dark);
  if (spec.raceId === "vampire") add(headX + 3, headY + headH - 2, 1, 1, "#ffffff");
  if (spec.ill) add(headX + headW - 3, headY + 2, 2, 1, "#ffffff");

  const hair = spec.hair;
  add(headX, headY, headW, 2, hair);
  if (spec.hairStyle === "long") {
    add(headX - 1, headY, 1, headH + 2, hair);
    add(headX + headW, headY, 1, headH + 2, hair);
  } else if (spec.hairStyle === "tied") {
    add(headX + headW, headY + 1, 2, 4, hair);
  } else if (spec.hairStyle === "medium") {
    add(headX - 1, headY, 1, headH - 2, hair);
    add(headX + headW, headY, 1, headH - 2, hair);
  } else {
    add(headX - 1, headY, 1, 3, hair);
    add(headX + headW, headY, 1, 3, hair);
  }
  if (spec.stage === "elder") add(headX + 1, headY + headH - 1, headW - 2, 2, "#b9b4a8");

  switch (spec.raceId) {
    case "beastkin":
      add(headX, headY - 2, 2, 2, hair);
      add(headX + headW - 2, headY - 2, 2, 2, hair);
      break;
    case "dwarf":
      add(headX + 1, headY + headH - 2, headW - 2, 4, "#8c7a5a");
      break;
    case "elf":
      add(headX - 3, headY + 2, 3, 1, skin);
      add(headX + headW, headY + 2, 3, 1, skin);
      break;
    case "demon":
      add(headX + 1, headY - 3, 1, 3, "#3a2230");
      add(headX + headW - 2, headY - 3, 1, 3, "#3a2230");
      break;
    case "dragon":
      add(headX + 1, headY - 2, 1, 2, "#d8c9a0");
      add(headX + headW - 2, headY - 2, 1, 2, "#d8c9a0");
      add(headX + 1, headY + headH - 2, headW - 2, 1, "#4f7a55");
      break;
    case "vampire":
      add(left - 2, bodyY - 1, bodyW + 4, 2, "#49344d");
      break;
    default:
      break;
  }

  if (spec.outfit.hat === "helmet") add(headX, headY - 1, headW, 3, "#aab0ba");
  else if (spec.outfit.hat === "wizard") {
    add(headX - 2, headY, headW + 4, 1, spec.outfit.coat);
    add(headX + 1, headY - 4, headW - 2, 4, spec.outfit.coat);
    add(headX + 2, headY - 6, headW - 4, 2, spec.outfit.coat);
  } else if (spec.outfit.hat === "straw") add(headX - 2, headY - 1, headW + 4, 2, "#d6bd7a");
  else if (spec.outfit.hat === "crown") add(headX + 1, headY - 3, headW - 2, 3, "#e6c75a");
  else if (spec.outfit.hat === "feather") add(headX + headW - 2, headY - 4, 1, 4, "#c04040");

  const propX = left + bodyW + 2;
  switch (spec.outfit.prop) {
    case "spear": add(propX, bodyY - 6, 1, bodyH + legH + 6, "#8a6b45"); add(propX - 1, bodyY - 8, 3, 2, "#c9ced6"); break;
    case "sword": add(propX, bodyY + 2, 1, bodyH, "#c9ced6"); add(propX - 1, bodyY + bodyH - 2, 3, 1, "#d8b96f"); break;
    case "staff": add(propX, bodyY - 4, 1, bodyH + legH + 4, "#8a6b45"); add(propX - 1, bodyY - 6, 3, 2, "#9ad0f0"); break;
    case "hoe": add(propX, bodyY - 2, 1, bodyH + legH + 2, "#8a6b45"); add(propX - 1, bodyY - 2, 3, 1, "#9a9a9a"); break;
    case "hammer": add(propX, bodyY + 1, 1, bodyH, "#8a6b45"); add(propX - 1, bodyY, 3, 2, "#6a6a72"); break;
    case "book": add(left - 3, bodyY + bodyH - 5, 3, 3, "#a87a4a"); break;
    case "pouch": add(left + bodyW - 2, bodyY + bodyH - 3, 3, 3, "#d8b96f"); break;
    default: break;
  }
  if (spec.stage === "elder") add(propX, bodyY + 3, 1, bodyH + legH - 3, "#8a6b45");
  return { rects, shape };
}

function drawPerson(context, spec, x, ground, scale) {
  const { rects } = buildSprite(spec);
  const left = Math.round(x - 10 * scale);
  const top = Math.round(ground - 34 * scale);
  context.imageSmoothingEnabled = false;
  for (const rect of rects) {
    context.fillStyle = rect.color;
    context.fillRect(left + rect.x * scale, top + rect.y * scale, rect.w * scale, rect.h * scale);
  }
}

export function agePositionPercent(age) {
  const waypoints = [[0, 5], [20, 17], [40, 45], [60, 65], [80, 82], [100, 94], [120, 98]];
  const boundedAge = Math.max(0, Math.min(120, age));
  for (let index = 1; index < waypoints.length; index += 1) {
    const [nextAge, nextPosition] = waypoints[index];
    const [previousAge, previousPosition] = waypoints[index - 1];
    if (boundedAge <= nextAge) {
      const progress = (boundedAge - previousAge) / (nextAge - previousAge);
      return previousPosition + (nextPosition - previousPosition) * progress;
    }
  }
  return 98;
}

const LANDSCAPE_PALETTES = {
  kingdom: { sky: "#b9d8d2", far: "#7a9b7b", ground: "#80985c", path: "#c5a56e", wall: "#a9a28c", roof: "#795344", trim: "#ead79c", leaf: "#54754c" },
  empire: { sky: "#d5c49c", far: "#897b68", ground: "#9b895f", path: "#b69a68", wall: "#877f73", roof: "#574a43", trim: "#cfb777", leaf: "#69734d" },
  forest: { sky: "#b8d3b8", far: "#547451", ground: "#718f5d", path: "#a99869", wall: "#987f5e", roof: "#526b4e", trim: "#dcc991", leaf: "#416443" },
  mountain: { sky: "#c1d1d1", far: "#777f7b", ground: "#85856f", path: "#b5a47b", wall: "#888a85", roof: "#5d5c59", trim: "#d5bd82", leaf: "#657858" },
  "demon-realm": { sky: "#b9a9c5", far: "#62566e", ground: "#70647a", path: "#a18483", wall: "#786b83", roof: "#443c55", trim: "#dfbd73", leaf: "#596d68" },
};

function block(context, x, y, width, height, color, sx, sy) {
  context.fillStyle = color;
  context.fillRect(Math.round(x * sx), Math.round(y * sy), Math.max(1, Math.round(width * sx)), Math.max(1, Math.round(height * sy)));
}

function drawTree(context, x, ground, size, palette, sx, sy) {
  block(context, x + size * 0.42, ground - size * 0.43, size * 0.16, size * 0.43, "#604b35", sx, sy);
  block(context, x + size * 0.45, ground - size * 0.31, size * 0.05, size * 0.27, "#806044", sx, sy);
  for (let row = 0; row < 5; row += 1) {
    const span = size * (0.28 + row * 0.16);
    const top = ground - size + row * size * 0.11;
    const left = x + (size - span) / 2;
    block(context, left, top, span, size * 0.17, palette.far, sx, sy);
    block(context, left + span * 0.14, top + size * 0.04, span * 0.7, size * 0.1, palette.leaf, sx, sy);
  }
}

function drawLandscape(context, width, height, life) {
  const sx = width / 400;
  const sy = height / 150;
  const nationId = life.nation?.id ?? "kingdom";
  const palette = LANDSCAPE_PALETTES[nationId] ?? LANDSCAPE_PALETTES.kingdom;
  const ground = 130;
  block(context, 0, 0, 400, 150, palette.sky, sx, sy);
  block(context, 22, 20, 22, 5, "#e9e7d2", sx, sy);
  block(context, 30, 16, 14, 4, "#e9e7d2", sx, sy);
  block(context, 250, 29, 30, 5, "#e9e7d2", sx, sy);
  block(context, 261, 25, 19, 4, "#e9e7d2", sx, sy);

  if (nationId === "mountain") {
    for (const [x, top, span] of [[188, 30, 90], [254, 17, 110], [319, 37, 76]]) {
      for (let row = 0; row < 8; row += 1) {
        const rowWidth = span - Math.abs(4 - row) * 13;
        block(context, x + (span - rowWidth) / 2, top + row * 7, rowWidth, 8, row % 2 ? palette.far : "#909791", sx, sy);
      }
      block(context, x + span * 0.48, top + 8, span * 0.18, 7, "#e5e2d3", sx, sy);
    }
  } else if (nationId === "forest") {
    for (const [x, size] of [[12, 55], [95, 40], [282, 48], [348, 63]]) drawTree(context, x, ground, size, palette, sx, sy);
  } else if (nationId === "empire") {
    block(context, 0, 75, 400, 10, palette.far, sx, sy);
    for (const x of [18, 92, 184, 310, 364]) {
      block(context, x, 54, 20, 35, palette.wall, sx, sy);
      block(context, x - 3, 51, 26, 5, palette.roof, sx, sy);
      for (let crenel = 0; crenel < 3; crenel += 1) block(context, x + crenel * 9, 47, 5, 6, palette.wall, sx, sy);
    }
  } else if (nationId === "demon-realm") {
    for (const [x, top, span] of [[24, 51, 57], [99, 38, 72], [288, 44, 64], [349, 58, 42]]) {
      block(context, x, top + 11, span, ground - top - 11, palette.far, sx, sy);
      for (let row = 0; row < 4; row += 1) block(context, x + row * 5, top + row * 8, span - row * 10, 9, row % 2 ? "#786981" : palette.far, sx, sy);
      block(context, x + span * 0.55, top + 18, 4, 9, "#d9a9df", sx, sy);
    }
  } else {
    block(context, 0, 83, 400, 10, palette.far, sx, sy);
    for (const x of [28, 104, 276, 342]) {
      block(context, x, 70, 37, 18, palette.far, sx, sy);
      block(context, x - 4, 66, 45, 5, palette.far, sx, sy);
    }
  }

  block(context, 0, ground - 2, 400, 22, palette.ground, sx, sy);
  block(context, 0, ground + 5, 400, 4, palette.leaf, sx, sy);
  block(context, 0, ground + 11, 400, 4, palette.path, sx, sy);
  block(context, 0, ground + 15, 400, 4, "#927c54", sx, sy);
  for (const x of [20, 74, 128, 182, 236, 290, 344, 386]) {
    block(context, x, ground - 5, 3, 3, "#e6d99b", sx, sy);
    block(context, x + 5, ground - 1, 2, 2, "#536d47", sx, sy);
  }
  return { sx, sy, ground, palette };
}

function drawHome(context, life, palette, sx, sy) {
  const homeSizes = life.ownsHome
    ? { small: [57, 36], large: [72, 43], estate: [90, 52] }[life.homeType] ?? [57, 36]
    : [47, 31];
  const [houseWidth, houseHeight] = homeSizes;
  const x = 400 - houseWidth - 17;
  const ground = 130;
  const y = ground - houseHeight;
  const forest = life.nation?.id === "forest";
  if (forest) {
    block(context, x + 5, ground - 47, 7, 47, "#684b37", sx, sy);
    block(context, x + houseWidth - 14, ground - 47, 7, 47, "#684b37", sx, sy);
    block(context, x - 7, y + 10, houseWidth + 14, 5, "#71583d", sx, sy);
    block(context, x - 8, y + 4, houseWidth + 16, 7, palette.roof, sx, sy);
    block(context, x + 2, y + 11, houseWidth - 4, houseHeight - 11, palette.wall, sx, sy);
  } else {
    block(context, x + 2, y + 14, houseWidth - 4, houseHeight - 14, palette.wall, sx, sy);
    block(context, x - 4, y + 11, houseWidth + 8, 5, palette.roof, sx, sy);
    block(context, x + 4, y + 6, houseWidth - 8, 6, palette.roof, sx, sy);
    block(context, x + 12, y + 1, houseWidth - 24, 6, palette.roof, sx, sy);
    if (life.nation?.id === "empire") {
      for (let notch = 0; notch < 4; notch += 1) block(context, x + 5 + notch * (houseWidth - 10) / 4, y + 7, 4, 6, palette.wall, sx, sy);
    }
  }
  block(context, x + houseWidth * 0.43, ground - 19, houseWidth * 0.17, 19, "#554235", sx, sy);
  for (const windowX of [x + 8, x + houseWidth - 16]) {
    block(context, windowX, y + 21, 8, 8, palette.trim, sx, sy);
    block(context, windowX + 3, y + 21, 2, 8, palette.roof, sx, sy);
    block(context, windowX, y + 24, 8, 2, palette.roof, sx, sy);
  }
  block(context, x + houseWidth * 0.45, ground - 3, houseWidth * 0.14, 3, "#927c54", sx, sy);
  if (life.ownsHome) {
    block(context, x - 3, ground - 3, 4, 3, "#62824d", sx, sy);
    block(context, x + houseWidth, ground - 4, 5, 4, "#62824d", sx, sy);
  }
}

function drawWorksite(context, life, palette, sx, sy) {
  const occupation = life.occupation ?? "";
  if (/農|家業/.test(occupation)) {
    block(context, 22, 110, 62, 3, "#826342", sx, sy);
    for (const x of [28, 43, 58, 73]) {
      block(context, x, 103, 3, 7, palette.leaf, sx, sy);
      block(context, x - 2, 101, 7, 3, "#a8aa59", sx, sy);
    }
  } else if (/商人/.test(occupation)) {
    block(context, 25, 93, 48, 4, "#74513b", sx, sy);
    block(context, 30, 97, 3, 16, "#614b39", sx, sy);
    block(context, 66, 97, 3, 16, "#614b39", sx, sy);
    block(context, 21, 86, 56, 8, "#a35345", sx, sy);
    block(context, 21, 94, 56, 3, palette.trim, sx, sy);
  } else if (/鍛冶|職人|工房/.test(occupation)) {
    block(context, 27, 93, 49, 20, "#776553", sx, sy);
    block(context, 23, 88, 57, 6, palette.roof, sx, sy);
    block(context, 62, 73, 8, 17, palette.wall, sx, sy);
    block(context, 65, 68, 4, 5, "#898a85", sx, sy);
    block(context, 38, 101, 10, 6, "#bd7040", sx, sy);
    block(context, 41, 102, 4, 4, "#f0bd5e", sx, sy);
  } else if (/騎士|兵士/.test(occupation)) {
    block(context, 28, 83, 48, 30, palette.wall, sx, sy);
    block(context, 23, 78, 58, 6, palette.roof, sx, sy);
    block(context, 46, 96, 12, 17, "#56493f", sx, sy);
    block(context, 36, 90, 4, 9, palette.trim, sx, sy);
    block(context, 64, 90, 4, 9, palette.trim, sx, sy);
  } else if (/学|教師|魔術/.test(occupation)) {
    block(context, 30, 82, 50, 31, palette.wall, sx, sy);
    block(context, 25, 77, 60, 6, palette.roof, sx, sy);
    block(context, 47, 67, 15, 12, palette.wall, sx, sy);
    block(context, 45, 64, 19, 4, palette.trim, sx, sy);
    block(context, 49, 91, 12, 22, "#594d45", sx, sy);
  }
}

export function livingFamily(life) {
  const npcs = life.npcs ?? [];
  const spouse = life.spouseId ? npcs.find((npc) => npc.id === life.spouseId && npc.alive) : null;
  const children = (life.children ?? [])
    .map((entry) => (typeof entry === "string" ? npcs.find((npc) => npc.id === entry) ?? { id: entry, humanAge: 6, alive: true, legacy: true } : entry))
    .filter((child) => child && child.alive !== false && !child.independent);
  const spouseFallback = !life.spouseId && life.spouse ? { name: String(life.spouse), humanAge: Math.max(20, (life.age ?? 20) - 2), gender: "その他", occupation: "", race: life.race?.id } : null;
  return { spouse: spouse ?? spouseFallback, children };
}

export function drawJourney(context, sprite, { life } = {}) {
  if (!context || !life) return;
  const { width, height } = context.canvas;
  context.clearRect(0, 0, width, height);
  const { sx, sy, ground, palette } = drawLandscape(context, width, height, life);
  drawWorksite(context, life, palette, sx, sy);
  drawHome(context, life, palette, sx, sy);
  const age = life.age ?? 0;
  const x = Math.max(48, Math.min(width - 48, width * agePositionPercent(age) / 100));
  const baseline = height * (ground + 5) / 150;
  const scale = Math.max(1, Math.min(2, Math.floor(height / 70)));
  const household = [];
  const showingParents = age < 12 && life.active !== false && life.parents;
  if (showingParents) {
    household.push(
      { name: `guardian-${life.name}-father`, age: 36, gender: "男性", occupation: life.parents.father, race: life.race?.id },
      { name: `guardian-${life.name}-mother`, age: 34, gender: "女性", occupation: life.parents.mother, race: life.race?.id },
    );
  } else {
    const { spouse, children } = livingFamily(life);
    if (spouse) household.push({ ...spouse, race: spouse.race ?? life.race?.id });
    household.push(...children.map((child) => ({ ...child, race: child.race ?? life.race?.id, name: child.name ?? String(child.id) })));
  }
  const shown = life.active === false ? [] : household.slice(0, 4);
  shown.forEach((person, index) => {
    const side = index % 2 === 0 ? -1 : 1;
    const distance = (showingParents ? 34 : 20) + Math.floor(index / 2) * 19;
    const personX = Math.max(showingParents ? 24 : 11, Math.min(width - 11, x + side * distance));
    drawPerson(context, spriteSpec(person), personX, baseline, showingParents ? scale : 1);
  });
  if (life.active !== false) {
    drawPerson(context, buildHeroSpec(life), x, baseline, scale);
  }
  const hidden = life.active === false ? 0 : Math.max(0, household.length - shown.length);
  if (hidden > 0 && context.fillText) {
    context.fillStyle = "#4a3a2c";
    context.font = "bold 12px sans-serif";
    context.fillText(`+${hidden}`, Math.max(5, Math.min(width - 25, x + 42)), baseline - 4);
  }
}

export function buildHeroSpec(life) {
  return spriteSpec({
    race: life.race?.id, age: life.age, gender: life.gender, name: life.name, occupation: life.occupation,
    status: life.status, appearance: life.appearance, health: life.health,
  }, { isHero: true });
}

export function drawCharacter(context, sprite, options = {}) {
  if (!context) return;
  const life = {
    age: 0,
    nation: { id: "kingdom" },
    race: { id: "human" },
    appearance: { hair: options.hair, coat: options.coat },
    playing: options.walking,
  };
  drawJourney(context, sprite, { life, frame: options.frame });
}
