// server/routes/users.js
const { register } = require('../router');
const db = require('../db');
const {
  notFound,
  requireUser,
  requireRole,
  getEmployeeId,
  uuid,
} = require('../lib/helpers');

async function ensureDeletionRequestTable() {
  await db.query(
    `
    CREATE TABLE IF NOT EXISTS ACCOUNT_DELETION_REQUEST (
      requestID   VARCHAR(36) NOT NULL,
      userID      VARCHAR(36) NOT NULL,
      status      ENUM('requested','approved','rejected') NOT NULL DEFAULT 'requested',
      reason      TEXT,
      createdAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      resolvedAt  DATETIME,
      CONSTRAINT PK_ACCOUNT_DELETION_REQUEST PRIMARY KEY (requestID),
      CONSTRAINT UQ_ACCOUNT_DELETION_REQUEST_USER UNIQUE (userID),
      CONSTRAINT FK_ADR_USER FOREIGN KEY (userID) REFERENCES USER (userID) ON DELETE CASCADE
    )
    `
  );
}

async function insertNotification(recipientUserID, title, body) {
  await db.query(
    `INSERT INTO NOTIFICATION (notificationID, recipientID, channel, title, body)
     VALUES (?, ?, 'in-app', ?, ?)`,
    [uuid(), recipientUserID, title, body]
  );
}

async function deleteBookingsForUser({ ownerID = null, sitterID = null }) {
  const [bookings] = await db.query(
    `SELECT bookingID, slotID FROM BOOKING WHERE ${ownerID ? 'ownerID = ?' : 'sitterID = ?'}`,
    [ownerID || sitterID]
  );

  for (const b of bookings) {
    // Payments & refunds
    const [payments] = await db.query('SELECT paymentID FROM PAYMENT WHERE bookingID = ?', [b.bookingID]);
    for (const p of payments) {
      await db.query('DELETE FROM REFUND WHERE paymentID = ?', [p.paymentID]);
    }
    await db.query('DELETE FROM PAYMENT WHERE bookingID = ?', [b.bookingID]);

    // Reviews, disputes, reports, incidents, visit reports
    await db.query('DELETE FROM REVIEW_FLAG WHERE reviewID IN (SELECT reviewID FROM REVIEW WHERE bookingID = ?)', [b.bookingID]);
    await db.query('DELETE FROM REVIEW WHERE bookingID = ?', [b.bookingID]);
    await db.query('DELETE FROM DISPUTE WHERE bookingID = ?', [b.bookingID]);
    await db.query('DELETE FROM VISIT_REPORT WHERE bookingID = ?', [b.bookingID]);
    await db.query('DELETE FROM INCIDENT_REPORT WHERE bookingID = ?', [b.bookingID]);

    // Meet & greet
    const [meets] = await db.query('SELECT meetID FROM MEET_AND_GREET WHERE bookingID = ?', [b.bookingID]);
    for (const m of meets) {
      await db.query('DELETE FROM MEET_AND_GREET_NOTE WHERE meetID = ?', [m.meetID]);
    }
    await db.query('DELETE FROM MEET_AND_GREET WHERE bookingID = ?', [b.bookingID]);

    // Conversations & messages linked to booking
    const [convos] = await db.query('SELECT conversationID FROM CONVERSATION WHERE bookingID = ?', [b.bookingID]);
    for (const c of convos) {
      await db.query('DELETE FROM MESSAGE WHERE conversationID = ?', [c.conversationID]);
    }
    await db.query('DELETE FROM CONVERSATION WHERE bookingID = ?', [b.bookingID]);

    // Location
    const [[loc]] = await db.query('SELECT locationID FROM BOOKING WHERE bookingID = ?', [b.bookingID]);

    // Booking itself
    await db.query('DELETE FROM BOOKING WHERE bookingID = ?', [b.bookingID]);

    if (loc?.locationID) {
      await db.query('DELETE FROM LOCATION WHERE locationID = ?', [loc.locationID]);
    }

    // Free slot if any
    if (b.slotID) {
      await db.query('UPDATE SLOT SET isBooked = FALSE WHERE slotID = ?', [b.slotID]);
    }
  }
}

