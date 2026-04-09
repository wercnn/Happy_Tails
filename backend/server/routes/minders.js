// server/routes/minders.js
const { register } = require('../router');
const db = require('../db');
const {
  uuid,
  badRequest,
  notFound,
  requireUser,
  requireRole,
  getSitterId,
} = require('../lib/helpers');


// ─── Minder routes ───────────────────────────────────────────────────────

// GET /api/minders
// List all active minders. Supports optional query filters:
//   ?postcode=  — filter by serviceAreaPostcode
//   ?medication=true  — only minders who are medication-qualified
//   ?serviceTypeID=   — only minders who offer that service type
register('GET', '/api/minders', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'owner')) return;
  
  const { postcode, medication, serviceTypeID } = req.query;

  let query = `
    SELECT
      m.sitterID,
      m.bio,
      m.experienceYears,
      m.ratingAvg,
      m.medicationQualified,
      m.serviceAreaPostcode,
      p.firstName,
      p.lastName,
      p.city,
      p.postcode
    FROM PET_MINDER m
    JOIN USER_PROFILE p ON p.userID = m.userID
  `;
  const params = [];

  const conditions = [];
  if (postcode) {
    conditions.push('m.serviceAreaPostcode = ?');
    params.push(postcode);
  }
  if (medication === 'true') {
    conditions.push('m.medicationQualified = TRUE');
  }
  if (serviceTypeID) {
    conditions.push(
      'EXISTS (SELECT 1 FROM MINDER_SERVICE ms WHERE ms.sitterID = m.sitterID AND ms.serviceTypeID = ? AND ms.isActive = TRUE)'
    );
    params.push(serviceTypeID);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY m.ratingAvg DESC, m.experienceYears DESC';

  const [rows] = await db.query(query, params);
  send(res, 200, rows);
});

// PATCH /api/minders/:id
// Minder updates their own bio, experience, medication flag, or service area.
// Only the minder themselves can update their profile.
register('PATCH', '/api/minders/:id', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'minder')) return;

  // For req.params.id, it must be PET_MINDER.sitterID, not USER.userID, so we need to look up the sitterID for the logged-in user and compare it to the id in the URL path to ensure they can only edit their own profile.

  const sitterID = await getSitterId(db, req.userId); // Use the userId
  if (!sitterID) return send(res, 403, { error: 'Minder profile not found' });
  if (req.params.id !== sitterID) return send(res, 403, { error: 'Cannot edit another minder' });

  // Example: { bio: 'Experienced dog walker and boarder with a pet first-aid certificate.', experienceYears: 5, medicationQualified: true, serviceAreaPostcode: 'E2' }
  const body = await req.parseBody();
  const fields = ['bio', 'experienceYears', 'medicationQualified', 'serviceAreaPostcode', 'ratingAvg', 'overallRating'];
  const sets = [];
  const params = [];
  for (const f of fields) {
    if (Object.prototype.hasOwnProperty.call(body, f)) {
      sets.push(`${f} = ?`);
      params.push(f === 'medicationQualified' ? !!body[f] : body[f]);
    }
  }
  if (!sets.length) return badRequest(send, res, 'No updatable fields provided');

  params.push(sitterID);
  await db.query(`UPDATE PET_MINDER SET ${sets.join(', ')} WHERE sitterID = ?`, params);

  const [[updated]] = await db.query('SELECT * FROM PET_MINDER WHERE sitterID = ?', [sitterID]);
  send(res, 200, updated);
});

// POST /api/services
// Minder creates a new service listing linking them to a service type.
register('POST', '/api/services', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'minder')) return;

  const sitterID = await getSitterId(db, req.userId);
  if (!sitterID) return send(res, 403, { error: 'Minder profile not found' });

  const body = await req.parseBody();
  // Example: { serviceTypeID: 'st-daycare', customPrice: 32.00, isActive: true }
  const { serviceTypeID, customPrice, isActive } = body;
  if (!serviceTypeID || customPrice == null) {
    return badRequest(send, res, 'serviceTypeID and customPrice are required');
  }

  const minderServiceID = uuid();
  await db.query(
    'INSERT INTO MINDER_SERVICE (minderServiceID, sitterID, serviceTypeID, customPrice, isActive) VALUES (?, ?, ?, ?, ?)',
    [minderServiceID, sitterID, serviceTypeID, customPrice, !!isActive]
  );
  const [[row]] = await db.query('SELECT * FROM MINDER_SERVICE WHERE minderServiceID = ?', [minderServiceID]);
  send(res, 201, row);
});

// PATCH /api/services/:id
// Minder updates the price or active status of one of their services.
// 12) PATCH /api/services/:id (Minder) - Update a service
register('PATCH', '/api/services/:id', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'minder')) return;

  const sitterID = await getSitterId(db, req.userId);
  if (!sitterID) return send(res, 403, { error: 'Minder profile not found' });

  const minderServiceID = req.params.id;
  const [[service]] = await db.query(
    'SELECT minderServiceID, sitterID FROM MINDER_SERVICE WHERE minderServiceID = ?',
    [minderServiceID]
  );
  if (!service) return notFound(send, res, 'Service not found');
  if (service.sitterID !== sitterID) {
    return send(res, 403, { error: 'Forbidden: sitterID does not match this service' });
  }

  
  // Example: { customPrice: 20.00, isActive: true }
  const body = await req.parseBody();
  const fields = ['customPrice', 'isActive'];
  const sets = [];
  const params = [];
  for (const f of fields) {
    if (Object.prototype.hasOwnProperty.call(body, f)) {
      sets.push(`${f} = ?`);
      params.push(f === 'isActive' ? !!body[f] : body[f]);
    }
  }
  if (!sets.length) return badRequest(send, res, 'No updatable fields provided');

  params.push(minderServiceID, sitterID);
  await db.query(`UPDATE MINDER_SERVICE SET ${sets.join(', ')} WHERE minderServiceID = ? AND sitterID = ?`, params);
  const [[row]] = await db.query('SELECT * FROM MINDER_SERVICE WHERE minderServiceID = ?', [minderServiceID]);
  send(res, 200, row);
});

