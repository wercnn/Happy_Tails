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

function normalizeSlotInput(slot) {
  if (!slot?.startTime || !slot?.endTime) return null;

  const start = new Date(slot.startTime);
  const end = new Date(slot.endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  if (end <= start) return null;

  const startTime = toMySqlDateTime(slot.startTime);
  const endTime = toMySqlDateTime(slot.endTime);

  if (!startTime || !endTime) return null;

  return { startTime, endTime };
}

function slotKey(startTime, endTime) {
  return `${startTime}|${endTime}`;
}

function normalizePetTypes(petTypes) {
  if (!Array.isArray(petTypes)) return [];
  return [...new Set(
    petTypes
      .map((t) => String(t || '').trim())
      .filter(Boolean)
  )];
}

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

async function getServicePetTypes(minderServiceID) {
  const [rows] = await db.query(
    `
    SELECT petType
    FROM MINDER_SERVICE_PET_TYPE
    WHERE minderServiceID = ?
    ORDER BY petType
    `,
    [minderServiceID]
  );

  return rows.map((row) => row.petType);
}

async function setServicePetTypes(minderServiceID, petTypes) {
  const normalized = normalizePetTypes(petTypes);

  await db.query(
    'DELETE FROM MINDER_SERVICE_PET_TYPE WHERE minderServiceID = ?',
    [minderServiceID]
  );

  for (const petType of normalized) {
    await db.query(
      `
      INSERT INTO MINDER_SERVICE_PET_TYPE
        (minderServicePetTypeID, minderServiceID, petType)
      VALUES (?, ?, ?)
      `,
      [uuid(), minderServiceID, petType]
    );
  }

  return normalized;
}

/*
  IMPORTANT:
  This file assumes SLOT has:
    isActive TINYINT(1) NOT NULL DEFAULT 1

  Active availability means:
  - slot belongs to sitter calendar
  - slot.isActive = TRUE
  - slot is not tied to any booking with status pending/accepted/completed

  Cancelled/rejected historical slot rows may remain in DB for booking history,
  but they should be hidden from current availability by setting isActive = FALSE.
*/
async function getActiveAvailabilitySlots(calendarID) {
  const [rows] = await db.query(
    `
    SELECT
      S.slotID,
      S.calendarID,
      S.startTime,
      S.endTime,
      S.isBooked,
      S.isActive
    FROM SLOT S
    WHERE S.calendarID = ?
      AND S.isActive = TRUE
      AND NOT EXISTS (
        SELECT 1
        FROM BOOKING B
        WHERE B.slotID = S.slotID
          AND B.status IN ('pending', 'accepted', 'completed')
      )
    ORDER BY S.startTime
    `,
    [calendarID]
  );

  return rows;
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
  const { serviceTypeID, customPrice, isActive, duration, description, selectedPetTypes } = body;

  if (!serviceTypeID || customPrice == null) {
    return badRequest(send, res, 'serviceTypeID and customPrice are required');
  }

  const normalizedPetTypes = normalizePetTypes(selectedPetTypes);
  if (normalizedPetTypes.length === 0) {
    return badRequest(send, res, 'selectedPetTypes must contain at least one pet type');
  }

  const [[existing]] = await db.query(
    `
    SELECT minderServiceID
    FROM MINDER_SERVICE
    WHERE sitterID = ? AND serviceTypeID = ?
    LIMIT 1
    `,
    [sitterID, serviceTypeID]
  );

  if (existing) {
    return send(res, 409, { error: 'You already added this service.' });
  }

  const minderServiceID = uuid();

  await db.query(
    `
    INSERT INTO MINDER_SERVICE
      (minderServiceID, sitterID, serviceTypeID, customPrice, isActive, duration, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      minderServiceID,
      sitterID,
      serviceTypeID,
      customPrice,
      !!isActive,
      duration == null ? null : String(duration),
      description == null ? null : String(description),
    ]
  );

  await setServicePetTypes(minderServiceID, normalizedPetTypes);

  const [[row]] = await db.query(
    'SELECT * FROM MINDER_SERVICE WHERE minderServiceID = ?',
    [minderServiceID]
  );

  row.selectedPetTypes = await getServicePetTypes(minderServiceID);

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

  if (sets.length) {
    params.push(minderServiceID, sitterID);
    await db.query(
      `UPDATE MINDER_SERVICE SET ${sets.join(', ')} WHERE minderServiceID = ? AND sitterID = ?`,
      params
    );
  }

  if (Object.prototype.hasOwnProperty.call(body, 'selectedPetTypes')) {
    const normalizedPetTypes = normalizePetTypes(body.selectedPetTypes);
    if (normalizedPetTypes.length === 0) {
      return badRequest(send, res, 'selectedPetTypes must contain at least one pet type');
    }
    await setServicePetTypes(minderServiceID, normalizedPetTypes);
  }

  if (!sets.length && !Object.prototype.hasOwnProperty.call(body, 'selectedPetTypes')) {
    return badRequest(send, res, 'No updatable fields provided');
  }

  const [[row]] = await db.query(
    'SELECT * FROM MINDER_SERVICE WHERE minderServiceID = ?',
    [minderServiceID]
  );

  row.selectedPetTypes = await getServicePetTypes(minderServiceID);

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

  const slots = await getActiveAvailabilitySlots(calendar.calendarID);

  send(res, 200, {
    calendar,
    slots,
  });
});

// PUT /api/calendar
register('PUT', '/api/calendar', async (req, res, send) => {
  try {
    if (!requireUser(req, send, res)) return;
    if (!requireRole(req, send, res, 'minder')) return;

    const sitterID = await getSitterId(db, req.userId);
    if (!sitterID) return send(res, 403, { error: 'Minder profile not found' });

    const body = await req.parseBody();
    const slots = Array.isArray(body?.slots) ? body.slots : null;

    if (!slots) {
      return badRequest(send, res, 'slots must be an array');
    }

    const normalizedSlots = [];
    for (const slot of slots) {
      const normalized = normalizeSlotInput(slot);
      if (!normalized) {
        return badRequest(
          send,
          res,
          'Each slot must have valid startTime and endTime, and endTime must be after startTime'
        );
      }
      normalizedSlots.push(normalized);
    }

    const calendarID = await ensureCalendarForSitter(sitterID);

    const requestedMap = new Map(
      normalizedSlots.map((s) => [slotKey(s.startTime, s.endTime), s])
    );

    const [allCalendarSlots] = await db.query(
      `
      SELECT
        S.slotID,
        S.calendarID,
        S.startTime,
        S.endTime,
        S.isBooked,
        S.isActive,
        COUNT(B.bookingID) AS bookingRefCount,
        SUM(
          CASE
            WHEN B.status IN ('pending', 'accepted', 'completed') THEN 1
            ELSE 0
          END
        ) AS activeBookingRefCount
      FROM SLOT S
      LEFT JOIN BOOKING B ON B.slotID = S.slotID
      WHERE S.calendarID = ?
      GROUP BY S.slotID, S.calendarID, S.startTime, S.endTime, S.isBooked, S.isActive
      ORDER BY S.startTime
      `,
      [calendarID]
    );

    for (const existing of allCalendarSlots) {
      const key = slotKey(existing.startTime, existing.endTime);
      const wanted = requestedMap.has(key);
      const bookingRefCount = Number(existing.bookingRefCount || 0);
      const activeBookingRefCount = Number(existing.activeBookingRefCount || 0);

      if (wanted) continue;

      if (activeBookingRefCount > 0) continue;

      if (bookingRefCount > 0) {
        await db.query(
          'UPDATE SLOT SET isActive = FALSE, isBooked = FALSE WHERE slotID = ?',
          [existing.slotID]
        );
      } else {
        await db.query('DELETE FROM SLOT WHERE slotID = ?', [existing.slotID]);
      }
    }

    for (const slot of normalizedSlots) {
      const [matchingRows] = await db.query(
        `
        SELECT
          S.slotID,
          S.isActive,
          COUNT(B.bookingID) AS bookingRefCount
        FROM SLOT S
        LEFT JOIN BOOKING B ON B.slotID = S.slotID
        WHERE S.calendarID = ?
          AND S.startTime = ?
          AND S.endTime = ?
        GROUP BY S.slotID, S.isActive
        ORDER BY S.isActive DESC, S.startTime ASC
        `,
        [calendarID, slot.startTime, slot.endTime]
      );

      const activeMatch = matchingRows.find((row) => Number(row.isActive) === 1);
      if (activeMatch) continue;

      const inactiveReusable = matchingRows.find((row) => Number(row.bookingRefCount || 0) === 0);

      if (inactiveReusable) {
        await db.query(
          `UPDATE SLOT
           SET isActive = TRUE, isBooked = FALSE
           WHERE slotID = ?`,
          [inactiveReusable.slotID]
        );
        continue;
      }

      const slotID = uuid();
      await db.query(
        `INSERT INTO SLOT (slotID, calendarID, startTime, endTime, isBooked, isActive)
         VALUES (?, ?, ?, ?, FALSE, TRUE)`,
        [slotID, calendarID, slot.startTime, slot.endTime]
      );
    }

    const finalSlots = await getActiveAvailabilitySlots(calendarID);

    send(res, 200, {
      ok: true,
      slots: finalSlots,
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
    const normalized = normalizeSlotInput(body);

    if (!normalized) {
      return badRequest(
        send,
        res,
        'startTime and endTime are required, must be valid, and endTime must be after startTime'
      );
    }

    const calendarID = await ensureCalendarForSitter(sitterID);

    const [existing] = await db.query(
      `
      SELECT slotID, startTime, endTime, isBooked, isActive
      FROM SLOT
      WHERE calendarID = ?
        AND startTime = ?
        AND endTime = ?
      ORDER BY isActive DESC
      LIMIT 1
      `,
      [calendarID, normalized.startTime, normalized.endTime]
    );

    if (existing.length) {
      if (!existing[0].isActive) {
        await db.query(
          'UPDATE SLOT SET isActive = TRUE, isBooked = FALSE WHERE slotID = ?',
          [existing[0].slotID]
        );
      }

      const [[row]] = await db.query('SELECT * FROM SLOT WHERE slotID = ?', [existing[0].slotID]);
      return send(res, 200, row);
    }

    const slotID = uuid();
    await db.query(
      `INSERT INTO SLOT (slotID, calendarID, startTime, endTime, isBooked, isActive)
       VALUES (?, ?, ?, ?, FALSE, TRUE)`,
      [slotID, calendarID, normalized.startTime, normalized.endTime]
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

  const [[slotRow]] = await db.query(
    `
    SELECT
      S.slotID,
      S.isBooked,
      S.isActive,
      COUNT(B.bookingID) AS bookingRefCount,
      SUM(
        CASE
          WHEN B.status IN ('pending', 'accepted', 'completed') THEN 1
          ELSE 0
        END
      ) AS activeBookingRefCount
    FROM SLOT S
    JOIN CALENDAR C ON C.calendarID = S.calendarID
    LEFT JOIN BOOKING B ON B.slotID = S.slotID
    WHERE S.slotID = ?
      AND C.sitterID = ?
    GROUP BY S.slotID, S.isBooked, S.isActive
    `,
    [slotID, sitterID]
  );

  if (!slotRow) {
    return notFound(send, res, 'Slot not found');
  }

  if (Number(slotRow.activeBookingRefCount || 0) > 0) {
    return notFound(send, res, 'Slot not found (or linked to an active booking)');
  }

  if (Number(slotRow.bookingRefCount || 0) > 0) {
    await db.query(
      'UPDATE SLOT SET isActive = FALSE, isBooked = FALSE WHERE slotID = ?',
      [slotID]
    );
  } else {
    await db.query('DELETE FROM SLOT WHERE slotID = ?', [slotID]);
  }

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
    `
    SELECT S.slotID, S.startTime, S.endTime
    FROM SLOT S
    WHERE S.calendarID = ?
      AND S.isActive = TRUE
      AND NOT EXISTS (
        SELECT 1
        FROM BOOKING B
        WHERE B.slotID = S.slotID
          AND B.status IN ('pending', 'accepted', 'completed')
      )
    ORDER BY S.startTime
    `,
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

  for (const service of services) {
    service.selectedPetTypes = await getServicePetTypes(service.minderServiceID);
  }

  const [[calendar]] = await db.query(
    'SELECT calendarID, timeZone FROM CALENDAR WHERE sitterID = ?',
    [sitterID]
  );

  const slots = calendar
    ? await getActiveAvailabilitySlots(calendar.calendarID)
    : [];

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