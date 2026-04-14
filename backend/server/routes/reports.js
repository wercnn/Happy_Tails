// server/routes/auth.js
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

async function getAnySupportEmployeeId() {
  const [[row]] = await db.query(
    'SELECT employeeID FROM CUSTOMER_SUPPORT ORDER BY employeeID ASC LIMIT 1'
  );
  return row?.employeeID || null;
}

async function getUserIdForOwner(ownerID) {
  const [[row]] = await db.query(
    'SELECT userID FROM PET_OWNER WHERE ownerID = ?',
    [ownerID]
  );
  return row?.userID || null;
}

async function insertNotification(recipientUserID, title, body) {
  await db.query(
    `INSERT INTO NOTIFICATION (notificationID, recipientID, channel, title, body)
     VALUES (?, ?, 'in-app', ?, ?)`,
    [uuid(), recipientUserID, title, body]
  );
}

function isProbablyDataUrl(value) {
  return typeof value === 'string' && value.startsWith('data:image/');
}


// submit visit reports for ONLY minders
register('POST', '/api/reports/visit', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'minder')) return;

  const sitterID = await getSitterId(db, req.userId);
  if (!sitterID) return send(res, 403, { error: 'Minder profile not found' });

  const body = await req.parseBody();
  // Example: { bookingID: 'bk-002', taskChecklist: 'Fed: Yes | Walk: Yes | Medication: N/A | Water: Yes', behaviouralNotes: 'Pet was calm throughout the visit.', completedAt: '2026-04-08 12:00:00' }
  const { bookingID, taskChecklist, behaviouralNotes, completedAt } = body;
  if (!bookingID) return badRequest(send, res, 'bookingID is required');

  const booking = await getBooking(bookingID);
  if (!booking) return notFound(send, res, 'Booking not found');
  if (booking.sitterID !== sitterID) return send(res, 403, { error: 'Incorrect sitter' });

  const reportID = uuid();
  await db.query(
    'INSERT INTO VISIT_REPORT (reportID, bookingID, taskChecklist, behaviouralNotes, completedAt) VALUES (?, ?, ?, ?, ?)',
    [reportID, bookingID, taskChecklist, behaviouralNotes, completedAt]
  );
  const [[row]] = await db.query('SELECT * FROM VISIT_REPORT WHERE reportID = ?', [reportID]);

  // Notify the owner that a report was submitted.
  try {
    const ownerUserID = await getUserIdForOwner(booking.ownerID);
    if (ownerUserID) {
      await insertNotification(
        ownerUserID,
        'Visit report submitted',
        'Your minder submitted a visit report for your booking. Open the booking to view details.'
      );
    }
  } catch (e) {}

  send(res, 201, row);
});

// Upload proof-of-life photo for an active/accepted booking (prototype).
// Creates a VISIT_REPORT stub if needed and links the MEDIA to it.
register('POST', '/api/reports/visit/:booking_id/proof', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'minder')) return;

  const sitterID = await getSitterId(db, req.userId);
  if (!sitterID) return send(res, 403, { error: 'Minder profile not found' });

  const bookingID = req.params.booking_id;
  const booking = await getBooking(bookingID);
  if (!booking) return notFound(send, res, 'Booking not found');
  if (booking.sitterID !== sitterID) return send(res, 403, { error: 'Incorrect sitter' });

  const status = String(booking.status || '').toLowerCase();
  if (!['accepted', 'active'].includes(status)) {
    return send(res, 409, { error: 'Proof uploads are only allowed for active/accepted bookings' });
  }

  const body = await req.parseBody();
  const { photoDataUrl } = body;
  if (!photoDataUrl || !isProbablyDataUrl(photoDataUrl)) {
    return badRequest(send, res, 'photoDataUrl (data:image/*) is required');
  }

  // Find latest report or create stub.
  const [[latest]] = await db.query(
    'SELECT reportID FROM VISIT_REPORT WHERE bookingID = ? ORDER BY timestamp DESC LIMIT 1',
    [bookingID]
  );

  const reportID = latest?.reportID || uuid();
  if (!latest?.reportID) {
    await db.query(
      'INSERT INTO VISIT_REPORT (reportID, bookingID, taskChecklist, behaviouralNotes, completedAt) VALUES (?, ?, NULL, NULL, NULL)',
      [reportID, bookingID]
    );
  }

  const mediaID = uuid();
  await db.query(
    'INSERT INTO MEDIA (mediaID, reportID, fileURL, mediaType) VALUES (?, ?, ?, ?)',
    [mediaID, reportID, String(photoDataUrl), 'image']
  );

  const [[row]] = await db.query('SELECT * FROM MEDIA WHERE mediaID = ?', [mediaID]);
  send(res, 201, row);
});


