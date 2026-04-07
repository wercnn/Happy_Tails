// ─── Helpers ────────────────────────────────────────────────────────────────

// Reads the incoming request body stream and parses it as JSON
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => (data += chunk));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error('Invalid JSON in request body'));
      }
    });
  });
}

// Sends a JSON response with a given HTTP status code
function send(res, status, body) {
  res.writeHead(status);
  res.end(JSON.stringify(body));
}

// Checks the X-User-Role header matches the required role(s)
// Pass a string for a single role, or an array to allow multiple roles
// Returns true if allowed, writes 403 and returns false if not
function requireRole(role, req, res) {
  const userRole = req.headers['x-user-role'];
  const allowed = Array.isArray(role)
    ? role.includes(userRole)
    : userRole === role;

  if (!allowed) {
    send(res, 403, { error: 'Forbidden: insufficient role' });
    return false;
  }
  return true;
}

// ─── Router ─────────────────────────────────────────────────────────────────

const routes = [];

// Register a route: method, path pattern, async handler function
// Path patterns support :param segments e.g. /api/pets/:id
function register(method, path, handler) {
  routes.push({ method: method.toUpperCase(), path, handler });
}

// Converts a path pattern like /api/pets/:id into a regex
// Returns { regex, keys } where keys = ['id']
function compilePath(path) {
  const keys = [];
  const pattern = path
    .replace(/:([a-zA-Z_]+)/g, (_, key) => {
      keys.push(key);
      return '([^/]+)';
    })
    .replace(/\//g, '\\/');
  return { regex: new RegExp(`^${pattern}$`), keys };
}

// Main router — called by server.js on every incoming request
async function router(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  for (const route of routes) {
    if (route.method !== req.method) continue;

    const { regex, keys } = compilePath(route.path);
    const match = pathname.match(regex);
    if (!match) continue;

    // Attach named URL params e.g. req.params.id
    req.params = {};
    keys.forEach((key, i) => {
      req.params[key] = match[i + 1];
    });

    // Attach query string as req.query e.g. ?name=fluffy → { name: 'fluffy' }
    req.query = Object.fromEntries(url.searchParams);

    // Attach helpers directly onto req so route files can use them cleanly
    req.parseBody  = () => parseBody(req);
    req.requireRole = (role) => requireRole(role, req, res);
    req.userId     = req.headers['x-user-id'] || null;
    req.userRole   = req.headers['x-user-role'] || null;

    try {
      await route.handler(req, res, send);
    } catch (err) {
      console.error(`Error on ${req.method} ${pathname}:`, err.message);
      if (!res.writableEnded) {
        send(res, 500, { error: 'Internal server error' });
      }
    }
    return;
  }

  // No route matched
  send(res, 404, { error: `Cannot ${req.method} ${pathname}` });
}

module.exports = { router, register };