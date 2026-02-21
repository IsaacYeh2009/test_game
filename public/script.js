const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const map = [
  "1111111111",
  "1000000001",
  "1000010001",
  "1000000001",
  "1111111111",
];

const TILE = 1;
const FOV = Math.PI / 3;
const RAYS = canvas.width;

let player = { x: 2, y: 2, angle: 0 };
let others = {};
let myId = null;

/* --- WebSocket --- */
const wsProtocol = location.protocol === "https:" ? "wss://" : "ws://";
const ws = new WebSocket(wsProtocol + location.host);

ws.onmessage = e => {
  const data = JSON.parse(e.data);
  if (data.id) myId = data.id;
  else others = data;
};

/* --- Input --- */
const keys = {};
onkeydown = e => keys[e.key] = true;
onkeyup = e => keys[e.key] = false;

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
  if (keys["ArrowUp"]) {
    player.x += Math.cos(player.angle) * 0.05;
    player.y += Math.sin(player.angle) * 0.05;
  }

  ws.readyState === 1 && ws.send(JSON.stringify(player));
}

/* --- Render --- */
function render() {
  ctx.fillStyle = "#222";
  ctx.fillRect(0, 0, canvas.width, canvas.height / 2);
  ctx.fillStyle = "#555";
  ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);

  for (let i = 0; i < RAYS; i++) {
    const angle = player.angle - FOV / 2 + (i / RAYS) * FOV;
    const dist = castRay(angle) * Math.cos(angle - player.angle);
    const height = canvas.height / dist;

    ctx.fillStyle = "white";
    ctx.fillRect(i, (canvas.height - height) / 2, 1, height);
  }

  requestAnimationFrame(loop);
}

function loop() {
  update();
  render();
}

loop();
