// server/routes/users.js
const { register } = require('../router');
const db = require('../db');
const {
  notFound,
  requireUser,
  requireRole,
  getEmployeeId,
} = require('../lib/helpers');


// Helper: determine the role of a user by checking role tables
async function getUserRole(userID) {
  const [[owner]] = await db.query('SELECT ownerID FROM PET_OWNER WHERE userID = ?', [userID]);
  if (owner) return 'owner';
  const [[minder]] = await db.query('SELECT sitterID FROM PET_MINDER WHERE userID = ?', [userID]);
  if (minder) return 'minder';
  const [[support]] = await db.query('SELECT employeeID FROM CUSTOMER_SUPPORT WHERE userID = ?', [userID]);
  if (support) return 'support';
  return null;
}


// 41) GET /api/users (Support) — list all users with optional filters
register('GET', '/api/users', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'support')) return;

  const employeeID = await getEmployeeId(db, req.userId);
  if (!employeeID) return send(res, 403, { error: 'Support profile not found' });

  const { role, status, search } = req.query;

  // Base query: all users with their profiles
  let sql = `
    SELECT
      U.userID, U.username, U.status, U.createdAt, U.phoneNumber,
      P.profileID, P.firstName, P.lastName, P.email, P.city, P.postcode,
      CASE
        WHEN O.ownerID  IS NOT NULL THEN 'owner'
        WHEN M.sitterID IS NOT NULL THEN 'minder'
        WHEN S.employeeID IS NOT NULL THEN 'support'
        ELSE 'unknown'
      END AS role
    FROM USER U
    JOIN USER_PROFILE P ON P.userID = U.userID
    LEFT JOIN PET_OWNER       O ON O.userID = U.userID
    LEFT JOIN PET_MINDER       M ON M.userID = U.userID
    LEFT JOIN CUSTOMER_SUPPORT S ON S.userID = U.userID
  `;
  const params = [];
  const conditions = [];

  if (status) {
    conditions.push('U.status = ?');
    params.push(status);
  }
  if (search) {
    conditions.push('(P.firstName LIKE ? OR P.lastName LIKE ? OR P.email LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  if (role === 'owner') {
    conditions.push('O.ownerID IS NOT NULL');
  } else if (role === 'minder') {
    conditions.push('M.sitterID IS NOT NULL');
  } else if (role === 'support') {
    conditions.push('S.employeeID IS NOT NULL');
  }

  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY U.createdAt DESC';

  const [rows] = await db.query(sql, params);
  send(res, 200, rows);
});

// 42) GET /api/users/:id (Support) — full profile of any user
register('GET', '/api/users/:id', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'support')) return;

  const employeeID = await getEmployeeId(db, req.userId);
  if (!employeeID) return send(res, 403, { error: 'Support profile not found' });

  const userID = req.params.id;

  const [[user]] = await db.query(
    `SELECT
       U.userID, U.username, U.status, U.createdAt, U.phoneNumber,
       P.profileID, P.firstName, P.lastName, P.email, P.city, P.postcode, P.address
     FROM USER U
     JOIN USER_PROFILE P ON P.userID = U.userID
     WHERE U.userID = ?`,
    [userID]
  );
  if (!user) return notFound(send, res, 'User not found');

  const userRole = await getUserRole(userID);
  const result = { ...user, role: userRole };

  if (userRole === 'owner') {
    const [[owner]] = await db.query('SELECT ownerID FROM PET_OWNER WHERE userID = ?', [userID]);
    const [pets] = await db.query(
      'SELECT petID, name, species, breed, age FROM PET_PROFILE WHERE ownerID = ?',
      [owner.ownerID]
    );
    const [bookings] = await db.query(
      'SELECT bookingID, status, startTime, endTime, totalCost FROM BOOKING WHERE ownerID = ? ORDER BY createdAt DESC LIMIT 10',
      [owner.ownerID]
    );
    result.ownerID = owner.ownerID;
    result.pets = pets;
    result.recentBookings = bookings;
  } else if (userRole === 'minder') {
    const [[minder]] = await db.query(
      'SELECT sitterID, bio, experienceYears, ratingAvg, medicationQualified, serviceAreaPostcode FROM PET_MINDER WHERE userID = ?',
      [userID]
    );
    const [services] = await db.query(
      `SELECT MS.minderServiceID, ST.name, MS.customPrice, MS.isActive
       FROM MINDER_SERVICE MS
       JOIN SERVICE_TYPE ST ON ST.serviceTypeID = MS.serviceTypeID
       WHERE MS.sitterID = ?`,
      [minder.sitterID]
    );
    const [bookings] = await db.query(
      'SELECT bookingID, status, startTime, endTime, totalCost FROM BOOKING WHERE sitterID = ? ORDER BY createdAt DESC LIMIT 10',
      [minder.sitterID]
    );
    const [[verification]] = await db.query(
      'SELECT status, outcome, submittedAt, resolvedAt FROM IDENTITY_VERIFICATION WHERE userID = ? ORDER BY submittedAt DESC LIMIT 1',
      [userID]
    );
    result.sitterID = minder.sitterID;
    result.bio = minder.bio;
    result.experienceYears = minder.experienceYears;
    result.ratingAvg = minder.ratingAvg;
    result.medicationQualified = minder.medicationQualified;
    result.serviceAreaPostcode = minder.serviceAreaPostcode;
    result.services = services;
    result.recentBookings = bookings;
    result.verification = verification || null;
  }

  send(res, 200, result);
});

// 43) PATCH /api/users/:id/suspend (Support) — suspend or reactivate a user account
register('PATCH', '/api/users/:id/suspend', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'support')) return;

  const employeeID = await getEmployeeId(db, req.userId);
  if (!employeeID) return send(res, 403, { error: 'Support profile not found' });

  const userID = req.params.id;
  const [[user]] = await db.query('SELECT userID, status FROM USER WHERE userID = ?', [userID]);
  if (!user) return notFound(send, res, 'User not found');

  const body = await req.parseBody();
  // TEST DATA - will be replaced by actual request body in production
  const newStatus = body?.status || 'Suspended';

  const validStatuses = ['Active', 'Suspended', 'Inactive'];
  if (!validStatuses.includes(newStatus)) {
    return send(res, 400, { error: `status must be one of: ${validStatuses.join(', ')}` });
  }

  await db.query('UPDATE USER SET status = ? WHERE userID = ?', [newStatus, userID]);

  const [[updated]] = await db.query(
    'SELECT U.userID, U.status, P.firstName, P.lastName, P.email FROM USER U JOIN USER_PROFILE P ON P.userID = U.userID WHERE U.userID = ?',
    [userID]
  );
  send(res, 200, updated);
});
