// server/routes/disputes.js
const { register } = require('../router');
const db = require('../db');
const {
  uuid,
  badRequest,
  notFound,
  requireUser,
  requireRole,
  getOwnerId,
  getEmployeeId,
} = require('../lib/helpers');

async function getDispute(disputeID) {
  const [[d]] = await db.query('SELECT * FROM DISPUTE WHERE disputeID = ?', [disputeID]);
  return d || null;
}

async function getBooking(bookingID) {
  const [[b]] = await db.query('SELECT * FROM BOOKING WHERE bookingID = ?', [bookingID]);
  return b || null;
}



// 36) POST /api/disputes (Owner) — raise a dispute on a booking
register('POST', '/api/disputes', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'owner')) return;

  const ownerID = await getOwnerId(db, req.userId);
  if (!ownerID) return send(res, 403, { error: 'Owner profile not found' });

  const body = await req.parseBody();
  // Example: { bookingID: 'bk-001', disputeType: 'Other', reason: 'Service was not completed as agreed.', severityLevel: 'Low', isRefundRequested: false }
  const { bookingID, disputeType, reason, severityLevel, isRefundRequested } = body;

  if (!bookingID || !reason) return badRequest(send, res, 'bookingID and reason are required');

  const booking = await getBooking(bookingID);
  if (!booking) return notFound(send, res, 'Booking not found');
  if (booking.ownerID !== ownerID) return send(res, 403, { error: 'Forbidden' });

  const validTypes = ['RefundRequest', 'NoShowComplaint', 'ServiceQuality', 'PaymentDispute', 'Other'];
  const type = validTypes.includes(disputeType) ? disputeType : 'Other';

  const disputeID = uuid();
  await db.query(
    `INSERT INTO DISPUTE (disputeID, bookingID, userID, disputeType, reason, status, isRefundRequested, severityLevel)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [disputeID, bookingID, req.userId, type, reason, 'Open', isRefundRequested ? 1 : 0, severityLevel]
  );

  const dispute = await getDispute(disputeID);
  send(res, 201, dispute);
});

// 37) GET /api/disputes (Support) — list all disputes
register('GET', '/api/disputes', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'support')) return;

  const employeeID = await getEmployeeId(db, req.userId);
  if (!employeeID) return send(res, 403, { error: 'Support profile not found' });

  const { status, severity } = req.query;

  let sql = `
    SELECT
      D.disputeID, D.bookingID, D.userID, D.employeeID,
      D.disputeType, D.reason, D.status, D.isRefundRequested,
      D.resolutionNotes, D.severityLevel, D.assignedAt, D.createdAt,
      P.firstName AS raisedByFirstName, P.lastName AS raisedByLastName,
      B.ownerID, B.sitterID, B.status AS bookingStatus
    FROM DISPUTE D
    JOIN USER_PROFILE P ON P.userID = D.userID
    JOIN BOOKING B ON B.bookingID = D.bookingID
  `;
  const params = [];
  const conditions = [];

  if (status) {
    conditions.push('D.status = ?');
    params.push(status);
  }
  if (severity) {
    conditions.push('D.severityLevel = ?');
    params.push(severity);
  }
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY D.createdAt DESC';

  const [rows] = await db.query(sql, params);
  send(res, 200, rows);
});

// 38) GET /api/disputes/:id (Support) — single dispute detail
register('GET', '/api/disputes/:id', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'support')) return;

  const employeeID = await getEmployeeId(db, req.userId);
  if (!employeeID) return send(res, 403, { error: 'Support profile not found' });

  const disputeID = req.params.id;
  const [[row]] = await db.query(
    `SELECT
       D.disputeID, D.bookingID, D.userID, D.employeeID,
       D.disputeType, D.reason, D.status, D.isRefundRequested,
       D.resolutionNotes, D.severityLevel, D.assignedAt, D.createdAt,
       P.firstName AS raisedByFirstName, P.lastName AS raisedByLastName, P.email AS raisedByEmail,
       B.ownerID, B.sitterID, B.status AS bookingStatus, B.totalCost
     FROM DISPUTE D
     JOIN USER_PROFILE P ON P.userID = D.userID
     JOIN BOOKING B ON B.bookingID = D.bookingID
     WHERE D.disputeID = ?`,
    [disputeID]
  );
  if (!row) return notFound(send, res, 'Dispute not found');
  send(res, 200, row);
});

// 39) PATCH /api/disputes/:id/resolve (Support) — resolve a dispute
register('PATCH', '/api/disputes/:id/resolve', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'support')) return;

  const employeeID = await getEmployeeId(db, req.userId);
  if (!employeeID) return send(res, 403, { error: 'Support profile not found' });

  const disputeID = req.params.id;
  const dispute = await getDispute(disputeID);
  if (!dispute) return notFound(send, res, 'Dispute not found');
  if (dispute.status === 'Resolved') return send(res, 409, { error: 'Dispute is already resolved' });

  const body = await req.parseBody();
  // Example: { resolutionNotes: 'Dispute reviewed and resolved by support team.' }
  const resolutionNotes = body?.resolutionNotes;

  await db.query(
    `UPDATE DISPUTE SET status = 'Resolved', resolutionNotes = ?, employeeID = ?, assignedAt = COALESCE(assignedAt, NOW())
     WHERE disputeID = ?`,
    [resolutionNotes, employeeID, disputeID]
  );

  const updated = await getDispute(disputeID);
  send(res, 200, updated);
});

// 40) PATCH /api/disputes/:id/escalate (Support) — escalate a dispute
register('PATCH', '/api/disputes/:id/escalate', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'support')) return;

  const employeeID = await getEmployeeId(db, req.userId);
  if (!employeeID) return send(res, 403, { error: 'Support profile not found' });

  const disputeID = req.params.id;
  const dispute = await getDispute(disputeID);
  if (!dispute) return notFound(send, res, 'Dispute not found');
  if (dispute.status === 'Resolved') return send(res, 409, { error: 'Cannot escalate a resolved dispute' });

  await db.query(
    `UPDATE DISPUTE SET status = 'Escalated', severityLevel = 'High', employeeID = ?, assignedAt = COALESCE(assignedAt, NOW())
     WHERE disputeID = ?`,
    [employeeID, disputeID]
  );

  const updated = await getDispute(disputeID);
  send(res, 200, updated);
});
