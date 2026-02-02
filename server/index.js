require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const routes = require('./routes');
const db = require('./db');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - ${req.ip}`);
  next();
});

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
}

start();
