const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 3000 });
const players = {};

wss.on("connection", ws => {
  const id = Math.random().toString(36).slice(2);
  players[id] = { x: 3, y: 3, angle: 0 };

  ws.send(JSON.stringify({ id }));

  ws.on("message", msg => {
    players[id] = JSON.parse(msg);
    broadcast();
  });

  ws.on("close", () => {
    delete players[id];
    broadcast();
  });
});

function broadcast() {
  const data = JSON.stringify(players);
  wss.clients.forEach(c => c.readyState === 1 && c.send(data));
}

console.log("Server running on ws://localhost:3000");
