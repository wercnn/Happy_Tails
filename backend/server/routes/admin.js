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

// 44) GET /api/stats (Support) — platform-wide aggregate counts for the Overview page
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

// 45) GET /api/minders/pending (Support) — minders with pending identity verification
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

// 46) PATCH /api/minders/:id/verify (Support) — approve minder identity verification
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

// 47) PATCH /api/minders/:id/reject (Support) — reject minder identity verification
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
  // TEST DATA - will be replaced by actual request body in production
  const reason = body?.reason || 'Documents could not be verified. Please resubmit with valid ID.';

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

// 48) PATCH /api/payments/:id/deny (Support) — deny a refund request, keep payment in escrow
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
  // TEST DATA - will be replaced by actual request body in production
  const reason = body?.reason || 'Refund request denied after support review. Payment will be released to minder.';

  // Denial keeps payment in Holding but records the decision; release must still be triggered separately
  await db.query(
    `UPDATE PAYMENT SET paymentStatus = 'Denied' WHERE paymentID = ?`,
    [paymentID]
  );

  const [[updated]] = await db.query('SELECT * FROM PAYMENT WHERE paymentID = ?', [paymentID]);
  send(res, 200, { payment: updated, denialReason: reason });
});

// ─── Incident Status Updates ──────────────────────────────────────────────────

// 49) PATCH /api/reports/incident/:id/escalate (Support) — escalate an incident
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

// 50) PATCH /api/reports/incident/:id/resolve (Support) — mark an incident as resolved
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

// 51) PATCH /api/reviews/:id/approve (Support) — approve a flagged review (dismiss the flag)
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
