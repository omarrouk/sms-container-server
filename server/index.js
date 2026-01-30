require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const routes = require('./routes');
const db = require('./db');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve web UI
app.use('/', express.static(__dirname + '/../web'));

app.use('/', routes);

const PORT = process.env.PORT || 4000;

async function start() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI not set in environment');
    process.exit(1);
  }

  await db.connect(mongoUri);

  app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
  });

  // KEEP-ALIVE: internal periodic ping to /health every 14 seconds.
  // Purpose: Prevent some hosting providers from putting the process to sleep by making
  // internal self-requests. This is done inside the process and does not rely on external services.
  setInterval(async () => {
    try {
      await fetch(`http://localhost:${PORT}/health`);
    } catch (err) {
      // ignore errors - this is best-effort
    }
  }, 14000);
}

start();