// DELETE /api/services/:id
// Minder removes one of their service listings.
register('DELETE', '/api/services/:id', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'minder')) return;

  const sitterID = await getSitterId(db, req.userId);
  if (!sitterID) return send(res, 403, { error: 'Minder profile not found' });

  const minderServiceID = req.params.id;
  const [[service]] = await db.query(
    'SELECT minderServiceID, sitterID FROM MINDER_SERVICE WHERE minderServiceID = ?',
    [minderServiceID]
  );
  if (!service) return notFound(send, res, 'Service not found');
  if (service.sitterID !== sitterID) {
    return send(res, 403, { error: 'Forbidden: sitterID does not match this service' });
  }

  const [result] = await db.query('DELETE FROM MINDER_SERVICE WHERE minderServiceID = ? AND sitterID = ?', [
    minderServiceID,
    sitterID,
  ]);
  if (!result.affectedRows) return notFound(send, res, 'Service not found');
  send(res, 200, { ok: true });
});

async function ensureCalendarForSitter(sitterID) {
  const [[existing]] = await db.query('SELECT calendarID FROM CALENDAR WHERE sitterID = ?', [sitterID]);
  if (existing) return existing.calendarID;
  const calendarID = uuid();
  await db.query('INSERT INTO CALENDAR (calendarID, sitterID) VALUES (?, ?)', [calendarID, sitterID]);
  return calendarID;
}

// POST /api/calendar
// Minder adds an available slot to their calendar.
// Auto-creates a CALENDAR row for the minder if one does not exist yet.
register('POST', '/api/calendar', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'minder')) return;

  const sitterID = await getSitterId(db, req.userId);
  if (!sitterID) return send(res, 403, { error: 'Minder profile not found' });

  const body = await req.parseBody();
  // Example: { startTime: '2026-06-01 09:00:00', endTime: '2026-06-01 10:00:00' }
  const { startTime, endTime } = body;
  if (!startTime || !endTime) return badRequest(send, res, 'startTime and endTime are required');

  const calendarID = await ensureCalendarForSitter(sitterID);
  const slotID = uuid();
  await db.query('INSERT INTO SLOT (slotID, calendarID, startTime, endTime, isBooked) VALUES (?, ?, ?, ?, ?)', [
    slotID,
    calendarID,
    startTime,
    endTime,
    false,
  ]);
  const [[row]] = await db.query('SELECT * FROM SLOT WHERE slotID = ?', [slotID]);
  send(res, 201, row);
});

// DELETE /api/calendar/:id
// Minder removes an available slot (only if it has not been booked yet).
register('DELETE', '/api/calendar/:id', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'minder')) return;

  const sitterID = await getSitterId(db, req.userId);
  if (!sitterID) return send(res, 403, { error: 'Minder profile not found' });

  const slotID = req.params.id;
  const [result] = await db.query(
    `DELETE S FROM SLOT S
     JOIN CALENDAR C ON C.calendarID = S.calendarID
     WHERE S.slotID = ? AND C.sitterID = ? AND S.isBooked = FALSE`,
    [slotID, sitterID]
  );
  if (!result.affectedRows) return notFound(send, res, 'Slot not found (or already booked)');
  send(res, 200, { ok: true });
});

// GET /api/minders/:id  (most complex — 4 queries combined)
// Returns the full public profile of a minder:
//   - Basic info (bio, experience, ratings)
//   - Services offered (with service type details)
//   - Available (unbooked) slots
//   - Reviews left by owners
register('GET', '/api/minders/:id', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, ['owner', 'minder'])) return;

  const sitterID = req.params.id;
  const [[profile]] = await db.query(
    `SELECT
       M.sitterID, M.userID, M.bio, M.experienceYears, M.ratingAvg, M.overallRating,
       M.medicationQualified, M.serviceAreaPostcode,
       P.firstName, P.lastName, P.city, P.postcode
     FROM PET_MINDER M
     JOIN USER_PROFILE P ON P.userID = M.userID
     WHERE M.userID = ?`,
    [sitterID]
  );
  if (!profile) return notFound(send, res, 'Minder not found');

  const [services] = await db.query(
    `SELECT MS.minderServiceID, MS.serviceTypeID, ST.name, ST.description, ST.basePrice, MS.customPrice, MS.isActive
     FROM MINDER_SERVICE MS
     JOIN SERVICE_TYPE ST ON ST.serviceTypeID = MS.serviceTypeID
     WHERE MS.sitterID = ?
     ORDER BY ST.name`,
    [sitterID]
  );

  const [[calendar]] = await db.query('SELECT calendarID, timeZone FROM CALENDAR WHERE sitterID = ?', [sitterID]);
  const [slots] = calendar
    ? await db.query(
        'SELECT slotID, startTime, endTime, isBooked FROM SLOT WHERE calendarID = ? ORDER BY startTime',
        [calendar.calendarID]
      )
    : [[], []];

  const [reviews] = await db.query(
    `SELECT R.reviewID, R.bookingID, R.reviewerUserID, R.rating, R.comment, R.createdAt
     FROM REVIEW R
     JOIN BOOKING B ON B.bookingID = R.bookingID
     WHERE B.sitterID = ?
     ORDER BY R.createdAt DESC`,
    [sitterID]
  );

  send(res, 200, { ...profile, services, calendar: calendar || null, slots, reviews });
});
