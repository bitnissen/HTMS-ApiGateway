require('dotenv').config();
require('module-alias/register');

const micro = require('micro');
const microCors = require('micro-cors');
const match = require('fs-router')(`${__dirname}/routes`);
const socketioLib = require('socket.io');
const callApiIo = require('@routes-io/call-api');
const staticFiles = require('serve-handler');

if (!process.env.SYSEVENT) {
  console.error('Environment variable SYSEVENT must be set to the URL of the Event-service.');
  process.exit();
}

const server = micro(microCors()(async (req, res) => {
  // prio 1: rest api
  const matched = match(req);
  if (matched) return matched(req, res);

  // prio 2: static folder (public/)
  return staticFiles(req, res, {
    public: 'static',
  });
}));

// run regular http server
server.listen(
  process.env.WEB_PORT ? Number(process.env.WEB_PORT) : 80,
  process.env.WEB_IP || '0.0.0.0',
);

const socketio = socketioLib(server, {
  cookie: false,
});

// run socket.io server
socketio.on('connection', callApiIo);
