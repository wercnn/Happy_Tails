// server/routes/auth.js
// ⚠️ NOTE: Keep it simple with hashing as we don't it to be random for a prototype. In production, use bcrypt or similar.
const { register } = require('../router');
const db = require('../db');
const {
  uuid,
  badRequest,
  requireRole,
  normalizeRole,
  hashPassword,
  verifyPassword,
} = require('../lib/helpers');

// Infer the user's role by checking which profile table they have an entry in.
async function inferRoleByUserId(userId) {
  const [ownerRows] = await db.query('SELECT ownerID FROM PET_OWNER WHERE userID = ?', [userId]);
  if (ownerRows.length) return 'owner';
  const [minderRows] = await db.query('SELECT sitterID FROM PET_MINDER WHERE userID = ?', [userId]);
  if (minderRows.length) return 'minder';
  const [supportRows] = await db.query('SELECT employeeID FROM CUSTOMER_SUPPORT WHERE userID = ?', [userId]);
  if (supportRows.length) return 'support';
  return null;
}


// ─────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────
register('POST', '/api/auth/register', async (req, res, send) => {
  const body = await req.parseBody();
  // Example: { email: 'newuser@example.com', password: 'test1234', firstName: 'New', lastName: 'User', 
  // phoneNumber: '07700900099', username: null, role: 'owner', address: '1 Test Street', city: 'London', postcode: 'E1 6RF' }
  const { email, password, firstName, lastName, phoneNumber, username, role, address, city, postcode } = body;

  if (!email || !password || !firstName || !lastName) {
    return badRequest(send, res, 'email, password, firstName, lastName are required');
  }

  const userID = uuid();
  const profileID = uuid();
  const passwordHash = await hashPassword(String(password));
  const normalizedRole = normalizeRole(role) || 'owner';
  const initialStatus = normalizedRole === 'support' ? 'Active' : 'Inactive';

  // Ensure unique email
  const [existing] = await db.query('SELECT profileID FROM USER_PROFILE WHERE email = ?', [email]);
  if (existing.length) {
    return send(res, 409, { error: 'Email already registered' });
  }

  await db.query(
    'INSERT INTO USER (userID, username, passwordHash, phoneNumber, status) VALUES (?, ?, ?, ?, ?)',
    [userID, username, passwordHash, phoneNumber, initialStatus]
  );
  await db.query(
    'INSERT INTO USER_PROFILE (profileID, userID, firstName, lastName, address, city, postcode, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [profileID, userID, firstName, lastName, address, city, postcode, email]
  );

  if (normalizedRole === 'minder') {
    await db.query('INSERT INTO PET_MINDER (sitterID, userID) VALUES (?, ?)', [uuid(), userID]);
  } else if (normalizedRole === 'support') {
    await db.query('INSERT INTO CUSTOMER_SUPPORT (employeeID, userID, role) VALUES (?, ?, ?)', [
      uuid(),
      userID,
      'Support',
    ]);
  } else {
    await db.query('INSERT INTO PET_OWNER (ownerID, userID) VALUES (?, ?)', [uuid(), userID]);
  }

  send(res, 201, {
    userID,
    profileID,
    role: await inferRoleByUserId(userID),
    email,
    firstName,
    lastName,
    status: initialStatus,
    phoneNumber,
  });
});


// ─────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────
register('POST', '/api/auth/login', async (req, res, send) => {
  const body = await req.parseBody();
  // Example: { identifier: 'sarah@example.com', password: 'test1234' }
  // Example: { identifier: 'sarah_o', password: 'test1234' }
  const { identifier, password } = body;

  if (!identifier || !password) {
    return badRequest(send, res, 'identifier and password are required');
  }

  const [rows] = await db.query(
    `SELECT U.userID, U.username, U.passwordHash, U.phoneNumber, U.createdAt,
            U.status,
            P.profileID, P.firstName, P.lastName, P.email
     FROM USER U
     JOIN USER_PROFILE P ON P.userID = U.userID
     WHERE P.email = ? OR U.username = ?`,
    [identifier, identifier]
  );

  if (!rows.length) {
    return send(res, 401, { error: 'Invalid credentials' });
  }

  const user = rows[0];
  const ok = await verifyPassword(String(password), user.passwordHash);

  if (!ok) {
    return send(res, 401, { error: 'Invalid credentials' });
  }

  const role = await inferRoleByUserId(user.userID);

  // Optional: check if user has a pending deletion request.
  let deletionRequested = false;
  try {
    const [rows2] = await db.query(
      `SELECT 1 AS ok
       FROM ACCOUNT_DELETION_REQUEST
       WHERE userID = ? AND status = 'requested'
       LIMIT 1`,
      [user.userID]
    );
    deletionRequested = rows2.length > 0;
  } catch (_) {
    deletionRequested = false;
  }

  send(res, 200, {
    userID: user.userID,
    username: user.username,
    phoneNumber: user.phoneNumber,
    createdAt: user.createdAt,
    status: user.status,
    deletionRequested,
    profile: {
      profileID: user.profileID,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
    role,
  });
});