const express = require('express');
const fs = require('fs');
const path = require('path');

const serverPath = __dirname;
const clientPath = path.join(serverPath, '../client');
const privateKey = path.join(serverPath, 'key.pem');
const publicKey = path.join(clientPath, 'cert.pem');

const app = express();
const server = require('https').createServer({
  key: fs.readFileSync(privateKey),
  cert: fs.readFileSync(publicKey),
}, app);

const socket = require('socket.io')(server);

const version = Math.floor(new Date().getTime() / 1000);

const port = process.argv[2] || 3000;
console.log(`Starting on port ${port}.`);

server.listen(port, () => console.log('Listening'));

const indexPath = path.join(clientPath, 'index.html');

app.use(express.static(clientPath));
app.get('/', (req, res) => res.sendFile(indexPath));

const receive = (s, e, ...a) => {
  console.log('<', s.id, e, ...a);
};
const emit = (s, e, ...a) => {
  console.log('>', s.id, e, ...a);
  s.emit(e, ...a);
};
const broadcast = (s, e, ...a) => {
  console.log('>>', s.id, e, ...a);
  s.broadcast.emit(e, ...a);
};
const broadcastAll = (s, e, ...a) => {
  console.log('>>>', s.id, e, ...a);
  socket.emit(e, ...a);
};
const on = (s, e, f, ...a) => s.on(e, (...ar) => {
  receive(s, e, ...ar);
  return f && f(...ar) || undefined;
}, ...a);

const { addName, removeName } = require('./names');

let nConnections = 0;
socket.on('connect', client => {
  client.name = addName();
  receive(client, 'connect');
  console.log(++nConnections + ' Connections');
  broadcast(client, 'chat', 0, client.name + ' connected');
  on(client, 'disconnect', () => {
    console.log(--nConnections + ' Connections');
    removeName(client.name);
    broadcast(client, 'chat', 0, client.name + ' disconnected');
  });
  on(client, 'chat', text => {
    broadcastAll(client, 'chat', client.name, text);
  });
  emit(client, 'version', version);
  emit(client, 'name', client.name);
  emit(client, 'chat', 0, 'Welcome to Nonograms, ' + client.name + '!');
});
