// Replace these 16×20 pixel maps and palette to swap the original placeholder art.
const idle = [
  "......HHHH......",
  ".....HHHHHH.....",
  ".....HSSSSH.....",
  ".....SSEESS.....",
  "......SSSS......",
  ".......SS.......",
  ".....CCCCCC.....",
  "....CCCTTCCC....",
  "....CCCCCCCC....",
  "...CCCCCCCCCC...",
  "...CCCCCCCCCC...",
  "....CCCCCCTT....",
  "....CCCCCCCC....",
  "....CCCCCCCC....",
  ".....PP..PP.....",
  ".....PP..PP.....",
  ".....PP..PP.....",
  "....BB....BB....",
  "....BB....BB....",
  "....BBBBBBBB....",
];

const leftStep = [
  ...idle.slice(0, 14),
  "....PP..PP......",
  "...PP....PP.....",
  "...PP....PP.....",
  "...BB.....BB....",
  "..BB......BB....",
  "..BBBB..BBBB....",
];

const rightStep = [
  ...idle.slice(0, 14),
  "......PP..PP....",
  ".....PP....PP...",
  ".....PP....PP...",
  "....BB.....BB...",
  ".....BB......BB.",
  "....BBBB..BBBB..",
];

export const characterSprite = {
  width: 16,
  height: 20,
  palette: {
    H: "#34271f",
    S: "#e2b98e",
    E: "#382d27",
    C: "#647d72",
    T: "#d8b96f",
    P: "#544334",
    B: "#352b24",
  },
  idle,
  walk: [leftStep, rightStep],
};

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

function drawPerson(context, sprite, x, ground, scale, {
  walking = false,
  frame = 0,
  hair = "#34271f",
  coat = "#647d72",
  race = "human",
  age = 20,
  role = "main",
} = {}) {
  const rows = walking ? sprite.walk[frame % sprite.walk.length] : sprite.idle;
  const palette = { ...sprite.palette, H: age >= 85 ? "#aaa394" : hair, C: coat };
  const width = sprite.width * scale;
  const height = sprite.height * scale;
  const pixel = Math.max(1, Math.floor(scale));
  const left = Math.round(x - width / 2);
  const top = Math.round(ground - height);
  context.imageSmoothingEnabled = false;
  for (let y = 0; y < sprite.height; y += 1) {
    for (let column = 0; column < sprite.width; column += 1) {
      const color = palette[rows[y][column]];
      if (color) {
        context.fillStyle = color;
        context.fillRect(left + column * scale, top + y * scale, pixel, pixel);
      }
    }
  }
  context.fillStyle = race === "elf" ? "#668c68" : race === "demon" ? "#8f5260" : "#34271f";
  if (race === "beastkin") {
    context.fillRect(left + 5 * scale, top + 2 * scale, pixel, pixel * 2);
    context.fillRect(left + 10 * scale, top + 2 * scale, pixel, pixel * 2);
    context.fillRect(left + 12 * scale, top + 15 * scale, pixel * 2, pixel);
  } else if (race === "dwarf") {
    context.fillStyle = "#8c8171";
    context.fillRect(left + 6 * scale, top + 6 * scale, pixel * 4, pixel * 2);
  } else if (race === "elf") {
    context.fillRect(left + 3 * scale, top + 6 * scale, pixel * 2, pixel);
    context.fillRect(left + 11 * scale, top + 6 * scale, pixel * 2, pixel);
  } else if (race === "demon") {
    context.fillRect(left + 5 * scale, top + 1 * scale, pixel, pixel * 2);
    context.fillRect(left + 10 * scale, top + 1 * scale, pixel, pixel * 2);
  } else if (race === "dragon") {
    context.fillRect(left + 1 * scale, top + 9 * scale, pixel * 3, pixel * 3);
    context.fillRect(left + 12 * scale, top + 9 * scale, pixel * 3, pixel * 3);
  } else if (race === "vampire") {
    context.fillStyle = "#49344d";
    context.fillRect(left + 3 * scale, top + 10 * scale, pixel * 10, pixel);
  }
  if (role === "main" && age >= 60) {
    context.fillStyle = "#786f64";
    context.fillRect(left + 6 * scale, top + 8 * scale, pixel, pixel);
  }
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

export function drawJourney(context, sprite, { life, frame = 0 } = {}) {
  if (!context || !life) return;
  const { width, height } = context.canvas;
  context.clearRect(0, 0, width, height);
  drawLandscape(context, width, height, life);
  const age = life.age ?? 0;
  const x = width * agePositionPercent(age) / 100;
  const ageScale = age < 8 ? 1.55 : age < 18 ? 1.9 : age > 85 ? 2.6 : 2.35;
  const coat = life.occupation === "兵士" ? "#657491"
    : life.occupation === "冒険者" ? "#87634c"
      : life.occupation === "教師" ? "#786984"
        : life.appearance?.coat ?? "#647d72";
  drawPerson(context, sprite, x, height - 16, ageScale, {
    walking: life.playing,
    frame,
    hair: life.appearance?.hair,
    coat,
    race: life.race?.id,
    age,
  });
  let familyOffset = 0;
  if (life.spouse) {
    familyOffset += 1;
    drawPerson(context, sprite, x + 14 * ageScale, height - 14, 1.45, {
      hair: "#765947", coat: "#9b6855", race: life.race?.id, age: 25, role: "family",
    });
  }
  (life.children ?? []).slice(-3).forEach((_, index) => {
    drawPerson(context, sprite, x + (15 + familyOffset * 8 + index * 10) * ageScale, height - 13, 1.05, {
      hair: "#47312b", coat: "#8e7957", race: life.race?.id, age: 8, role: "family",
    });
  });
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
