const { register } = require('../router');
const db = require('../db');
const { randomUUID } = require('crypto');

// ─── Helper ─────────────────────────────────────────────────────────────────

// Look up the sitterID for the currently authenticated user.
// Returns null if the user is not a minder.
async function getSitterID(userID) {
  const [[row]] = await db.query(
    'SELECT sitterID FROM PET_MINDER WHERE userID = ?',
    [userID]
  );
  return row ? row.sitterID : null;
}

// ─── Minder routes ───────────────────────────────────────────────────────

// GET /api/minders
// List all active minders. Supports optional query filters:
//   ?postcode=  — filter by serviceAreaPostcode
//   ?medication=true  — only minders who are medication-qualified
//   ?serviceTypeID=   — only minders who offer that service type
register('GET', '/api/minders', async (req, res, send) => {
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
      p.city
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

  const [rows] = await db.query(query, params);
  send(res, 200, rows);
});

// PATCH /api/minders/:id
// Minder updates their own bio, experience, medication flag, or service area.
// Only the minder themselves can update their profile.
register('PATCH', '/api/minders/:id', async (req, res, send) => {
  if (!req.requireRole('minder')) return;

  const sitterID = req.params.id;
  const userID = req.headers['x-user-id'];

  // Ensure the minder owns this profile
  const [[minder]] = await db.query(
    'SELECT sitterID FROM PET_MINDER WHERE sitterID = ? AND userID = ?',
    [sitterID, userID]
  );
  if (!minder) {
    return send(res, 403, { error: 'You can only update your own profile' });
  }

  const body = await req.parseBody();
  const { bio, experienceYears, medicationQualified, serviceAreaPostcode } = body;

  const fields = [];
  const params = [];

  if (bio !== undefined)                 { fields.push('bio = ?');                  params.push(bio); }
  if (experienceYears !== undefined)     { fields.push('experienceYears = ?');       params.push(experienceYears); }
  if (medicationQualified !== undefined) { fields.push('medicationQualified = ?');   params.push(medicationQualified); }
  if (serviceAreaPostcode !== undefined) { fields.push('serviceAreaPostcode = ?');   params.push(serviceAreaPostcode); }

  if (fields.length === 0) {
    return send(res, 400, { error: 'No updatable fields provided' });
  }

  params.push(sitterID);
  await db.query(`UPDATE PET_MINDER SET ${fields.join(', ')} WHERE sitterID = ?`, params);

  send(res, 200, { message: 'Profile updated' });
});

// POST /api/services
// Minder creates a new service listing linking them to a service type.
register('POST', '/api/services', async (req, res, send) => {
  if (!req.requireRole('minder')) return;

  const userID = req.headers['x-user-id'];
  const sitterID = await getSitterID(userID);
  if (!sitterID) return send(res, 404, { error: 'Minder profile not found' });

  const body = await req.parseBody();
  const { serviceTypeID, customPrice } = body;

  if (!serviceTypeID || customPrice === undefined) {
    return send(res, 400, { error: 'serviceTypeID and customPrice are required' });
  }

  // Verify the service type exists
  const [[serviceType]] = await db.query(
    'SELECT serviceTypeID FROM SERVICE_TYPE WHERE serviceTypeID = ?',
    [serviceTypeID]
  );
  if (!serviceType) return send(res, 404, { error: 'Service type not found' });

  const minderServiceID = randomUUID();
  try {
    await db.query(
      'INSERT INTO MINDER_SERVICE (minderServiceID, sitterID, serviceTypeID, customPrice) VALUES (?, ?, ?, ?)',
      [minderServiceID, sitterID, serviceTypeID, customPrice]
    );
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return send(res, 409, { error: 'You already offer this service type' });
    }
    throw err;
  }

  send(res, 201, { minderServiceID, message: 'Service created' });
});

// PATCH /api/services/:id
// Minder updates the price or active status of one of their services.
register('PATCH', '/api/services/:id', async (req, res, send) => {
  if (!req.requireRole('minder')) return;

  const userID = req.headers['x-user-id'];
  const sitterID = await getSitterID(userID);
  if (!sitterID) return send(res, 404, { error: 'Minder profile not found' });

  const minderServiceID = req.params.id;

  // Ensure the minder owns this service
  const [[service]] = await db.query(
    'SELECT minderServiceID FROM MINDER_SERVICE WHERE minderServiceID = ? AND sitterID = ?',
    [minderServiceID, sitterID]
  );
  if (!service) return send(res, 403, { error: 'Service not found or not yours' });

  const body = await req.parseBody();
  const { customPrice, isActive } = body;

  const fields = [];
  const params = [];

  if (customPrice !== undefined) { fields.push('customPrice = ?'); params.push(customPrice); }
  if (isActive !== undefined)    { fields.push('isActive = ?');    params.push(isActive); }

  if (fields.length === 0) {
    return send(res, 400, { error: 'No updatable fields provided' });
  }

  params.push(minderServiceID);
  await db.query(`UPDATE MINDER_SERVICE SET ${fields.join(', ')} WHERE minderServiceID = ?`, params);

  send(res, 200, { message: 'Service updated' });
});

