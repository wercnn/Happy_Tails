// server/routes/admin.js
// Support-only endpoints that extend or complement existing route files.
// IMPORTANT: This file must be loaded in server.js BEFORE minders.js so that
// GET /api/minders/pending is registered before the GET /api/minders/:id wildcard.
//
// NOTE: The PATCH /api/reports/incident/:id/escalate and :id/resolve endpoints
// assume INCIDENT_REPORT has a `status VARCHAR(50) DEFAULT 'Open'` column.
// If it does not yet exist, run:
//   ALTER TABLE INCIDENT_REPORT ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'Open';

const { register } = require('../router');
const db = require('../db');
const {
  uuid,
  notFound,
  badRequest,
  requireUser,
  requireRole,
  getEmployeeId,
} = require('../lib/helpers');



// ─── Overview Stats ──────────────────────────────────────────────────────────

// GET /api/stats (Support) — platform-wide aggregate counts for the Overview page
register('GET', '/api/stats', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'support')) return;

  const employeeID = await getEmployeeId(db, req.userId);
  if (!employeeID) return send(res, 403, { error: 'Support profile not found' });

  const [[stats]] = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM DISPUTE        WHERE status IN ('Open', 'Escalated'))                                          AS openDisputes,
      (SELECT COUNT(*) FROM INCIDENT_REPORT)                                                                                AS openIncidents,
      (SELECT COUNT(*) FROM IDENTITY_VERIFICATION WHERE status IN ('Pending', 'UnderReview'))                              AS pendingVerifications,
      (SELECT COUNT(*) FROM PAYMENT P JOIN REFUND R ON R.paymentID = P.paymentID WHERE P.escrowStatus = 'Holding')         AS refundRequests,
      (SELECT COUNT(*) FROM REVIEW_FLAG   WHERE status = 'Open')                                                           AS flaggedReviews,
      (SELECT COUNT(*) FROM BOOKING        WHERE status = 'active')                                                        AS activeBookings
  `);

  send(res, 200, stats);
});

// ─── Minder Verification ─────────────────────────────────────────────────────

// GET /api/minders/pending (Support) — minders with pending identity verification
// NOTE: Must be registered BEFORE GET /api/minders/:id (ensured by loading admin.js first in server.js)
register('GET', '/api/minders/pending', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'support')) return;

  const employeeID = await getEmployeeId(db, req.userId);
  if (!employeeID) return send(res, 403, { error: 'Support profile not found' });

  const [rows] = await db.query(`
    SELECT
      M.sitterID, M.userID, M.bio, M.experienceYears,
      P.firstName, P.lastName, P.email, P.city, P.postcode,
      IV.verificationID, IV.documentURL, IV.status AS verificationStatus,
      IV.outcome, IV.submittedAt
    FROM PET_MINDER M
    JOIN USER_PROFILE P ON P.userID = M.userID
    JOIN IDENTITY_VERIFICATION IV ON IV.userID = M.userID
    WHERE IV.status IN ('Pending', 'UnderReview')
    ORDER BY IV.submittedAt ASC
  `);

  send(res, 200, rows);
});

// PATCH /api/minders/:id/verify (Support) — approve minder identity verification
register('PATCH', '/api/minders/:id/verify', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'support')) return;

  const employeeID = await getEmployeeId(db, req.userId);
  if (!employeeID) return send(res, 403, { error: 'Support profile not found' });

  const sitterID = req.params.id;
  const [[minder]] = await db.query(
    'SELECT sitterID, userID FROM PET_MINDER WHERE sitterID = ?',
    [sitterID]
  );
  if (!minder) return notFound(send, res, 'Minder not found');

  const [[iv]] = await db.query(
    `SELECT verificationID FROM IDENTITY_VERIFICATION
     WHERE userID = ? AND status IN ('Pending', 'UnderReview')
     ORDER BY submittedAt DESC LIMIT 1`,
    [minder.userID]
  );
  if (!iv) return send(res, 409, { error: 'No pending verification found for this minder' });

  await db.query(
    `UPDATE IDENTITY_VERIFICATION
     SET status = 'Verified', outcome = 'Approved', resolvedAt = NOW()
     WHERE verificationID = ?`,
    [iv.verificationID]
  );

  const [[updated]] = await db.query(
    'SELECT * FROM IDENTITY_VERIFICATION WHERE verificationID = ?',
    [iv.verificationID]
  );
  send(res, 200, updated);
});

// PATCH /api/minders/:id/reject (Support) — reject minder identity verification
register('PATCH', '/api/minders/:id/reject', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'support')) return;

  const employeeID = await getEmployeeId(db, req.userId);
  if (!employeeID) return send(res, 403, { error: 'Support profile not found' });

  const sitterID = req.params.id;
  const [[minder]] = await db.query(
    'SELECT sitterID, userID FROM PET_MINDER WHERE sitterID = ?',
    [sitterID]
  );
  if (!minder) return notFound(send, res, 'Minder not found');

  const [[iv]] = await db.query(
    `SELECT verificationID FROM IDENTITY_VERIFICATION
     WHERE userID = ? AND status IN ('Pending', 'UnderReview')
     ORDER BY submittedAt DESC LIMIT 1`,
    [minder.userID]
  );
  if (!iv) return send(res, 409, { error: 'No pending verification found for this minder' });

  const body = await req.parseBody();
  // Example: { reason: 'Documents could not be verified. Please resubmit with valid ID.' }
  const reason = body?.reason;

  await db.query(
    `UPDATE IDENTITY_VERIFICATION
     SET status = 'Rejected', outcome = 'Rejected', resolvedAt = NOW()
     WHERE verificationID = ?`,
    [iv.verificationID]
  );

  const [[updated]] = await db.query(
    'SELECT * FROM IDENTITY_VERIFICATION WHERE verificationID = ?',
    [iv.verificationID]
  );
  send(res, 200, { ...updated, rejectionReason: reason });
});

// ─── Payment Denial ───────────────────────────────────────────────────────────

// PATCH /api/payments/:id/deny (Support) — deny a refund request, keep payment in escrow
register('PATCH', '/api/payments/:id/deny', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'support')) return;

  const employeeID = await getEmployeeId(db, req.userId);
  if (!employeeID) return send(res, 403, { error: 'Support profile not found' });

  const paymentID = req.params.id;
  const [[payment]] = await db.query('SELECT * FROM PAYMENT WHERE paymentID = ?', [paymentID]);
  if (!payment) return notFound(send, res, 'Payment not found');

  if (payment.escrowStatus === 'Refunded') {
    return send(res, 409, { error: 'Payment has already been refunded' });
  }
  if (payment.escrowStatus === 'Released') {
    return send(res, 409, { error: 'Payment has already been released' });
  }

  const body = await req.parseBody();
  // Example: { reason: 'Refund request denied after support review. Payment will be released to minder.' }
  const reason = body?.reason;

  // Denial keeps payment in Holding but records the decision; release must still be triggered separately
  await db.query(
    `UPDATE PAYMENT SET paymentStatus = 'Denied' WHERE paymentID = ?`,
    [paymentID]
  );

  const [[updated]] = await db.query('SELECT * FROM PAYMENT WHERE paymentID = ?', [paymentID]);
  send(res, 200, { payment: updated, denialReason: reason });
});

// ─── Incident Status Updates ──────────────────────────────────────────────────

// PATCH /api/reports/incident/:id/escalate (Support) — escalate an incident
// Requires: INCIDENT_REPORT.status VARCHAR(50) DEFAULT 'Open'
register('PATCH', '/api/reports/incident/:id/escalate', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'support')) return;

  const employeeID = await getEmployeeId(db, req.userId);
  if (!employeeID) return send(res, 403, { error: 'Support profile not found' });

  const incidentID = req.params.id;
  const [[incident]] = await db.query(
    'SELECT * FROM INCIDENT_REPORT WHERE incidentID = ?',
    [incidentID]
  );
  if (!incident) return notFound(send, res, 'Incident not found');
  if (incident.status === 'Resolved') {
    return send(res, 409, { error: 'Cannot escalate a resolved incident' });
  }

  await db.query(
    `UPDATE INCIDENT_REPORT SET status = 'Escalated', severityLevel = 'High', employeeID = ?
     WHERE incidentID = ?`,
    [employeeID, incidentID]
  );

  const [[updated]] = await db.query(
    'SELECT * FROM INCIDENT_REPORT WHERE incidentID = ?',
    [incidentID]
  );
  send(res, 200, updated);
});

// PATCH /api/reports/incident/:id/resolve (Support) — mark an incident as resolved
// Requires: INCIDENT_REPORT.status VARCHAR(50) DEFAULT 'Open'
register('PATCH', '/api/reports/incident/:id/resolve', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'support')) return;

  const employeeID = await getEmployeeId(db, req.userId);
  if (!employeeID) return send(res, 403, { error: 'Support profile not found' });

  const incidentID = req.params.id;
  const [[incident]] = await db.query(
    'SELECT * FROM INCIDENT_REPORT WHERE incidentID = ?',
    [incidentID]
  );
  if (!incident) return notFound(send, res, 'Incident not found');
  if (incident.status === 'Resolved') {
    return send(res, 409, { error: 'Incident is already resolved' });
  }

  await db.query(
    `UPDATE INCIDENT_REPORT SET status = 'Resolved', employeeID = COALESCE(employeeID, ?)
     WHERE incidentID = ?`,
    [employeeID, incidentID]
  );

  const [[updated]] = await db.query(
    'SELECT * FROM INCIDENT_REPORT WHERE incidentID = ?',
    [incidentID]
  );
  send(res, 200, updated);
});

// ─── Review Moderation ────────────────────────────────────────────────────────

// ─── Overview Live Data ───────────────────────────────────────────────────────

// GET /api/admin/alerts (Support) — recent alerts from disputes, incidents, and pending verifications
register('GET', '/api/admin/alerts', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'support')) return;

  const employeeID = await getEmployeeId(db, req.userId);
  if (!employeeID) return send(res, 403, { error: 'Support profile not found' });

  const [rows] = await db.query(`
    (SELECT 'dispute' AS type, disputeID AS id,
      CASE status WHEN 'Escalated' THEN 'Dispute escalated' ELSE 'Dispute opened' END AS text,
      createdAt AS time
     FROM DISPUTE ORDER BY createdAt DESC LIMIT 5)
    UNION ALL
    (SELECT 'incident', incidentID,
      CASE status WHEN 'Escalated' THEN 'Incident escalated' ELSE 'Incident reported' END,
      reportedAt
     FROM INCIDENT_REPORT ORDER BY reportedAt DESC LIMIT 5)
    UNION ALL
    (SELECT 'verification', verificationID, 'New verification pending', submittedAt
     FROM IDENTITY_VERIFICATION WHERE status IN ('Pending', 'UnderReview')
     ORDER BY submittedAt DESC LIMIT 5)
    ORDER BY time DESC
    LIMIT 10
  `);

  send(res, 200, rows);
});

// GET /api/admin/bookings (Support) — recent bookings with owner/minder names and service type
register('GET', '/api/admin/bookings', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'support')) return;

  const employeeID = await getEmployeeId(db, req.userId);
  if (!employeeID) return send(res, 403, { error: 'Support profile not found' });

  const [rows] = await db.query(`
    SELECT
      B.bookingID, B.status, B.startTime, B.createdAt,
      CONCAT(PO.firstName, ' ', PO.lastName) AS ownerName,
      CONCAT(PM.firstName, ' ', PM.lastName) AS minderName,
      ST.name AS serviceName
    FROM BOOKING B
    JOIN PET_OWNER O ON O.ownerID = B.ownerID
    JOIN USER_PROFILE PO ON PO.userID = O.userID
    JOIN PET_MINDER M ON M.sitterID = B.sitterID
    JOIN USER_PROFILE PM ON PM.userID = M.userID
    JOIN SERVICE_TYPE ST ON ST.serviceTypeID = B.serviceTypeID
    ORDER BY B.createdAt DESC
    LIMIT 5
  `);

  send(res, 200, rows);
});

// GET /api/admin/bookings/stats (Support) — aggregate booking counts by status
register('GET', '/api/admin/bookings/stats', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'support')) return;

  const employeeID = await getEmployeeId(db, req.userId);
  if (!employeeID) return send(res, 403, { error: 'Support profile not found' });

  const [[stats]] = await db.query(`
    SELECT
      COUNT(*)                                                        AS total,
      SUM(CASE WHEN LOWER(status) = 'confirmed'  THEN 1 ELSE 0 END) AS confirmed,
      SUM(CASE WHEN LOWER(status) = 'pending'    THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN LOWER(status) = 'cancelled'  THEN 1 ELSE 0 END) AS cancelled,
      SUM(CASE WHEN LOWER(status) = 'completed'  THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN LOWER(status) = 'active'     THEN 1 ELSE 0 END) AS active
    FROM BOOKING
  `);

  send(res, 200, stats);
});

// GET /api/admin/bookings/all (Support) — full booking list with owner/minder/pet/service/payment details
// Supports optional ?status= query param to filter by booking status
register('GET', '/api/admin/bookings/all', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'support')) return;

  const employeeID = await getEmployeeId(db, req.userId);
  if (!employeeID) return send(res, 403, { error: 'Support profile not found' });

  const statusFilter = req.query?.status;
  const whereClause = (statusFilter && statusFilter !== 'all')
    ? 'WHERE LOWER(B.status) = ?'
    : '';
  const params = (statusFilter && statusFilter !== 'all') ? [statusFilter.toLowerCase()] : [];

  const [rows] = await db.query(`
    SELECT
      B.bookingID, B.status, B.startTime, B.endTime, B.totalCost,
      B.ownerNotes, B.cancellationReason, B.createdAt,
      CONCAT(PO.firstName, ' ', PO.lastName) AS ownerName,
      CONCAT(PM.firstName, ' ', PM.lastName) AS minderName,
      PP.name AS petName, PP.species AS petSpecies,
      ST.name AS serviceName, ST.duration AS serviceDuration,
      L.city AS locationCity, L.postcode AS locationPostcode,
      PAY.escrowStatus AS paymentEscrow, PAY.amount AS paymentAmount
    FROM BOOKING B
    JOIN PET_OWNER O   ON O.ownerID         = B.ownerID
    JOIN USER_PROFILE PO ON PO.userID       = O.userID
    JOIN PET_MINDER M  ON M.sitterID        = B.sitterID
    JOIN USER_PROFILE PM ON PM.userID       = M.userID
    JOIN PET_PROFILE PP ON PP.petID         = B.petID
    JOIN SERVICE_TYPE ST ON ST.serviceTypeID = B.serviceTypeID
    LEFT JOIN LOCATION L  ON L.locationID   = B.locationID
    LEFT JOIN PAYMENT PAY ON PAY.bookingID  = B.bookingID
    ${whereClause}
    ORDER BY B.createdAt DESC
  `, params);

  send(res, 200, rows);
});

// PATCH /api/admin/bookings/:id/cancel (Support) — cancel any booking regardless of owner
register('PATCH', '/api/admin/bookings/:id/cancel', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'support')) return;

  const employeeID = await getEmployeeId(db, req.userId);
  if (!employeeID) return send(res, 403, { error: 'Support profile not found' });

  const bookingID = req.params.id;
  const [[booking]] = await db.query('SELECT * FROM BOOKING WHERE bookingID = ?', [bookingID]);
  if (!booking) return notFound(send, res, 'Booking not found');

  const status = String(booking.status).toLowerCase();
  if (['completed', 'cancelled'].includes(status)) {
    return send(res, 409, { error: 'Booking cannot be cancelled' });
  }

  const body = await req.parseBody();
  const reason = body?.cancellationReason || 'Cancelled by support';

  await db.query(
    'UPDATE BOOKING SET status = ?, cancellationReason = ? WHERE bookingID = ?',
    ['cancelled', reason, bookingID]
  );
  await db.query('UPDATE SLOT SET isBooked = FALSE WHERE slotID = ?', [booking.slotID]);

  const [[updated]] = await db.query('SELECT * FROM BOOKING WHERE bookingID = ?', [bookingID]);
  send(res, 200, updated);
});

// PATCH /api/admin/bookings/:id/status (Support) — manually override a booking's status
register('PATCH', '/api/admin/bookings/:id/status', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'support')) return;

  const employeeID = await getEmployeeId(db, req.userId);
  if (!employeeID) return send(res, 403, { error: 'Support profile not found' });

  const bookingID = req.params.id;
  const [[booking]] = await db.query('SELECT * FROM BOOKING WHERE bookingID = ?', [bookingID]);
  if (!booking) return notFound(send, res, 'Booking not found');

  const body = await req.parseBody();
  const newStatus = body?.status;

  const VALID_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];
  if (!newStatus || !VALID_STATUSES.includes(newStatus.toLowerCase())) {
    return send(res, 400, { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  await db.query(
    'UPDATE BOOKING SET status = ? WHERE bookingID = ?',
    [newStatus.toLowerCase(), bookingID]
  );

  const [[updated]] = await db.query('SELECT * FROM BOOKING WHERE bookingID = ?', [bookingID]);
  send(res, 200, updated);
});

// PATCH /api/admin/bookings/:id/intervene (Support) — log a support intervention as an incident report
register('PATCH', '/api/admin/bookings/:id/intervene', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'support')) return;

  const employeeID = await getEmployeeId(db, req.userId);
  if (!employeeID) return send(res, 403, { error: 'Support profile not found' });

  const bookingID = req.params.id;
  const [[booking]] = await db.query('SELECT * FROM BOOKING WHERE bookingID = ?', [bookingID]);
  if (!booking) return notFound(send, res, 'Booking not found');

  const body = await req.parseBody();
  const description = body?.reason || 'Support intervention initiated for this booking.';

  const incidentID = uuid();
  await db.query(
    `INSERT INTO INCIDENT_REPORT
       (incidentID, bookingID, employeeID, incidentType, severityLevel, description, status)
     VALUES (?, ?, ?, 'Other', 'Medium', ?, 'Open')`,
    [incidentID, bookingID, employeeID, description]
  );

  const [[incident]] = await db.query(
    'SELECT * FROM INCIDENT_REPORT WHERE incidentID = ?',
    [incidentID]
  );
  send(res, 201, incident);
});

// GET /api/admin/activity (Support) — daily dispute + incident counts for the last 10 days (chart data)
register('GET', '/api/admin/activity', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'support')) return;

  const employeeID = await getEmployeeId(db, req.userId);
  if (!employeeID) return send(res, 403, { error: 'Support profile not found' });

  const [disputeRows] = await db.query(`
    SELECT DATE_FORMAT(createdAt, '%Y-%m-%d') AS day, COUNT(*) AS cnt
    FROM DISPUTE
    WHERE createdAt >= DATE_SUB(CURDATE(), INTERVAL 9 DAY)
    GROUP BY DATE_FORMAT(createdAt, '%Y-%m-%d')
  `);

  const [incidentRows] = await db.query(`
    SELECT DATE_FORMAT(reportedAt, '%Y-%m-%d') AS day, COUNT(*) AS cnt
    FROM INCIDENT_REPORT
    WHERE reportedAt >= DATE_SUB(CURDATE(), INTERVAL 9 DAY)
    GROUP BY DATE_FORMAT(reportedAt, '%Y-%m-%d')
  `);

  // Merge counts by day and fill zeros for missing days
  const dayMap = {};
  for (const r of [...disputeRows, ...incidentRows]) {
    dayMap[r.day] = (dayMap[r.day] || 0) + Number(r.cnt);
  }

  const result = [];
  for (let i = 9; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push({ day: key, count: dayMap[key] || 0 });
  }

  send(res, 200, result);
});

// ─── Review Moderation ────────────────────────────────────────────────────────

// PATCH /api/reviews/:id/approve (Support) — approve a flagged review (dismiss the flag)
register('PATCH', '/api/reviews/:id/approve', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'support')) return;

  const employeeID = await getEmployeeId(db, req.userId);
  if (!employeeID) return send(res, 403, { error: 'Support profile not found' });

  const reviewID = req.params.id;
  const [[review]] = await db.query('SELECT * FROM REVIEW WHERE reviewID = ?', [reviewID]);
  if (!review) return notFound(send, res, 'Review not found');
  if (review.status === 'Approved') return send(res, 409, { error: 'Review is already approved' });
  if (review.status === 'Removed') return send(res, 409, { error: 'Cannot approve a removed review; it must be reinstated first' });

  // Set review status back to Approved and dismiss any open flags
  await db.query(
    `UPDATE REVIEW SET status = 'Approved' WHERE reviewID = ?`,
    [reviewID]
  );

  await db.query(
    `UPDATE REVIEW_FLAG SET status = 'Dismissed' WHERE reviewID = ? AND status = 'Open'`,
    [reviewID]
  );

  const [[updated]] = await db.query('SELECT * FROM REVIEW WHERE reviewID = ?', [reviewID]);
  send(res, 200, updated);
});

// PATCH /api/admin/reviews/:id/remove (Support) — mark a review as Removed and resolve open flags
register('PATCH', '/api/admin/reviews/:id/remove', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'support')) return;

  const employeeID = await getEmployeeId(db, req.userId);
  if (!employeeID) return send(res, 403, { error: 'Support profile not found' });

  const reviewID = req.params.id;
  const [[review]] = await db.query('SELECT * FROM REVIEW WHERE reviewID = ?', [reviewID]);
  if (!review) return notFound(send, res, 'Review not found');
  if (review.status === 'Removed') return send(res, 409, { error: 'Review is already removed' });

  await db.query(`UPDATE REVIEW SET status = 'Removed' WHERE reviewID = ?`, [reviewID]);
  await db.query(
    `UPDATE REVIEW_FLAG SET status = 'Resolved' WHERE reviewID = ? AND status = 'Open'`,
    [reviewID]
  );

  const [[updated]] = await db.query('SELECT * FROM REVIEW WHERE reviewID = ?', [reviewID]);
  send(res, 200, updated);
});

// GET /api/admin/reviews/stats (Support) — aggregate review counts and avg rating
register('GET', '/api/admin/reviews/stats', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'support')) return;

  const employeeID = await getEmployeeId(db, req.userId);
  if (!employeeID) return send(res, 403, { error: 'Support profile not found' });

  const [[stats]] = await db.query(`
    SELECT
      COUNT(*)                                                         AS total,
      ROUND(AVG(rating), 1)                                           AS avgRating,
      SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END)           AS approved,
      SUM(CASE WHEN status = 'Flagged'  THEN 1 ELSE 0 END)           AS flagged,
      SUM(CASE WHEN status = 'Pending'  THEN 1 ELSE 0 END)           AS pending
    FROM REVIEW
  `);

  send(res, 200, stats);
});

// GET /api/admin/reviews (Support) — all reviews with owner/minder names and open flag info
// Supports optional ?status= query param (Pending | Approved | Flagged | Removed)
register('GET', '/api/admin/reviews', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'support')) return;

  const employeeID = await getEmployeeId(db, req.userId);
  if (!employeeID) return send(res, 403, { error: 'Support profile not found' });

  const statusFilter = req.query?.status;
  const whereClause = (statusFilter && statusFilter !== 'all')
    ? 'WHERE R.status = ?'
    : '';
  const params = (statusFilter && statusFilter !== 'all') ? [statusFilter] : [];

  const [rows] = await db.query(`
    SELECT
      R.reviewID, R.rating, R.comment, R.status, R.createdAt, R.bookingID,
      CONCAT(PO.firstName, ' ', PO.lastName) AS ownerName,
      CONCAT(PM.firstName, ' ', PM.lastName) AS minderName,
      F.reason AS flagReason, F.createdAt AS flaggedAt
    FROM REVIEW R
    JOIN BOOKING B        ON B.bookingID    = R.bookingID
    JOIN PET_OWNER O      ON O.ownerID      = B.ownerID
    JOIN USER_PROFILE PO  ON PO.userID      = O.userID
    JOIN PET_MINDER M     ON M.sitterID     = B.sitterID
    JOIN USER_PROFILE PM  ON PM.userID      = M.userID
    LEFT JOIN REVIEW_FLAG F ON F.reviewID   = R.reviewID AND F.status = 'Open'
    ${whereClause}
    ORDER BY R.createdAt DESC
  `, params);

  send(res, 200, rows);
});

// ─── Platform Settings ───────────────────────────────────────────────────────

const SETTINGS_ID = 'settings-main';

// GET /api/admin/settings (Support) — fetch platform settings row (creates default if missing)
register('GET', '/api/admin/settings', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'support')) return;

  const employeeID = await getEmployeeId(db, req.userId);
  if (!employeeID) return send(res, 403, { error: 'Support profile not found' });

  let [[row]] = await db.query('SELECT * FROM PLATFORM_SETTINGS WHERE settingID = ?', [SETTINGS_ID]);

  if (!row) {
    await db.query('INSERT INTO PLATFORM_SETTINGS (settingID) VALUES (?)', [SETTINGS_ID]);
    [[row]] = await db.query('SELECT * FROM PLATFORM_SETTINGS WHERE settingID = ?', [SETTINGS_ID]);
  }

  send(res, 200, row);
});

// PATCH /api/admin/settings (Support) — update one or more platform setting fields
register('PATCH', '/api/admin/settings', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'support')) return;

  const employeeID = await getEmployeeId(db, req.userId);
  if (!employeeID) return send(res, 403, { error: 'Support profile not found' });

  const body = await req.parseBody();

  const allowed = [
    'emailNotifications', 'smsNotifications', 'bookingReminders', 'incidentAlerts',
    'platformFeePercent', 'escrowReleaseDays', 'refundWindowDays', 'stripeMode',
    'sessionTimeoutMins', 'twoFAEnabled', 'auditLogRetentionDays', 'gdprMode',
  ];

  const updates = {};
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return badRequest(send, res, 'No valid fields to update');
  }

  // Ensure the single settings row exists
  await db.query('INSERT IGNORE INTO PLATFORM_SETTINGS (settingID) VALUES (?)', [SETTINGS_ID]);

  const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  await db.query(
    `UPDATE PLATFORM_SETTINGS SET ${setClauses} WHERE settingID = ?`,
    [...Object.values(updates), SETTINGS_ID]
  );

  const [[updated]] = await db.query('SELECT * FROM PLATFORM_SETTINGS WHERE settingID = ?', [SETTINGS_ID]);
  send(res, 200, updated);
});

// ─── Email Templates (DB-backed via PLATFORM_SETTINGS.emailTemplatesJson) ────

const DEFAULT_EMAIL_TEMPLATES = {
  bookingConfirmed: {
    key: 'bookingConfirmed',
    name: 'Booking Confirmed',
    subject: 'Your booking with {{minderName}} is confirmed!',
    body: 'Hi {{ownerName}},\n\nYour booking with {{minderName}} has been confirmed for {{date}} at {{time}}.\n\nService: {{service}}\nLocation: {{location}}\n\nNeed help? Contact support@happytails.com\n\nThanks,\nThe Happy Tails Team',
  },
  minderVerified: {
    key: 'minderVerified',
    name: 'Minder Verified',
    subject: 'Congratulations! Your profile is now verified',
    body: 'Hi {{minderName}},\n\nGreat news! Your identity has been verified and your profile is now live on Happy Tails.\n\nYou can now start accepting booking requests from pet owners.\n\nThanks,\nThe Happy Tails Team',
  },
  incidentAlert: {
    key: 'incidentAlert',
    name: 'Incident Alert',
    subject: 'Important: An incident has been reported for your booking',
    body: 'Hi {{ownerName}},\n\nAn incident has been reported in connection with your booking on {{date}}.\n\nOur support team is reviewing the case and will contact you within 24 hours.\n\nReference: {{incidentID}}\n\nThanks,\nThe Happy Tails Support Team',
  },
  reviewRequest: {
    key: 'reviewRequest',
    name: 'Review Request',
    subject: 'How was your experience with {{minderName}}?',
    body: 'Hi {{ownerName}},\n\nWe hope {{petName}} had a wonderful time! We\'d love to hear about your experience with {{minderName}}.\n\nLeave a review: {{reviewLink}}\n\nYour feedback helps other pet owners make great choices.\n\nThanks,\nThe Happy Tails Team',
  },
};

// Read emailTemplatesJson from the DB, falling back to defaults if null/unparseable
async function loadTemplatesFromDb() {
  await db.query('INSERT IGNORE INTO PLATFORM_SETTINGS (settingID) VALUES (?)', [SETTINGS_ID]);
  const [[row]] = await db.query(
    'SELECT emailTemplatesJson FROM PLATFORM_SETTINGS WHERE settingID = ?',
    [SETTINGS_ID]
  );
  if (!row || !row.emailTemplatesJson) return { ...DEFAULT_EMAIL_TEMPLATES };
  try {
    return JSON.parse(row.emailTemplatesJson);
  } catch {
    return { ...DEFAULT_EMAIL_TEMPLATES };
  }
}

// GET /api/admin/email-templates (Support) — read templates from DB
register('GET', '/api/admin/email-templates', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'support')) return;

  const employeeID = await getEmployeeId(db, req.userId);
  if (!employeeID) return send(res, 403, { error: 'Support profile not found' });

  const templates = await loadTemplatesFromDb();
  send(res, 200, templates);
});

// PATCH /api/admin/email-templates/:key (Support) — update one template and persist to DB
register('PATCH', '/api/admin/email-templates/:key', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'support')) return;

  const employeeID = await getEmployeeId(db, req.userId);
  if (!employeeID) return send(res, 403, { error: 'Support profile not found' });

  const key = req.params.key;
  if (!DEFAULT_EMAIL_TEMPLATES[key]) return notFound(send, res, 'Email template not found');

  const body = await req.parseBody();
  const { subject, body: templateBody } = body;

  // Load current state, apply the update, write back
  const templates = await loadTemplatesFromDb();
  if (subject !== undefined)      templates[key].subject = subject;
  if (templateBody !== undefined) templates[key].body    = templateBody;

  await db.query(
    'UPDATE PLATFORM_SETTINGS SET emailTemplatesJson = ? WHERE settingID = ?',
    [JSON.stringify(templates), SETTINGS_ID]
  );

  send(res, 200, templates[key]);
});

// ─── Platform Analytics ───────────────────────────────────────────────────────

// Builds a full list of YYYY-MM month keys between two date strings (inclusive)
function generateMonthRange(from, to) {
  const months = [];
  const start = new Date(from);
  start.setDate(1);
  const end = new Date(to);
  end.setDate(1);
  while (start <= end) {
    const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
    const label = start.toLocaleString('en-GB', { month: 'short', year: 'numeric' });
    months.push({ key, label });
    start.setMonth(start.getMonth() + 1);
  }
  return months;
}

// GET /api/admin/reports (Support) — full platform analytics report
// Optional query params: ?from=YYYY-MM-DD&to=YYYY-MM-DD (defaults to last 6 months)
register('GET', '/api/admin/reports', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'support')) return;

  const employeeID = await getEmployeeId(db, req.userId);
  if (!employeeID) return send(res, 403, { error: 'Support profile not found' });

  const to = req.query?.to || new Date().toISOString().slice(0, 10);
  const fromDefault = new Date(to);
  fromDefault.setMonth(fromDefault.getMonth() - 6);
  const from = req.query?.from || fromDefault.toISOString().slice(0, 10);

  // Monthly booking counts
  const [bookingRows] = await db.query(`
    SELECT
      DATE_FORMAT(createdAt, '%Y-%m')  AS monthKey,
      DATE_FORMAT(createdAt, '%b %Y')  AS month,
      COUNT(*)                         AS count
    FROM BOOKING
    WHERE DATE(createdAt) BETWEEN ? AND ?
    GROUP BY DATE_FORMAT(createdAt, '%Y-%m'), DATE_FORMAT(createdAt, '%b %Y')
    ORDER BY monthKey ASC
  `, [from, to]);

  // Monthly revenue (using BOOKING.totalCost)
  const [revenueRows] = await db.query(`
    SELECT
      DATE_FORMAT(createdAt, '%Y-%m')  AS monthKey,
      DATE_FORMAT(createdAt, '%b %Y')  AS month,
      COALESCE(SUM(totalCost), 0)      AS revenue
    FROM BOOKING
    WHERE DATE(createdAt) BETWEEN ? AND ?
    GROUP BY DATE_FORMAT(createdAt, '%Y-%m'), DATE_FORMAT(createdAt, '%b %Y')
    ORDER BY monthKey ASC
  `, [from, to]);

  // Fill zeros for months with no data
  const monthRange = generateMonthRange(from, to);
  const bookingMap  = Object.fromEntries(bookingRows.map(r  => [r.monthKey, Number(r.count)]));
  const revenueMap  = Object.fromEntries(revenueRows.map(r  => [r.monthKey, Number(r.revenue)]));

  const monthlyBookings = monthRange.map(m => ({ month: m.label, monthKey: m.key, count:   bookingMap[m.key]  || 0 }));
  const monthlyRevenue  = monthRange.map(m => ({ month: m.label, monthKey: m.key, revenue: revenueMap[m.key]  || 0 }));

  // Bookings by service type
  const [serviceRows] = await db.query(`
    SELECT
      ST.name                           AS service,
      COUNT(B.bookingID)                AS bookings,
      COALESCE(SUM(B.totalCost), 0)     AS revenue
    FROM BOOKING B
    JOIN SERVICE_TYPE ST ON ST.serviceTypeID = B.serviceTypeID
    WHERE DATE(B.createdAt) BETWEEN ? AND ?
    GROUP BY B.serviceTypeID, ST.name
    ORDER BY bookings DESC
  `, [from, to]);

  const totalServiceBookings = serviceRows.reduce((s, r) => s + Number(r.bookings), 0);
  const serviceBreakdown = serviceRows.map(r => ({
    service:  r.service,
    bookings: Number(r.bookings),
    revenue:  Number(r.revenue),
    share:    totalServiceBookings > 0
                ? Math.round((Number(r.bookings) / totalServiceBookings) * 100)
                : 0,
  }));

  // Top performing minders
  const [minderRows] = await db.query(`
    SELECT
      CONCAT(UP.firstName, ' ', UP.lastName)  AS name,
      UP.city                                  AS city,
      COALESCE(PM.ratingAvg, 0)               AS rating,
      COUNT(B.bookingID)                       AS bookings,
      COALESCE(SUM(B.totalCost), 0)           AS revenue
    FROM BOOKING B
    JOIN PET_MINDER   PM ON PM.sitterID  = B.sitterID
    JOIN USER_PROFILE UP ON UP.userID    = PM.userID
    WHERE DATE(B.createdAt) BETWEEN ? AND ?
    GROUP BY B.sitterID, UP.firstName, UP.lastName, UP.city, PM.ratingAvg
    ORDER BY bookings DESC
    LIMIT 10
  `, [from, to]);

  const topMinders = minderRows.map(r => ({
    name:     r.name,
    city:     r.city || 'N/A',
    rating:   Number(r.rating),
    bookings: Number(r.bookings),
    revenue:  Number(r.revenue),
  }));

  send(res, 200, {
    dateRange: { from, to },
    monthlyBookings,
    monthlyRevenue,
    serviceBreakdown,
    topMinders,
  });
});