async function deleteUserCompletely(userID) {
  // Remove direct messages (not tied to booking conversations)
  await db.query('DELETE FROM MESSAGE WHERE senderUserID = ? OR receiverUserID = ?', [userID, userID]);

  // Remove notifications & preferences
  await db.query('DELETE FROM NOTIFICATION_PREFERENCE WHERE userID = ?', [userID]);
  await db.query('DELETE FROM NOTIFICATION WHERE recipientID = ?', [userID]);

  // Remove disputes created by user
  await db.query('DELETE FROM DISPUTE WHERE userID = ?', [userID]);

  // Determine role-linked IDs to delete bookings
  const [[owner]] = await db.query('SELECT ownerID FROM PET_OWNER WHERE userID = ?', [userID]);
  const [[minder]] = await db.query('SELECT sitterID FROM PET_MINDER WHERE userID = ?', [userID]);

  if (owner?.ownerID) {
    await deleteBookingsForUser({ ownerID: owner.ownerID });
  }
  if (minder?.sitterID) {
    await deleteBookingsForUser({ sitterID: minder.sitterID });
  }

  // Finally delete user row (cascades to profile + role tables)
  await db.query('DELETE FROM USER WHERE userID = ?', [userID]);
}


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


// GET /api/users (Support) — list all users with optional filters
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

// GET /api/users/:id (Support) — full profile of any user
register('GET', '/api/users/:id', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, ['support', 'owner', 'minder'])) return;

  const userID = req.params.id;
  const isSupport = String(req.userRole || '').toLowerCase() === 'support';
  const isSelf = req.userId === userID;

  if (!isSupport && !isSelf) {
    return send(res, 403, { error: 'Forbidden: can only access your own profile' });
  }

  if (isSupport) {
    const employeeID = await getEmployeeId(db, req.userId);
    if (!employeeID) return send(res, 403, { error: 'Support profile not found' });
  }

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

// PATCH /api/users/:id/suspend (Support) — suspend or reactivate a user account
register('PATCH', '/api/users/:id/suspend', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'support')) return;

  const employeeID = await getEmployeeId(db, req.userId);
  if (!employeeID) return send(res, 403, { error: 'Support profile not found' });

  const userID = req.params.id;
  const [[user]] = await db.query('SELECT userID, status FROM USER WHERE userID = ?', [userID]);
  if (!user) return notFound(send, res, 'User not found');

  const body = await req.parseBody();
  // Example: { status: 'Suspended' } — valid values: 'Active', 'Suspended', 'Inactive'
  const newStatus = body?.status;

  const validStatuses = ['Active', 'Suspended', 'Inactive'];
  if (!validStatuses.includes(newStatus)) {
    return send(res, 400, { error: `status must be one of: ${validStatuses.join(', ')}` });
  }

  await db.query('UPDATE USER SET status = ? WHERE userID = ?', [newStatus, userID]);

  // If Support re-activates an account, clear any pending deletion request so the user regains access.
  if (newStatus === 'Active') {
    try {
      await ensureDeletionRequestTable();
      await db.query(
        `UPDATE ACCOUNT_DELETION_REQUEST
         SET status = 'rejected', resolvedAt = CURRENT_TIMESTAMP
         WHERE userID = ? AND status = 'requested'`,
        [userID]
      );
    } catch (_) {
      // ignore if table doesn't exist / prototype mode
    }
  }

  const [[updated]] = await db.query(
    'SELECT U.userID, U.status, P.firstName, P.lastName, P.email FROM USER U JOIN USER_PROFILE P ON P.userID = U.userID WHERE U.userID = ?',
    [userID]
  );
  send(res, 200, updated);
});

// POST /api/users/me/request-deletion (Owner/Minder) — request account deletion, suspends access immediately.
register('POST', '/api/users/me/request-deletion', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, ['owner', 'minder'])) return;

  await ensureDeletionRequestTable();

  const userID = req.userId;
  const body = await req.parseBody();
  const reason = body?.reason ? String(body.reason).slice(0, 500) : null;

  const [[user]] = await db.query('SELECT userID, status FROM USER WHERE userID = ?', [userID]);
  if (!user) return notFound(send, res, 'User not found');

  await db.query(
    `INSERT INTO ACCOUNT_DELETION_REQUEST (requestID, userID, status, reason)
     VALUES (?, ?, 'requested', ?)
     ON DUPLICATE KEY UPDATE status = 'requested', reason = VALUES(reason), resolvedAt = NULL`,
    [uuid(), userID, reason]
  );

  await db.query('UPDATE USER SET status = ? WHERE userID = ?', ['Suspended', userID]);

  try {
    await insertNotification(
      userID,
      'Account deletion requested',
      'We received your request. Your account is temporarily suspended while Customer Support reviews it.'
    );
  } catch (e) {}

  send(res, 200, { ok: true, status: 'Suspended', deletionRequestStatus: 'requested' });
});

