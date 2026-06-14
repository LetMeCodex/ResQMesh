import { WebSocketServer } from 'ws';

const PORT = 8080;
const wss = new WebSocketServer({ port: PORT });

console.log(`========================================================`);
console.log(`🛰️  ResQMesh P2P Local WebSocket Server is running!`);
console.log(`🔌 Address: ws://localhost:${PORT}`);
console.log(`📡 Broadcast mesh airwaves initialized.`);
console.log(`========================================================`);

const clients = new Set();

wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  clients.add(ws);
  console.log(`[Mesh Radio] 🟢 New peer connected from ${clientIp}. Total peers active: ${clients.size}`);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log(`[Mesh Radio] 🔁 Received message type: "${data.type}"`);

      // Broadcast the packet to all other connected peers (simulating spatial RF transmission)
      const broadcastPayload = JSON.stringify(data);
      let relayedCount = 0;
      clients.forEach((client) => {
        if (client !== ws && client.readyState === 1) {
          client.send(broadcastPayload);
          relayedCount++;
        }
      });
      if (relayedCount > 0) {
        console.log(`[Mesh Radio] 📣 Relayed packet to ${relayedCount} other active node(s).`);
      }
    } catch (err) {
      console.error('[Mesh Radio] ❌ Error processing incoming packet:', err.message);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[Mesh Radio] 🔴 Peer disconnected. Total peers active: ${clients.size}`);
  });

  ws.on('error', (err) => {
    console.error(`[Mesh Radio] ⚠️ Socket error:`, err.message);
  });
});
