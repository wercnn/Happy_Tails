// server/routes/auth.js
const { randomUUID } = require('crypto');
const { register } = require('../router');
const db = require('../db');


// ─────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────
register('POST', '/api/auth/register', async (req, res, send) => {
  const body = await req.parseBody();
  const { email, password, firstName, lastName } = body;

  if (!email || !password || !firstName || !lastName) {
    return send(res, 400, { error: 'Missing required fields' });
  }

  // check if email already exists
  const [existing] = await db.query(
    'SELECT * FROM USER_PROFILE WHERE email = ?',
    [email]
  );

  if (existing.length > 0) {
    return send(res, 409, { error: 'Email already registered' });
  }

  const userID = randomUUID();
  const profileID = randomUUID();

  // ⚠️ NOTE: no hashing yet (keep simple for now)
  await db.query(
    'INSERT INTO USER (userID, passwordHash) VALUES (?, ?)',
    [userID, password]
  );

  await db.query(
    `INSERT INTO USER_PROFILE (profileID, userID, firstName, lastName, email)
     VALUES (?, ?, ?, ?, ?)`,
    [profileID, userID, firstName, lastName, email]
  );

  send(res, 201, {
    message: 'User registered',
    userID
  });
});


// ─────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────
register('POST', '/api/auth/login', async (req, res, send) => {
  const body = await req.parseBody();
  const { email, password } = body;

  if (!email || !password) {
    return send(res, 400, { error: 'Email and password required' });
  }

  const [rows] = await db.query(
    `SELECT u.userID, u.passwordHash, p.firstName, p.lastName
     FROM USER u
     JOIN USER_PROFILE p ON u.userID = p.userID
     WHERE p.email = ?`,
    [email]
  );

  if (rows.length === 0) {
    return send(res, 401, { error: 'Invalid credentials' });
  }

  const user = rows[0];

  // ⚠️ plain comparison (no hashing yet)
  if (user.passwordHash !== password) {
    return send(res, 401, { error: 'Invalid credentials' });
  }

  send(res, 200, {
    message: 'Login successful',
    userID: user.userID,
    name: `${user.firstName} ${user.lastName}`
  });
});