// DELETE /api/services/:id
// Minder removes one of their service listings.
register('DELETE', '/api/services/:id', async (req, res, send) => {
  if (!req.requireRole('minder')) return;

  const userID = req.headers['x-user-id'];
  const sitterID = await getSitterID(userID);
  if (!sitterID) return send(res, 404, { error: 'Minder profile not found' });

  const minderServiceID = req.params.id;

  const [result] = await db.query(
    'DELETE FROM MINDER_SERVICE WHERE minderServiceID = ? AND sitterID = ?',
    [minderServiceID, sitterID]
  );

  if (result.affectedRows === 0) {
    return send(res, 404, { error: 'Service not found or not yours' });
  }

  send(res, 200, { message: 'Service deleted' });
});

// POST /api/calendar
// Minder adds an available slot to their calendar.
// Auto-creates a CALENDAR row for the minder if one does not exist yet.
register('POST', '/api/calendar', async (req, res, send) => {
  if (!req.requireRole('minder')) return;

  const userID = req.headers['x-user-id'];
  const sitterID = await getSitterID(userID);
  if (!sitterID) return send(res, 404, { error: 'Minder profile not found' });

  const body = await req.parseBody();
  const { startTime, endTime, timeZone } = body;

  if (!startTime || !endTime) {
    return send(res, 400, { error: 'startTime and endTime are required' });
  }
  if (new Date(endTime) <= new Date(startTime)) {
    return send(res, 400, { error: 'endTime must be after startTime' });
  }

  // Get or create the minder's CALENDAR row
  let [[calendar]] = await db.query(
    'SELECT calendarID FROM CALENDAR WHERE sitterID = ?',
    [sitterID]
  );
  if (!calendar) {
    const calendarID = randomUUID();
    await db.query(
      'INSERT INTO CALENDAR (calendarID, sitterID, timeZone) VALUES (?, ?, ?)',
      [calendarID, sitterID, timeZone || 'UTC']
    );
    calendar = { calendarID };
  }

  const slotID = randomUUID();
  await db.query(
    'INSERT INTO SLOT (slotID, calendarID, startTime, endTime) VALUES (?, ?, ?, ?)',
    [slotID, calendar.calendarID, startTime, endTime]
  );

  send(res, 201, { slotID, message: 'Slot added' });
});

// DELETE /api/calendar/:id
// Minder removes an available slot (only if it has not been booked yet).
register('DELETE', '/api/calendar/:id', async (req, res, send) => {
  if (!req.requireRole('minder')) return;

  const userID = req.headers['x-user-id'];
  const sitterID = await getSitterID(userID);
  if (!sitterID) return send(res, 404, { error: 'Minder profile not found' });

  const slotID = req.params.id;

  // Verify the slot belongs to this minder and is not already booked
  const [[slot]] = await db.query(
    `SELECT s.slotID, s.isBooked
     FROM SLOT s
     JOIN CALENDAR c ON c.calendarID = s.calendarID
     WHERE s.slotID = ? AND c.sitterID = ?`,
    [slotID, sitterID]
  );

  if (!slot) return send(res, 404, { error: 'Slot not found or not yours' });
  if (slot.isBooked) return send(res, 409, { error: 'Cannot delete a slot that is already booked' });

  await db.query('DELETE FROM SLOT WHERE slotID = ?', [slotID]);

  send(res, 200, { message: 'Slot deleted' });
});

// GET /api/minders/:id  (most complex — 4 queries combined)
// Returns the full public profile of a minder:
//   - Basic info (bio, experience, ratings)
//   - Services offered (with service type details)
//   - Available (unbooked) slots
//   - Reviews left by owners
register('GET', '/api/minders/:id', async (req, res, send) => {
  const sitterID = req.params.id;

  // Query 1: minder bio + profile
  const [[profile]] = await db.query(
    `SELECT
       m.sitterID,
       m.bio,
       m.experienceYears,
       m.ratingAvg,
       m.overallRating,
       m.medicationQualified,
       m.serviceAreaPostcode,
       p.firstName,
       p.lastName,
       p.city
     FROM PET_MINDER m
     JOIN USER_PROFILE p ON p.userID = m.userID
     WHERE m.sitterID = ?`,
    [sitterID]
  );
  if (!profile) return send(res, 404, { error: 'Minder not found' });

  // Query 2: services offered
  const [services] = await db.query(
    `SELECT
       ms.minderServiceID,
       ms.customPrice,
       ms.isActive,
       st.serviceTypeID,
       st.name,
       st.description,
       st.duration,
       st.supportedPetTypes
     FROM MINDER_SERVICE ms
     JOIN SERVICE_TYPE st ON st.serviceTypeID = ms.serviceTypeID
     WHERE ms.sitterID = ? AND ms.isActive = TRUE`,
    [sitterID]
  );

  // Query 3: available (unbooked) slots
  const [slots] = await db.query(
    `SELECT s.slotID, s.startTime, s.endTime
     FROM SLOT s
     JOIN CALENDAR c ON c.calendarID = s.calendarID
     WHERE c.sitterID = ? AND s.isBooked = FALSE
     ORDER BY s.startTime ASC`,
    [sitterID]
  );

  // Query 4: reviews (most recent first)
  const [reviews] = await db.query(
    `SELECT
       r.reviewID,
       r.rating,
       r.comment,
       r.createdAt,
       p.firstName,
       p.lastName
     FROM REVIEW r
     JOIN BOOKING b ON b.bookingID = r.bookingID
     JOIN USER_PROFILE p ON p.userID = r.reviewerUserID
     WHERE b.sitterID = ?
     ORDER BY r.createdAt DESC`,
    [sitterID]
  );

  send(res, 200, { ...profile, services, slots, reviews });
});
