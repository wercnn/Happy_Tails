require('dotenv').config();
const http = require('http');
const { router } = require('./router');

// Load all route files — each one calls register() to add its routes
require('./routes/auth');
require('./routes/pets');
require('./routes/admin');    // must come before minders — registers /api/minders/pending before the :id wildcard
require('./routes/minders');
require('./routes/bookings');
require('./routes/reports');
require('./routes/messages');
require('./routes/reviews');
require('./routes/payments');
require('./routes/disputes');
require('./routes/users');

const server = http.createServer((req, res) => {
  // CORS headers — allow the React frontend to call this server from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-User-Id, X-User-Role');
  res.setHeader('Content-Type', 'application/json');

  // Handle browser preflight requests (sent before cross-origin POST/PATCH/DELETE)
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  router(req, res);
});

const envPort = Number(process.env.API_PORT || process.env.PORT);
const PORT = Number.isInteger(envPort) && envPort > 0 && envPort !== 3306 ? envPort : 3000;

if (envPort === 3306) {
  console.warn('PORT=3306 detected; using 3000 for API server to avoid MySQL port conflict.');
}

server.listen(PORT, () => {
  console.log(`Happy Tails server running at http://localhost:${PORT}`);
});