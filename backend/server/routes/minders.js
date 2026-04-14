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


function toMySqlDateTime(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

// ─── Minder routes ───────────────────────────────────────────────────────

// GET /api/minders
register('GET', '/api/minders', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'owner')) return;

  const { postcode, medication, serviceTypeID, location } = req.query;

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

  if (location) {
    conditions.push(
      '(LOWER(p.city) LIKE LOWER(?) OR LOWER(p.postcode) LIKE LOWER(?) OR LOWER(m.serviceAreaPostcode) LIKE LOWER(?))'
    );
    const pattern = `%${String(location).trim()}%`;
    params.push(pattern, pattern, pattern);
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

// GET /api/minders/me
register('GET', '/api/minders/me', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'minder')) return;

  const sitterID = await getSitterId(db, req.userId);
  if (!sitterID) return send(res, 404, { error: 'Minder profile not found' });

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

  if (!profile) return send(res, 404, { error: 'Minder profile not found' });
  send(res, 200, profile);
});

// PATCH /api/minders/:id
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

// POST /api/services
register('POST', '/api/services', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'minder')) return;

  const sitterID = await getSitterId(db, req.userId);
  if (!sitterID) return send(res, 403, { error: 'Minder profile not found' });

  const body = await req.parseBody();
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

  const body = await req.parseBody();
  const fields = ['customPrice', 'isActive', 'duration', 'description'];
  const sets = [];
  const params = [];

  for (const f of fields) {
    if (Object.prototype.hasOwnProperty.call(body, f)) {
      sets.push(`${f} = ?`);
      if (f === 'isActive') params.push(!!body[f]);
      else if (f === 'description') params.push(body[f] == null ? null : String(body[f]));
      else if (f === 'duration') params.push(body[f] == null ? null : String(body[f]));
      else params.push(body[f]);
    }
  }

  if (!sets.length) return badRequest(send, res, 'No updatable fields provided');

  params.push(minderServiceID, sitterID);
  await db.query(
    `UPDATE MINDER_SERVICE SET ${sets.join(', ')} WHERE minderServiceID = ? AND sitterID = ?`,
    params
  );

  const [[row]] = await db.query('SELECT * FROM MINDER_SERVICE WHERE minderServiceID = ?', [minderServiceID]);
  send(res, 200, row);
});

// GET /api/minders/me/pet-types
register('GET', '/api/minders/me/pet-types', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'minder')) return;

  const sitterID = await getSitterId(db, req.userId);
  if (!sitterID) return send(res, 403, { error: 'Minder profile not found' });

  const [rows] = await db.query(
    'SELECT petType FROM MINDER_PET_TYPE WHERE sitterID = ? ORDER BY petType',
    [sitterID]
  );

  send(res, 200, rows.map((r) => r.petType));
});

// PUT /api/minders/me/pet-types
register('PUT', '/api/minders/me/pet-types', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'minder')) return;

  const sitterID = await getSitterId(db, req.userId);
  if (!sitterID) return send(res, 403, { error: 'Minder profile not found' });

  const body = await req.parseBody();
  const petTypes = body?.petTypes;

  if (!Array.isArray(petTypes)) {
    return badRequest(send, res, 'petTypes must be an array of strings');
  }

  const normalized = [...new Set(petTypes.map((t) => String(t || '').trim()).filter(Boolean))];

  await db.query('DELETE FROM MINDER_PET_TYPE WHERE sitterID = ?', [sitterID]);

  for (const petType of normalized) {
    await db.query(
      'INSERT INTO MINDER_PET_TYPE (minderPetTypeID, sitterID, petType) VALUES (?, ?, ?)',
      [uuid(), sitterID, petType]
    );
  }

  send(res, 200, normalized);
});

// DELETE /api/services/:id
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

  const [result] = await db.query(
    'DELETE FROM MINDER_SERVICE WHERE minderServiceID = ? AND sitterID = ?',
    [minderServiceID, sitterID]
  );

  if (!result.affectedRows) return notFound(send, res, 'Service not found');
  send(res, 200, { ok: true });
});

async function ensureCalendarForSitter(sitterID) {
  const calendarID = uuid();
  await db.query(
    'INSERT IGNORE INTO CALENDAR (calendarID, sitterID) VALUES (?, ?)',
    [calendarID, sitterID]
  );
  const [[row]] = await db.query(
    'SELECT calendarID FROM CALENDAR WHERE sitterID = ?',
    [sitterID]
  );
  return row.calendarID;
}

// GET /api/calendar
register('GET', '/api/calendar', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'minder')) return;

  const sitterID = await getSitterId(db, req.userId);
  if (!sitterID) return send(res, 403, { error: 'Minder profile not found' });

  const [[calendar]] = await db.query(
    'SELECT calendarID FROM CALENDAR WHERE sitterID = ?',
    [sitterID]
  );

  if (!calendar) {
    return send(res, 200, { calendar: null, slots: [] });
  }

  const [slots] = await db.query(
    `SELECT slotID, startTime, endTime, isBooked
     FROM SLOT
     WHERE calendarID = ?
     ORDER BY startTime`,
    [calendar.calendarID]
  );

  send(res, 200, {
    calendar,
    slots,
  });
});

