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

async function inferRoleByUserId(userId) {
  const [ownerRows] = await db.query('SELECT ownerID FROM PET_OWNER WHERE userID = ?', [userId]);
  if (ownerRows.length) return 'owner';
  const [minderRows] = await db.query('SELECT sitterID FROM PET_MINDER WHERE userID = ?', [userId]);
  if (minderRows.length) return 'minder';
  const [supportRows] = await db.query('SELECT employeeID FROM CUSTOMER_SUPPORT WHERE userID = ?', [userId]);
  if (supportRows.length) return 'support';
  return null;
}

// Create a new user + auto-create profile row
register('POST', '/api/auth/register', async (req, res, send) => {
  const body = await req.parseBody();
  const {
    email,
    password,
    firstName,
    lastName,
    phoneNumber = null,
    username = null,
    role = 'owner',
    address = null,
    city = null,
    postcode = null,
  } = body;

  if (!email || !password || !firstName || !lastName) {
    return badRequest(send, res, 'email, password, firstName, lastName are required');
  }

  const userID = uuid();
  const profileID = uuid();
  const passwordHash = await hashPassword(String(password));
  const normalizedRole = normalizeRole(role) || 'owner';

  // Ensure unique email
  const [existing] = await db.query('SELECT profileID FROM USER_PROFILE WHERE email = ?', [email]);
  if (existing.length) {
    return send(res, 409, { error: 'Email already registered' });
  }

  await db.query(
    'INSERT INTO USER (userID, username, passwordHash, phoneNumber) VALUES (?, ?, ?, ?)',
    [userID, username, passwordHash, phoneNumber]
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
  });
});

// Return user record if credentials match
register('POST', '/api/auth/login', async (req, res, send) => {
  const body = await req.parseBody();
  const { email, password } = body;
  if (!email || !password) return badRequest(send, res, 'email and password are required');

  const [rows] = await db.query(
    `SELECT U.userID, U.username, U.passwordHash, U.phoneNumber, U.createdAt,
            P.profileID, P.firstName, P.lastName, P.email
     FROM USER U
     JOIN USER_PROFILE P ON P.userID = U.userID
     WHERE P.email = ?`,
    [email]
  );

  if (!rows.length) return send(res, 401, { error: 'Invalid credentials' });
  const user = rows[0];
  const ok = await verifyPassword(String(password), user.passwordHash);
  if (!ok) return send(res, 401, { error: 'Invalid credentials' });

  const role = await inferRoleByUserId(user.userID);

  send(res, 200, {
    userID: user.userID,
    username: user.username,
    phoneNumber: user.phoneNumber,
    createdAt: user.createdAt,
    profile: {
      profileID: user.profileID,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
    role,
  });
});