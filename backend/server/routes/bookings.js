// server/routes/bookings.js
const { randomUUID } = require('crypto');
const { register } = require('../router');
const db = require('../db');

// helpers
async function getOwnerID(userID) {
  const [rows] = await db.query(
    'SELECT ownerID FROM PET_OWNER WHERE userID = ?',
    [userID]
  );
  return rows[0]?.ownerID;
}

async function getSitterID(userID) {
  const [rows] = await db.query(
    'SELECT sitterID FROM PET_MINDER WHERE userID = ?',
    [userID]
  );
  return rows[0]?.sitterID;
}


// ─────────────────────────────────────────────
// POST /api/bookings → create booking
// ─────────────────────────────────────────────
register('POST', '/api/bookings', async (req, res, send) => {
  if (!req.requireRole('Owner')) return;

  const userID = req.userId;
  const ownerID = await getOwnerID(userID);

  const { sitterID, petID, slotID, serviceTypeID, locationID, ownerNotes } = await req.parseBody();

  if (!sitterID || !petID || !slotID || !serviceTypeID || !locationID) {
    return send(res, 400, { error: 'Missing required fields' });
  }

  // get service base price
  const [[service]] = await db.query(
    'SELECT basePrice FROM SERVICE_TYPE WHERE serviceTypeID = ?',
    [serviceTypeID]
  );

  if (!service) return send(res, 404, { error: 'Service not found' });

  const totalCost = service.basePrice;

  const bookingID = randomUUID();

  await db.query(
    `INSERT INTO BOOKING 
    (bookingID, ownerID, sitterID, petID, slotID, serviceTypeID, locationID, totalCost, ownerNotes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [bookingID, ownerID, sitterID, petID, slotID, serviceTypeID, locationID, totalCost, ownerNotes || null]
  );

  send(res, 201, { bookingID, totalCost });
});


// ─────────────────────────────────────────────
// GET /api/bookings → list own bookings
// ─────────────────────────────────────────────
register('GET', '/api/bookings', async (req, res, send) => {
  const userID = req.userId;
  const role = req.userRole;

  let query = '';
  let param;

  if (role === 'Owner') {
    const ownerID = await getOwnerID(userID);
    query = 'SELECT * FROM BOOKING WHERE ownerID = ?';
    param = ownerID;
  } else if (role === 'Minder') {
    const sitterID = await getSitterID(userID);
    query = 'SELECT * FROM BOOKING WHERE sitterID = ?';
    param = sitterID;
  } else {
    return send(res, 403, { error: 'Unsupported role' });
  }

  const [rows] = await db.query(query, [param]);
  send(res, 200, rows);
});


// ─────────────────────────────────────────────
// GET /api/bookings/:id
// ─────────────────────────────────────────────
register('GET', '/api/bookings/:id', async (req, res, send) => {
  const bookingID = req.params.id;

  const [rows] = await db.query(
    'SELECT * FROM BOOKING WHERE bookingID = ?',
    [bookingID]
  );

  if (rows.length === 0) {
    return send(res, 404, { error: 'Booking not found' });
  }

  send(res, 200, rows[0]);
});


// ─────────────────────────────────────────────
// PATCH /api/bookings/:id/accept
// ─────────────────────────────────────────────
register('PATCH', '/api/bookings/:id/accept', async (req, res, send) => {
  if (!req.requireRole('Minder')) return;

  const bookingID = req.params.id;

  await db.query(
    'UPDATE BOOKING SET status = ? WHERE bookingID = ?',
    ['Accepted', bookingID]
  );

  send(res, 200, { message: 'Booking accepted' });
});


// ─────────────────────────────────────────────
// PATCH /api/bookings/:id/reject
// ─────────────────────────────────────────────
register('PATCH', '/api/bookings/:id/reject', async (req, res, send) => {
  if (!req.requireRole('Minder')) return;

  const bookingID = req.params.id;

  await db.query(
    'UPDATE BOOKING SET status = ? WHERE bookingID = ?',
    ['Rejected', bookingID]
  );

  send(res, 200, { message: 'Booking rejected' });
});


// ─────────────────────────────────────────────
// PATCH /api/bookings/:id/cancel
// ─────────────────────────────────────────────
register('PATCH', '/api/bookings/:id/cancel', async (req, res, send) => {
  if (!req.requireRole('Owner')) return;

  const bookingID = req.params.id;

  await db.query(
    'UPDATE BOOKING SET status = ? WHERE bookingID = ?',
    ['Cancelled', bookingID]
  );

  send(res, 200, { message: 'Booking cancelled' });
});