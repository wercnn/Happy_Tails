// server/routes/bookings.js
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
} = require('../lib/helpers');

// Helper to check if a booking can be accessed by the current user.
async function canAccessBooking(booking, ownerID, sitterID) {
  if (!booking) return false;
  if (ownerID && booking.ownerID === ownerID) return true;
  if (sitterID && booking.sitterID === sitterID) return true;
  return false;
}


// ─────────────────────────────────────────────
// POST /api/bookings → create booking
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// POST /api/bookings → create booking
// ─────────────────────────────────────────────
register('POST', '/api/bookings', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'owner')) return;

  const ownerID = await getOwnerId(db, req.userId);
  if (!ownerID) return send(res, 403, { error: 'Owner profile not found' });

  const body = await req.parseBody();
  const {
    sitterID,
    petID,
    slotID,
    serviceTypeID,
    location,
    ownerNotes,
    selectedTime,
  } = body;

  if (!sitterID || !petID || !slotID || !serviceTypeID || !location?.postcode || !location?.country) {
    return badRequest(
      send,
      res,
      'sitterID, petID, slotID, serviceTypeID, and location {postcode,country} are required'
    );
  }

  // Pet must belong to owner
  const [petRows] = await db.query(
    'SELECT petID FROM PET_PROFILE WHERE petID = ? AND ownerID = ?',
    [petID, ownerID]
  );
  if (!petRows.length) return send(res, 403, { error: 'Pet does not belong to owner' });

  // Slot must belong to sitter and be unbooked
  const [slotRows] = await db.query(
    `SELECT S.slotID, S.startTime, S.endTime, S.isBooked
     FROM SLOT S
     JOIN CALENDAR C ON C.calendarID = S.calendarID
     WHERE S.slotID = ? AND C.sitterID = ?`,
    [slotID, sitterID]
  );
  if (!slotRows.length) return notFound(send, res, 'Slot not found');
  if (slotRows[0].isBooked) return send(res, 409, { error: 'Slot already booked' });

  // Service price: use minder custom price if available; fallback to base price
  const [[serviceRow]] = await db.query(
    `SELECT
       COALESCE(MS.customPrice, ST.basePrice) AS price
     FROM SERVICE_TYPE ST
     LEFT JOIN MINDER_SERVICE MS
       ON MS.serviceTypeID = ST.serviceTypeID
      AND MS.sitterID = ?
      AND MS.isActive = TRUE
     WHERE ST.serviceTypeID = ?`,
    [sitterID, serviceTypeID]
  );
  if (!serviceRow) return notFound(send, res, 'Service type not found');

  const locationID = uuid();
  await db.query(
    'INSERT INTO LOCATION (locationID, postcode, street, city, county, country) VALUES (?, ?, ?, ?, ?, ?)',
    [
      locationID,
      location.postcode,
      location.street || null,
      location.city || null,
      location.county || null,
      location.country,
    ]
  );

  const bookingID = uuid();
  const startTime = slotRows[0].startTime;
  const endTime = slotRows[0].endTime;
  const totalCost = Number(serviceRow.price);

  await db.query(
    `INSERT INTO BOOKING
      (bookingID, ownerID, sitterID, petID, slotID, serviceTypeID, locationID, status, startTime, endTime, selectedTime, totalCost, ownerNotes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      bookingID,
      ownerID,
      sitterID,
      petID,
      slotID,
      serviceTypeID,
      locationID,
      'pending',
      startTime,
      endTime,
      selectedTime || null,
      totalCost,
      ownerNotes || null,
    ]
  );

  await db.query('UPDATE SLOT SET isBooked = TRUE WHERE slotID = ?', [slotID]);

  const [[booking]] = await db.query('SELECT * FROM BOOKING WHERE bookingID = ?', [bookingID]);
  send(res, 201, booking);
});



// ─────────────────────────────────────────────
// GET /api/bookings → list own bookings
// ─────────────────────────────────────────────
register('GET', '/api/bookings', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, ['owner', 'minder'])) return;

  const role = String(req.userRole || '').toLowerCase();

  if (role === 'owner') {
    const ownerID = await getOwnerId(db, req.userId);
    if (!ownerID) return send(res, 403, { error: 'Owner profile not found' });

    const [rows] = await db.query(
      `SELECT
         B.*,
         P.name AS petName,
         ST.name AS serviceName,
         MP.firstName AS minderFirstName,
         MP.lastName AS minderLastName,
         L.postcode,
         L.street,
         L.city,
         L.county,
         L.country
       FROM BOOKING B
       JOIN PET_PROFILE P
         ON P.petID = B.petID
       JOIN SERVICE_TYPE ST
         ON ST.serviceTypeID = B.serviceTypeID
       JOIN PET_MINDER M
         ON M.sitterID = B.sitterID
       JOIN USER_PROFILE MP
         ON MP.userID = M.userID
       LEFT JOIN LOCATION L
         ON L.locationID = B.locationID
       WHERE B.ownerID = ?
       ORDER BY B.createdAt DESC`,
      [ownerID]
    );

    return send(res, 200, rows);
  }

  if (role === 'minder') {
    const sitterID = await getSitterId(db, req.userId);
    if (!sitterID) return send(res, 403, { error: 'Minder profile not found' });

    const [rows] = await db.query(
      `SELECT
        B.*,
        P.name AS petName,
        ST.name AS serviceName,
        UP.firstName AS ownerFirstName,
        UP.lastName AS ownerLastName,
        L.postcode,
        L.street,
        L.city,
        L.county,
        L.country
      FROM BOOKING B
      JOIN PET_PROFILE P
        ON P.petID = B.petID
      JOIN SERVICE_TYPE ST
        ON ST.serviceTypeID = B.serviceTypeID
      JOIN PET_OWNER O
        ON O.ownerID = B.ownerID
      JOIN USER_PROFILE UP
        ON UP.userID = O.userID
      LEFT JOIN LOCATION L
        ON L.locationID = B.locationID
      WHERE B.sitterID = ?
      ORDER BY B.createdAt DESC`,
      [sitterID]
    );

    return send(res, 200, rows);
  }

  return send(res, 403, { error: 'Forbidden' });
});


// ─────────────────────────────────────────────
// GET /api/bookings/:id
// ─────────────────────────────────────────────
register('GET', '/api/bookings/:id', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, ['owner', 'minder'])) return;

  const role = String(req.userRole || '').toLowerCase();

  const bookingID = req.params.id;
  const [[booking]] = await db.query('SELECT * FROM BOOKING WHERE bookingID = ?', [bookingID]);
  if (!booking) return notFound(send, res, 'Booking not found');

  if (role === 'owner') {
    const ownerID = await getOwnerId(db, req.userId);
    if (!ownerID) return send(res, 403, { error: 'Owner profile not found' });
    if (booking.ownerID !== ownerID) return send(res, 403, { error: 'Forbidden' });
    return send(res, 200, booking);
  }

  if (role === 'minder') {
    const sitterID = await getSitterId(db, req.userId);
    if (!sitterID) return send(res, 403, { error: 'Minder profile not found' });
    if (booking.sitterID !== sitterID) return send(res, 403, { error: 'Forbidden' });
    return send(res, 200, booking);
  }

  return send(res, 403, { error: 'Forbidden' });
});


// ─────────────────────────────────────────────
// PATCH /api/bookings/:id/accept
// ─────────────────────────────────────────────
register('PATCH', '/api/bookings/:id/accept', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'minder')) return;

  const sitterID = await getSitterId(db, req.userId);
  if (!sitterID) return send(res, 403, { error: 'Minder profile not found' });

  const bookingID = req.params.id;
  const [[booking]] = await db.query('SELECT * FROM BOOKING WHERE bookingID = ?', [bookingID]);
  if (!booking) return notFound(send, res, 'Booking not found');
  if (booking.sitterID !== sitterID) return send(res, 403, { error: 'Forbidden' });
  if (String(booking.status).toLowerCase() !== 'pending') return send(res, 409, { error: 'Booking not pending' });

  await db.query('UPDATE BOOKING SET status = ? WHERE bookingID = ?', ['accepted', bookingID]);
  const [[updated]] = await db.query('SELECT * FROM BOOKING WHERE bookingID = ?', [bookingID]);
  send(res, 200, updated);
});


// ─────────────────────────────────────────────
// PATCH /api/bookings/:id/reject
// ─────────────────────────────────────────────
register('PATCH', '/api/bookings/:id/reject', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'minder')) return;

  const sitterID = await getSitterId(db, req.userId);
  if (!sitterID) return send(res, 403, { error: 'Minder profile not found' });

  const bookingID = req.params.id;
  const [[booking]] = await db.query('SELECT * FROM BOOKING WHERE bookingID = ?', [bookingID]);
  if (!booking) return notFound(send, res, 'Booking not found');
  if (booking.sitterID !== sitterID) return send(res, 403, { error: 'Forbidden' });
  if (String(booking.status).toLowerCase() !== 'pending') return send(res, 409, { error: 'Booking not pending' });

  await db.query('UPDATE BOOKING SET status = ? WHERE bookingID = ?', ['rejected', bookingID]);
  await db.query('UPDATE SLOT SET isBooked = FALSE WHERE slotID = ?', [booking.slotID]);

  const [[updated]] = await db.query('SELECT * FROM BOOKING WHERE bookingID = ?', [bookingID]);
  send(res, 200, updated);
});


// ─────────────────────────────────────────────
// PATCH /api/bookings/:id/cancel
// ─────────────────────────────────────────────
register('PATCH', '/api/bookings/:id/cancel', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'owner')) return;

  const ownerID = await getOwnerId(db, req.userId);
  if (!ownerID) return send(res, 403, { error: 'Owner profile not found' });

  const bookingID = req.params.id;
  const [[booking]] = await db.query('SELECT * FROM BOOKING WHERE bookingID = ?', [bookingID]);
  if (!booking) return notFound(send, res, 'Booking not found');
  if (booking.ownerID !== ownerID) return send(res, 403, { error: 'Forbidden' });

  const body = await req.parseBody();
  // Example: { cancellationReason: 'Change of plans.' }
  const reason = body?.cancellationReason;

  const status = String(booking.status).toLowerCase();
  if (['completed', 'cancelled'].includes(status)) return send(res, 409, { error: 'Booking cannot be cancelled' });

  await db.query('UPDATE BOOKING SET status = ?, cancellationReason = ? WHERE bookingID = ?', [
    'cancelled',
    reason,
    bookingID,
  ]);
  await db.query('UPDATE SLOT SET isBooked = FALSE WHERE slotID = ?', [booking.slotID]);

  const [[updated]] = await db.query('SELECT * FROM BOOKING WHERE bookingID = ?', [bookingID]);
  send(res, 200, updated);
});