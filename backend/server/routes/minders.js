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

// 8) GET /api/minders (Owner) — List all minders with optional filters
register('GET', '/api/minders', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'owner')) return;

  const { postcode, medicationQualified, minRating } = req.query || {};

  const where = [];
  const params = [];
  if (postcode) {
    where.push('M.serviceAreaPostcode = ?');
    params.push(postcode);
  }
  if (medicationQualified != null && medicationQualified !== '') {
    where.push('M.medicationQualified = ?');
    params.push(String(medicationQualified).toLowerCase() === 'true' ? 1 : 0);
  }
  if (minRating != null && minRating !== '') {
    where.push('M.ratingAvg >= ?');
    params.push(Number(minRating));
  }

  const sql = `
    SELECT
      M.sitterID, M.bio, M.experienceYears, M.ratingAvg, M.overallRating,
      M.medicationQualified, M.serviceAreaPostcode,
      P.firstName, P.lastName, P.city, P.postcode
    FROM PET_MINDER M
    JOIN USER_PROFILE P ON P.userID = M.userID
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY M.ratingAvg DESC, M.experienceYears DESC
  `;

  const [rows] = await db.query(sql, params);
  send(res, 200, rows);
});

// 9) GET /api/minders/:id (Owner) — Full profile — bio, services, slots, reviews
register('GET', '/api/minders/:id', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'owner')) return;

  const sitterID = req.params.id;
  const [[profile]] = await db.query(
    `SELECT
       M.sitterID, M.userID, M.bio, M.experienceYears, M.ratingAvg, M.overallRating,
       M.medicationQualified, M.serviceAreaPostcode,
       P.firstName, P.lastName, P.city, P.postcode
     FROM PET_MINDER M
     JOIN USER_PROFILE P ON P.userID = M.userID
     WHERE M.sitterID = ?`,
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

// 10) PATCH /api/minders/:id (Minder) — Update own bio and experience
register('PATCH', '/api/minders/:id', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'minder')) return;

  const sitterID = await getSitterId(db, req.userId);
  if (!sitterID) return send(res, 403, { error: 'Minder profile not found' });
  if (req.params.id !== sitterID) return send(res, 403, { error: 'Cannot edit another minder' });

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

// 11) POST /api/services (Minder) — create a service listing
register('POST', '/api/services', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'minder')) return;

  const sitterID = await getSitterId(db, req.userId);
  if (!sitterID) return send(res, 403, { error: 'Minder profile not found' });

  const body = await req.parseBody();
  const { serviceTypeID, customPrice, isActive = true } = body;
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

// 12) PATCH /api/services/:id (Minder) - Update a service
register('PATCH', '/api/services/:id', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'minder')) return;

  const sitterID = await getSitterId(db, req.userId);
  if (!sitterID) return send(res, 403, { error: 'Minder profile not found' });

  const minderServiceID = req.params.id;
  const [owned] = await db.query(
    'SELECT minderServiceID FROM MINDER_SERVICE WHERE minderServiceID = ? AND sitterID = ?',
    [minderServiceID, sitterID]
  );
  if (!owned.length) return notFound(send, res, 'Service not found');

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

// 13) DELETE /api/services/:id (Minder) - Delete a service
register('DELETE', '/api/services/:id', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'minder')) return;

  const sitterID = await getSitterId(db, req.userId);
  if (!sitterID) return send(res, 403, { error: 'Minder profile not found' });

  const minderServiceID = req.params.id;
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

// 14) POST /api/calendar (Minder) — add available slot
register('POST', '/api/calendar', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'minder')) return;

  const sitterID = await getSitterId(db, req.userId);
  if (!sitterID) return send(res, 403, { error: 'Minder profile not found' });

  const body = await req.parseBody();
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

// 15) DELETE /api/calendar/:id (Minder) — remove slot
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