// PUT /api/calendar
// Replaces all unbooked slots for this minder.
// Use this when the user keeps the same dates but changes only the time.
register('PUT', '/api/calendar', async (req, res, send) => {
  try {
    if (!requireUser(req, send, res)) return;
    if (!requireRole(req, send, res, 'minder')) return;

    const sitterID = await getSitterId(db, req.userId);
    if (!sitterID) return send(res, 403, { error: 'Minder profile not found' });

    const body = await req.parseBody();
    const { slots } = body;

    if (!Array.isArray(slots) || slots.length === 0) {
      return badRequest(send, res, 'slots array is required and must not be empty');
    }

    const normalizedSlots = [];

    for (const s of slots) {
      if (!s.startTime || !s.endTime) {
        return badRequest(send, res, 'Each slot must have startTime and endTime');
      }

      const start = new Date(s.startTime);
      const end = new Date(s.endTime);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return badRequest(send, res, 'Each slot must have valid startTime and endTime');
      }

      if (end <= start) {
        return badRequest(send, res, 'Each slot must have endTime after startTime');
      }

      const startTime = toMySqlDateTime(s.startTime);
      const endTime = toMySqlDateTime(s.endTime);

      if (!startTime || !endTime) {
        return badRequest(send, res, 'Each slot must have valid startTime and endTime');
      }

      normalizedSlots.push({ startTime, endTime });
    }

    const calendarID = await ensureCalendarForSitter(sitterID);

    await db.query(
      'DELETE FROM SLOT WHERE calendarID = ? AND isBooked = FALSE',
      [calendarID]
    );

    const created = [];
    for (const s of normalizedSlots) {
      const slotID = uuid();
      await db.query(
        'INSERT INTO SLOT (slotID, calendarID, startTime, endTime, isBooked) VALUES (?, ?, ?, ?, ?)',
        [slotID, calendarID, s.startTime, s.endTime, false]
      );
      created.push({
        slotID,
        calendarID,
        startTime: s.startTime,
        endTime: s.endTime,
        isBooked: false,
      });
    }

    send(res, 200, {
      ok: true,
      slots: created,
    });
  } catch (err) {
    console.error('PUT /api/calendar failed:', err);
    send(res, 500, { error: 'Internal server error' });
  }
});

// POST /api/calendar
register('POST', '/api/calendar', async (req, res, send) => {
  try {
    if (!requireUser(req, send, res)) return;
    if (!requireRole(req, send, res, 'minder')) return;

    const sitterID = await getSitterId(db, req.userId);
    if (!sitterID) return send(res, 403, { error: 'Minder profile not found' });

    const body = await req.parseBody();
    const { startTime, endTime } = body;

    if (!startTime || !endTime) {
      return badRequest(send, res, 'startTime and endTime are required');
    }

    if (new Date(endTime) <= new Date(startTime)) {
      return badRequest(send, res, 'endTime must be after startTime');
    }

    const calendarID = await ensureCalendarForSitter(sitterID);

    const slotID = uuid();
    await db.query(
      'INSERT INTO SLOT (slotID, calendarID, startTime, endTime, isBooked) VALUES (?, ?, ?, ?, ?)',
      [slotID, calendarID, startTime, endTime, false]
    );

    const [[row]] = await db.query('SELECT * FROM SLOT WHERE slotID = ?', [slotID]);
    send(res, 201, row);
  } catch (err) {
    console.error('POST /api/calendar failed:', err);
    send(res, 500, { error: 'Internal server error' });
  }
});

// DELETE /api/calendar/:id
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

// GET /api/minders/:id/slots
register('GET', '/api/minders/:id/slots', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'owner')) return;

  const sitterID = req.params.id;
  const [[calendar]] = await db.query(
    'SELECT calendarID FROM CALENDAR WHERE sitterID = ?',
    [sitterID]
  );

  if (!calendar) return send(res, 200, []);

  const [slots] = await db.query(
    `SELECT slotID, startTime, endTime
     FROM SLOT
     WHERE calendarID = ? AND isBooked = FALSE
     ORDER BY startTime`,
    [calendar.calendarID]
  );

  send(res, 200, slots);
});

// GET /api/minders/:id
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
     WHERE M.sitterID = ?`,
    [sitterID]
  );

  if (!profile) return notFound(send, res, 'Minder not found');

  const [services] = await db.query(
    `SELECT
       MS.minderServiceID, MS.serviceTypeID, ST.name, ST.description AS serviceTypeDescription,
       ST.basePrice, MS.customPrice, MS.isActive,
       MS.duration, MS.description
     FROM MINDER_SERVICE MS
     JOIN SERVICE_TYPE ST ON ST.serviceTypeID = MS.serviceTypeID
     WHERE MS.sitterID = ?
     ORDER BY ST.name`,
    [sitterID]
  );

  const [[calendar]] = await db.query(
    'SELECT calendarID, timeZone FROM CALENDAR WHERE sitterID = ?',
    [sitterID]
  );

  const [slots] = calendar
    ? await db.query(
        'SELECT slotID, startTime, endTime, isBooked FROM SLOT WHERE calendarID = ? ORDER BY startTime',
        [calendar.calendarID]
      )
    : [[], []];

  const [reviews] = await db.query(
    `SELECT
       R.reviewID, R.bookingID, R.reviewerUserID, R.rating, R.comment, R.createdAt,
       CONCAT(P.firstName, ' ', P.lastName) AS reviewerName
     FROM REVIEW R
     JOIN BOOKING B  ON B.bookingID  = R.bookingID
     JOIN USER_PROFILE P ON P.userID = R.reviewerUserID
     WHERE B.sitterID = ?
     ORDER BY R.createdAt DESC`,
    [sitterID]
  );

  send(res, 200, {
    ...profile,
    services,
    calendar: calendar || null,
    slots,
    reviews,
  });
});