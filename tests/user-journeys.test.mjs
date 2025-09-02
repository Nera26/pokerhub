import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

// In-memory DB representation
const db = {
  wallets: new Map(),
  tables: new Map(),
  tournaments: new Map(),
};

let server;
let wss;
let port;

function jsonBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => resolve(data ? JSON.parse(data) : {}));
  });
}

before(async () => {
  const sockets = new Set();
  const tableSockets = new Map(); // tableId -> Set of sockets

  server = createServer(async (req, res) => {
    if (!req.url) return res.end();
    if (req.method === 'POST' && /\/wallet\/([^/]+)\/deposit/.test(req.url)) {
      const id = req.url.split('/')[2];
      const body = await jsonBody(req);
      const amount = Number(body.amount || 0);
      const wallet = db.wallets.get(id) || { balance: 0 };
      wallet.balance += amount;
      db.wallets.set(id, wallet);
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ balance: wallet.balance }));
    }
    if (req.method === 'POST' && /\/wallet\/([^/]+)\/withdraw/.test(req.url)) {
      const id = req.url.split('/')[2];
      const body = await jsonBody(req);
      const amount = Number(body.amount || 0);
      const wallet = db.wallets.get(id) || { balance: 0 };
      wallet.balance -= amount;
      db.wallets.set(id, wallet);
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ balance: wallet.balance }));
    }
    if (req.method === 'POST' && /\/tournaments\/([^/]+)\/register/.test(req.url)) {
      const id = req.url.split('/')[2];
      const body = await jsonBody(req);
      const t = db.tournaments.get(id) || { players: new Set() };
      t.players.add(body.userId);
      db.tournaments.set(id, t);
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ registered: true }));
    }
    res.statusCode = 404;
    res.end();
  });

  wss = new WebSocketServer({ server });
  wss.on('connection', (ws) => {
    sockets.add(ws);
    ws.on('message', (raw) => {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'join') {
        const table = db.tables.get(msg.tableId) || { players: new Set(), messages: [] };
        table.players.add(msg.userId);
        db.tables.set(msg.tableId, table);
        let set = tableSockets.get(msg.tableId);
        if (!set) tableSockets.set(msg.tableId, (set = new Set()));
        set.add(ws);
        const out = JSON.stringify({ type: 'join', userId: msg.userId });
        for (const s of set) s.send(out);
      } else if (msg.type === 'chat') {
        const table = db.tables.get(msg.tableId);
        if (!table) return;
        table.messages.push({ user: msg.userId, text: msg.text });
        const set = tableSockets.get(msg.tableId);
        if (set) {
          const out = JSON.stringify({ type: 'chat', userId: msg.userId, text: msg.text });
          for (const s of set) s.send(out);
        }
      }
    });
    ws.on('close', () => {
      sockets.delete(ws);
      for (const set of tableSockets.values()) set.delete(ws);
    });
  });

  await new Promise((resolve) => {
    server.listen(0, () => {
      const addr = server.address();
      if (typeof addr === 'object' && addr) port = addr.port;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  wss.close();
});

// Wallet journey
test('wallet deposit and withdraw update balance', async () => {
  await fetch(`http://localhost:${port}/wallet/user1/deposit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 100 }),
  });
  assert.equal(db.wallets.get('user1')?.balance, 100);

  await fetch(`http://localhost:${port}/wallet/user1/withdraw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 40 }),
  });
  assert.equal(db.wallets.get('user1')?.balance, 60);
});

// Table join & chat
test('table join and chat broadcasts to participants', async () => {
  const url = `ws://localhost:${port}`;
  const alice = new WebSocket(url);
  const bob = new WebSocket(url);

  await Promise.all([
    new Promise((resolve) => alice.once('open', resolve)),
    new Promise((resolve) => bob.once('open', resolve)),
  ]);

  await new Promise((resolve) => {
    let joins = 0;
    const check = () => { if (joins === 2) resolve(); };
    const handler = () => { joins++; check(); };
    alice.on('message', (d) => { const m = JSON.parse(d.toString()); if (m.type === 'join') handler(); });
    bob.on('message', (d) => { const m = JSON.parse(d.toString()); if (m.type === 'join') handler(); });
    alice.send(JSON.stringify({ type: 'join', tableId: 't1', userId: 'alice' }));
    bob.send(JSON.stringify({ type: 'join', tableId: 't1', userId: 'bob' }));
  });

  let received;
  await new Promise((resolve) => {
    bob.on('message', (d) => {
      const m = JSON.parse(d.toString());
      if (m.type === 'chat') { received = m; resolve(); }
    });
    alice.send(JSON.stringify({ type: 'chat', tableId: 't1', userId: 'alice', text: 'hello' }));
  });

  assert.equal(received.text, 'hello');
  assert.equal(db.tables.get('t1')?.messages.length, 1);

  alice.close();
  bob.close();
});

// Tournament registration
test('tournament registration persists player', async () => {
  await fetch(`http://localhost:${port}/tournaments/t9/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'alice' }),
  });
  assert(db.tournaments.get('t9')?.players.has('alice'));
});