// GET /api/deletion-requests (Support)
register('GET', '/api/deletion-requests', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'support')) return;

  const employeeID = await getEmployeeId(db, req.userId);
  if (!employeeID) return send(res, 403, { error: 'Support profile not found' });

  await ensureDeletionRequestTable();

  const [rows] = await db.query(
    `
    SELECT
      ADR.requestID, ADR.userID, ADR.status AS requestStatus, ADR.reason, ADR.createdAt,
      U.status AS userStatus,
      P.firstName, P.lastName, P.email
    FROM ACCOUNT_DELETION_REQUEST ADR
    JOIN USER U ON U.userID = ADR.userID
    JOIN USER_PROFILE P ON P.userID = ADR.userID
    WHERE ADR.status = 'requested'
    ORDER BY ADR.createdAt DESC
    `
  );

  send(res, 200, rows);
});

// PATCH /api/deletion-requests/:id/reject (Support) — reject request, restore access.
register('PATCH', '/api/deletion-requests/:id/reject', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'support')) return;

  const employeeID = await getEmployeeId(db, req.userId);
  if (!employeeID) return send(res, 403, { error: 'Support profile not found' });

  await ensureDeletionRequestTable();

  const requestID = req.params.id;
  const [[reqRow]] = await db.query(
    'SELECT requestID, userID, status FROM ACCOUNT_DELETION_REQUEST WHERE requestID = ?',
    [requestID]
  );
  if (!reqRow) return notFound(send, res, 'Deletion request not found');

  await db.query(
    `UPDATE ACCOUNT_DELETION_REQUEST
     SET status = 'rejected', resolvedAt = CURRENT_TIMESTAMP
     WHERE requestID = ?`,
    [requestID]
  );
  await db.query('UPDATE USER SET status = ? WHERE userID = ?', ['Active', reqRow.userID]);

  try {
    await insertNotification(
      reqRow.userID,
      'Account deletion rejected',
      'Customer Support rejected your deletion request. Your account access has been restored.'
    );
  } catch (e) {}

  send(res, 200, { ok: true });
});

// PATCH /api/deletion-requests/:id/approve (Support) — permanently delete user + associated data.
register('PATCH', '/api/deletion-requests/:id/approve', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'support')) return;

  const employeeID = await getEmployeeId(db, req.userId);
  if (!employeeID) return send(res, 403, { error: 'Support profile not found' });

  await ensureDeletionRequestTable();

  const requestID = req.params.id;
  const [[reqRow]] = await db.query(
    'SELECT requestID, userID, status FROM ACCOUNT_DELETION_REQUEST WHERE requestID = ?',
    [requestID]
  );
  if (!reqRow) return notFound(send, res, 'Deletion request not found');

  await db.query('START TRANSACTION');
  try {
    await db.query(
      `UPDATE ACCOUNT_DELETION_REQUEST
       SET status = 'approved', resolvedAt = CURRENT_TIMESTAMP
       WHERE requestID = ?`,
      [requestID]
    );

    await deleteUserCompletely(reqRow.userID);

    await db.query('COMMIT');
    send(res, 200, { ok: true });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Approve deletion failed:', err);
    send(res, 500, { error: 'Failed to delete account' });
  }
});

// DELETE /api/users/:id (Support) — permanently delete user + associated data immediately.
register('DELETE', '/api/users/:id', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'support')) return;

  const employeeID = await getEmployeeId(db, req.userId);
  if (!employeeID) return send(res, 403, { error: 'Support profile not found' });

  const userID = req.params.id;
  if (userID === req.userId) return send(res, 400, { error: 'Cannot delete your own support account' });

  const [[userRow]] = await db.query('SELECT userID FROM USER WHERE userID = ?', [userID]);
  if (!userRow) return notFound(send, res, 'User not found');

  await ensureDeletionRequestTable();

  await db.query('START TRANSACTION');
  try {
    await db.query('DELETE FROM ACCOUNT_DELETION_REQUEST WHERE userID = ?', [userID]);
    await deleteUserCompletely(userID);
    await db.query('COMMIT');
    send(res, 200, { ok: true });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('DELETE /api/users/:id failed:', err);
    send(res, 500, { error: 'Failed to delete account' });
  }
});
