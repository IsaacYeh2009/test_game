const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const PLAYER_RADIUS = 0.2;
const MOVE_SPEED = 0.05;

const map = [
  "1111111111",
  "1000000001",
  "1001000001",
  "1000000001",
  "1111111111",
];
function isWall(x, y) {
  return map[Math.floor(y)]?.[Math.floor(x)] === "1";
}

const TILE = 1;
const FOV = Math.PI / 3;
const RAYS = canvas.width;

let player = { x: 2, y: 2, angle: 0 };
let others = {};
let myId = null;

/* --- WebSocket --- */
const wsProtocol = location.protocol === "https:" ? "wss://" : "ws://";
const ws = new WebSocket(wsProtocol + location.host);

ws.onmessage = (e) => {
  const data = JSON.parse(e.data);
  if (data.id) myId = data.id;
  else others = data;
};

/* --- Input --- */
const keys = {};
onkeydown = (e) => (keys[e.key] = true);
onkeyup = (e) => (keys[e.key] = false);

/* --- Raycasting --- */
function castRay(angle) {
  for (let d = 0; d < 20; d += 0.02) {
    const x = player.x + Math.cos(angle) * d;
    const y = player.y + Math.sin(angle) * d;
    if (map[Math.floor(y)][Math.floor(x)] === "1") return d;
  }
  return 20;
}

/* --- Update --- */
function update() {
  if (keys["ArrowLeft"]) player.angle -= 0.04;
  if (keys["ArrowRight"]) player.angle += 0.04;

  let moveX = 0;
  let moveY = 0;

  if (keys["s"]) {
    moveX = -Math.cos(player.angle) * MOVE_SPEED;
    moveY = -Math.sin(player.angle) * MOVE_SPEED;
  }
  if (keys["w"]) {
    moveX = Math.cos(player.angle) * MOVE_SPEED;
    moveY = Math.sin(player.angle) * MOVE_SPEED;
  }
  if (keys["a"]) {
    moveX = Math.cos(player.angle) * MOVE_SPEED;
    moveY = Math.sin(player.angle) * MOVE_SPEED;
  }

  // --- X axis collision ---
  const nextX = player.x + moveX;
  if (
    !isWall(nextX + PLAYER_RADIUS, player.y) &&
    !isWall(nextX - PLAYER_RADIUS, player.y)
  ) {
    player.x = nextX;
  }

  // --- Y axis collision ---
  const nextY = player.y + moveY;
  if (
    !isWall(player.x, nextY + PLAYER_RADIUS) &&
    !isWall(player.x, nextY - PLAYER_RADIUS)
  ) {
    player.y = nextY;
  }

  // Send updated position to server
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(player));
  }
}

/* --- Render --- */
function render() {
  // Sky
  ctx.fillStyle = "#222";
  ctx.fillRect(0, 0, canvas.width, canvas.height / 2);

  // Floor
  ctx.fillStyle = "#555";
  ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);

  // --- WALLS ---
  const depthBuffer = [];

  for (let i = 0; i < RAYS; i++) {
    const rayAngle = player.angle - FOV / 2 + (i / RAYS) * FOV;
    const dist = castRay(rayAngle) * Math.cos(rayAngle - player.angle);
    const height = canvas.height / dist;

    depthBuffer[i] = dist;

    ctx.fillStyle = "#ddd";
    ctx.fillRect(i, (canvas.height - height) / 2, 1, height);
  }

  // --- OTHER PLAYERS (SPRITES) ---
  for (const id in others) {
    if (id === myId) continue;

    const p = others[id];

    const dx = p.x - player.x;
    const dy = p.y - player.y;

    const distance = Math.sqrt(dx * dx + dy * dy);
    const angleToPlayer = Math.atan2(dy, dx) - player.angle;

    // Normalize angle
    const angle = Math.atan2(Math.sin(angleToPlayer), Math.cos(angleToPlayer));

    // Outside FOV
    if (Math.abs(angle) > FOV / 2) continue;

    // Screen X position
    const screenX = (0.5 + angle / FOV) * canvas.width;

    const size = canvas.height / distance;

    // Depth check (simple occlusion)
    const column = Math.floor(screenX);
    if (depthBuffer[column] && depthBuffer[column] < distance) continue;

    ctx.fillStyle = "red";
    ctx.fillRect(
      screenX - size / 4,
      (canvas.height - size) / 2,
      size / 2,
      size
    );
  }

  requestAnimationFrame(loop);
}

function loop() {
  update();
  render();
}

loop();
