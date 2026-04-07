// server/routes/reports.js
const { register } = require('../router');
const db = require('../db');
const {
  uuid,
  badRequest,
  notFound,
  requireUser,
  requireRole,
  getOwnerId,
  getSitterId,
  getEmployeeId,
} = require('../lib/helpers');

async function getBooking(bookingID) {
  const [[b]] = await db.query('SELECT * FROM BOOKING WHERE bookingID = ?', [bookingID]);
  return b || null;
}

// 22) POST /api/reports/visit (Minder) - Submit a visit report
register('POST', '/api/reports/visit', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'minder')) return;

  const sitterID = await getSitterId(db, req.userId);
  if (!sitterID) return send(res, 403, { error: 'Minder profile not found' });

  const body = await req.parseBody();
  const { bookingID, taskChecklist = null, behaviouralNotes = null, completedAt = null } = body;
  if (!bookingID) return badRequest(send, res, 'bookingID is required');

  const booking = await getBooking(bookingID);
  if (!booking) return notFound(send, res, 'Booking not found');
  if (booking.sitterID !== sitterID) return send(res, 403, { error: 'Forbidden' });

  const reportID = uuid();
  await db.query(
    'INSERT INTO VISIT_REPORT (reportID, bookingID, taskChecklist, behaviouralNotes, completedAt) VALUES (?, ?, ?, ?, ?)',
    [reportID, bookingID, taskChecklist, behaviouralNotes, completedAt]
  );
  const [[row]] = await db.query('SELECT * FROM VISIT_REPORT WHERE reportID = ?', [reportID]);
  send(res, 201, row);
});

// 23) GET /api/reports/visit/:booking_id (Owner/Minder) - View visit reports for a booking
register('GET', '/api/reports/visit/:booking_id', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, ['owner', 'minder'])) return;

  const bookingID = req.params.booking_id;
  const booking = await getBooking(bookingID);
  if (!booking) return notFound(send, res, 'Booking not found');

  const role = String(req.userRole || '').toLowerCase();
  if (role === 'owner') {
    const ownerID = await getOwnerId(db, req.userId);
    if (!ownerID || booking.ownerID !== ownerID) return send(res, 403, { error: 'Forbidden' });
  } else {
    const sitterID = await getSitterId(db, req.userId);
    if (!sitterID || booking.sitterID !== sitterID) return send(res, 403, { error: 'Forbidden' });
  }

  const [rows] = await db.query('SELECT * FROM VISIT_REPORT WHERE bookingID = ? ORDER BY timestamp DESC', [bookingID]);
  send(res, 200, rows);
});

// 24) POST /api/reports/incident (Minder) - Log an incident
register('POST', '/api/reports/incident', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'minder')) return;

  const sitterID = await getSitterId(db, req.userId);
  if (!sitterID) return send(res, 403, { error: 'Minder profile not found' });

  const body = await req.parseBody();
  const { bookingID, incidentType = 'Other', severityLevel = 'Low', description } = body;
  if (!bookingID || !description) return badRequest(send, res, 'bookingID and description are required');

  const booking = await getBooking(bookingID);
  if (!booking) return notFound(send, res, 'Booking not found');
  if (booking.sitterID !== sitterID) return send(res, 403, { error: 'Forbidden' });

  // INCIDENT_REPORT in schema is support-centric; we store reporterUserID (added in schema patch)
  const incidentID = uuid();
  await db.query(
    'INSERT INTO INCIDENT_REPORT (incidentID, bookingID, employeeID, reporterUserID, incidentType, severityLevel, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [incidentID, bookingID, null, req.userId, incidentType, severityLevel, description]
  );
  const [[row]] = await db.query('SELECT * FROM INCIDENT_REPORT WHERE incidentID = ?', [incidentID]);
  send(res, 201, row);
});

// 25) GET /api/reports/incidents (Support) - View all incident reports
register('GET', '/api/reports/incidents', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'support')) return;

  const employeeID = await getEmployeeId(db, req.userId);
  if (!employeeID) return send(res, 403, { error: 'Support profile not found' });

  const [rows] = await db.query(
    `SELECT IR.*, B.ownerID, B.sitterID, B.status AS bookingStatus
     FROM INCIDENT_REPORT IR
     JOIN BOOKING B ON B.bookingID = IR.bookingID
     ORDER BY IR.reportedAt DESC`
  );
  send(res, 200, rows);
});