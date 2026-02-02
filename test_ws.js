const WebSocket = require('ws');

// target: wss://memory-api.tight-butterfly-7b71.workers.dev/memory/visualizer?workspace=emily

const url = 'wss://memory-api.tight-butterfly-7b71.workers.dev/memory/visualizer?workspace=emily';
console.log(`Connecting to ${url}...`);

const ws = new WebSocket(url);

ws.on('open', () => {
  console.log('Connected!');
  ws.send(JSON.stringify({ op: 'ping' }));
});

ws.on('message', (data) => {
  console.log('Received:', data.toString());
  ws.close();
});

ws.on('error', (err) => {
  console.error('Error:', err.message);
});

ws.on('close', (code, reason) => {
  console.log(`Closed: ${code} ${reason}`);
});
