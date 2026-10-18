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

export function drawCharacter(context, sprite, { walking = false, frame = 0, hair = "#34271f", coat = "#647d72" } = {}) {
  const rows = walking ? sprite.walk[frame % sprite.walk.length] : sprite.idle;
  const palette = { ...sprite.palette, H: hair, C: coat };
  const cellWidth = context.canvas.width / sprite.width;
  const cellHeight = context.canvas.height / sprite.height;
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  context.imageSmoothingEnabled = false;
  for (let y = 0; y < sprite.height; y += 1) {
    for (let x = 0; x < sprite.width; x += 1) {
      const color = palette[rows[y][x]];
      if (color) {
        context.fillStyle = color;
        context.fillRect(Math.floor(x * cellWidth), Math.floor(y * cellHeight), Math.ceil(cellWidth), Math.ceil(cellHeight));
      }
    }
  }
}