// get visit report/s for a booking
register('GET', '/api/reports/visit/:booking_id', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, ['owner', 'minder'])) return;

  const bookingID = req.params.booking_id;
  const booking = await getBooking(bookingID);
  if (!booking) return notFound(send, res, 'Booking not found');

  const role = String(req.userRole || '').toLowerCase();
  if (role === 'owner') {
    const ownerID = await getOwnerId(db, req.userId);
    if (!ownerID) return send(res, 403, { error: 'Owner profile not found' });
    if (booking.ownerID !== ownerID) return send(res, 403, { error: 'Forbidden: Incorrect owner' });
  } else {
    const sitterID = await getSitterId(db, req.userId);
    if (!sitterID) return send(res, 403, { error: 'Minder profile not found' });
    if (booking.sitterID !== sitterID) return send(res, 403, { error: 'Forbidden: Incorrect sitter' });
  }

  const [rows] = await db.query('SELECT * FROM VISIT_REPORT WHERE bookingID = ? ORDER BY timestamp DESC', [bookingID]);
  send(res, 200, rows);
});


// log an incident report
register('POST', '/api/reports/incident', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'minder')) return;

  const sitterID = await getSitterId(db, req.userId);
  if (!sitterID) return send(res, 403, { error: 'Minder profile not found' });

  const body = await req.parseBody();
  // Example: { bookingID: 'bk-003', incidentType: 'Other', severityLevel: 'Low', description: 'Minor incident during the visit — pet slipped its collar briefly.' }
  const { bookingID, incidentType, severityLevel, description } = body;
  if (!bookingID || !description) return badRequest(send, res, 'bookingID and description are required');

  const booking = await getBooking(bookingID);
  if (!booking) return notFound(send, res, 'Booking not found');
  if (booking.sitterID !== sitterID) return send(res, 403, { error: 'Forbidden: Incorrect sitter' });

  const employeeID = await getAnySupportEmployeeId();
  if (!employeeID) return send(res, 503, { error: 'No support employee is available to receive the report' });

  // INCIDENT_REPORT in schema is support-centric; we store reporterUserID (added in schema patch)
  const incidentID = uuid();
  await db.query(
    'INSERT INTO INCIDENT_REPORT (incidentID, bookingID, employeeID, reporterUserID, incidentType, severityLevel, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [incidentID, bookingID, employeeID, req.userId, incidentType, severityLevel, description]
  );
  const [[row]] = await db.query('SELECT * FROM INCIDENT_REPORT WHERE incidentID = ?', [incidentID]);
  send(res, 201, row);
});

// save generated case reference back onto the incident report
register('PATCH', '/api/reports/incident/:incident_id/case-reference', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;

  const incidentID = req.params.incident_id;
  const body = await req.parseBody();
  const { caseReference } = body;
  if (!caseReference) return badRequest(send, res, 'caseReference is required');

  const [[incident]] = await db.query('SELECT * FROM INCIDENT_REPORT WHERE incidentID = ?', [incidentID]);
  if (!incident) return notFound(send, res, 'Incident report not found');

  // Only the reporter or a support employee may update
  const role = String(req.userRole || '').toLowerCase();
  if (role !== 'support' && incident.reporterUserID !== req.userId) {
    return send(res, 403, { error: 'Forbidden' });
  }

  await db.query('UPDATE INCIDENT_REPORT SET caseReference = ? WHERE incidentID = ?', [caseReference, incidentID]);
  send(res, 200, { incidentID, caseReference });
});



// get all incident reports for ONLY support staff
register('GET', '/api/reports/incidents', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'support')) return;

  const employeeID = await getEmployeeId(db, req.userId);
  if (!employeeID) return send(res, 403, { error: 'Support profile not found' });

  const [rows] = await db.query(`
    SELECT
      IR.incidentID, IR.bookingID, IR.incidentType, IR.severityLevel,
      IR.description, IR.reportedAt, IR.status, IR.reporterUserID, IR.employeeID,
      B.ownerID, B.sitterID, B.status AS bookingStatus, B.petID,
      OP.firstName AS ownerFirstName, OP.lastName AS ownerLastName,
      MP.firstName AS minderFirstName, MP.lastName AS minderLastName,
      PP.name AS petName
    FROM INCIDENT_REPORT IR
    JOIN BOOKING B ON B.bookingID = IR.bookingID
    JOIN PET_OWNER PO ON PO.ownerID = B.ownerID
    JOIN USER_PROFILE OP ON OP.userID = PO.userID
    JOIN PET_MINDER PM ON PM.sitterID = B.sitterID
    JOIN USER_PROFILE MP ON MP.userID = PM.userID
    JOIN PET_PROFILE PP ON PP.petID = B.petID
    ORDER BY IR.reportedAt DESC
  `);
  send(res, 200, rows);
});
