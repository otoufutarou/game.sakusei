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
export function buildSprite(spec, frame = 0, walking = false) {
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

  const stepA = walking && frame % 2 === 0 ? 1 : 0;
  const stepB = walking && frame % 2 === 1 ? 1 : 0;
  const legW = Math.max(2, Math.floor(bodyW / 2) - 1);
  add(left + 1 - stepA, legY, legW, legH, "#544334");
  add(left + bodyW - 1 - legW + stepB, legY, legW, legH, "#544334");
  add(left + 1 - stepA - 1, legY + legH - 1, legW + 1, 1, dark);
  add(left + bodyW - 1 - legW + stepB, legY + legH - 1, legW + 1, 1, dark);

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

function drawPerson(context, spec, x, ground, scale, { walking = false, frame = 0 } = {}) {
  const { rects } = buildSprite(spec, frame, walking);
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

function drawLandscape(context, width, height, life) {
  const palettes = {
    kingdom: ["#d9e7e3", "#829a79", "#afaa75"],
    empire: ["#eadbb8", "#c59b57", "#9b8153"],
    forest: ["#d7e4d0", "#79946a", "#5e7b62"],
    mountain: ["#d9e0e2", "#9c9e96", "#72766f"],
    "demon-realm": ["#d6cbd8", "#786b85", "#55485f"],
  };
  const colors = palettes[life.race.id === "dragon" ? "demon-realm" : life.nation.id] ?? palettes.kingdom;
  const sky = context.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, colors[0]);
  sky.addColorStop(0.68, "#f4e8c8");
  sky.addColorStop(1, colors[1]);
  context.fillStyle = sky;
  context.fillRect(0, 0, width, height);
  context.fillStyle = colors[2];
  context.fillRect(0, height - 21, width, 21);
  context.fillStyle = "#927c54";
  context.fillRect(0, height - 17, width, 4);
  context.fillStyle = "#d8c49c";
  context.fillRect(0, height - 13, width, 3);

  if (life.race.id === "dragon" || life.nation.id === "mountain") {
    context.fillStyle = colors[1];
    context.beginPath();
    context.moveTo(width * 0.56, height - 20);
    context.lineTo(width * 0.7, height * 0.13);
    context.lineTo(width * 0.84, height - 20);
    context.fill();
    context.beginPath();
    context.moveTo(width * 0.75, height - 20);
    context.lineTo(width * 0.91, height * 0.25);
    context.lineTo(width, height - 20);
    context.fill();
  } else if (life.nation.id === "forest") {
    for (const x of [width * 0.14, width * 0.25, width * 0.81, width * 0.91]) {
      context.fillStyle = "#5d7659";
      context.fillRect(x, height * 0.36, 5, height * 0.43);
      context.fillStyle = "#708d67";
      context.fillRect(x - 10, height * 0.22, 25, height * 0.3);
    }
  } else {
    context.fillStyle = "#a88656";
    context.fillRect(width * 0.77, height * 0.48, 32, height * 0.3);
    context.fillStyle = "#765943";
    context.fillRect(width * 0.75, height * 0.4, 36, 8);
    context.fillStyle = "#f5e8cb";
    context.fillRect(width * 0.79, height * 0.57, 5, 8);
  }
  context.fillStyle = "#8f774d";
  context.fillRect(width * 0.04, height - 27, width * 0.92, 2);
  for (let index = 0; index < 7; index += 1) {
    const markerX = width * (0.05 + index * 0.15);
    context.fillStyle = "#fffaf0";
    context.fillRect(markerX, height - 31, 2, 8);
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

export function drawJourney(context, sprite, { life, frame = 0 } = {}) {
  if (!context || !life) return;
  const { width, height } = context.canvas;
  context.clearRect(0, 0, width, height);
  drawLandscape(context, width, height, life);
  const age = life.age ?? 0;
  const x = width * agePositionPercent(age) / 100;
  const ground = height - 14;
  const scale = Math.max(1, Math.min(3, Math.floor((height - 24) / 36)));
  const walking = Boolean(life.playing) && life.active !== false;
  if (life.active !== false) {
    drawPerson(context, buildHeroSpec(life), x, ground, scale, { walking, frame });
  }
  const { spouse, children } = livingFamily(life);
  const spacing = 13 * scale;
  let cursor = x + spacing;
  if (spouse && life.active !== false) {
    drawPerson(context, spriteSpec({ ...spouse, race: spouse.race ?? life.race?.id }), Math.min(cursor, width - 12 * scale), ground, scale, { walking, frame: frame + 1 });
    cursor += spacing;
  }
  const slots = Math.max(0, Math.floor((width - 12 * scale - cursor) / (9 * scale)) + 1);
  const shown = life.active === false ? [] : children.slice(0, Math.min(slots, 5));
  shown.forEach((child, index) => {
    const childScale = Math.max(1, scale - 1);
    drawPerson(context, spriteSpec({ ...child, race: child.race ?? life.race?.id, name: child.name ?? String(child.id) }), cursor + index * 9 * scale, ground, childScale, { walking, frame: frame + index });
  });
  const hidden = children.length - shown.length;
  if (hidden > 0 && context.fillText) {
    context.fillStyle = "#4a3a2c";
    context.font = "bold 12px sans-serif";
    context.fillText(`+${hidden}`, Math.min(width - 24, cursor + shown.length * 9 * scale), ground - 4);
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
