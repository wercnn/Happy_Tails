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

async function insertNotification(recipientUserID, title, body) {
  await db.query(
    `INSERT INTO NOTIFICATION (notificationID, recipientID, channel, title, body)
     VALUES (?, ?, 'in-app', ?, ?)`,
    [uuid(), recipientUserID, title, body]
  );
}

async function getMinderName(sitterID) {
  const [[row]] = await db.query(
    `SELECT UP.firstName, UP.lastName
     FROM PET_MINDER PM
     JOIN USER_PROFILE UP ON UP.userID = PM.userID
     WHERE PM.sitterID = ?`,
    [sitterID]
  );
  return row ? `${row.firstName} ${row.lastName}`.trim() : 'your minder';
}

async function getServiceName(serviceTypeID) {
  const [[row]] = await db.query('SELECT name FROM SERVICE_TYPE WHERE serviceTypeID = ?', [serviceTypeID]);
  return row?.name || serviceTypeID;
}

async function getUserIdForOwner(ownerID) {
  const [[row]] = await db.query(
    'SELECT userID FROM PET_OWNER WHERE ownerID = ?',
    [ownerID]
  );
  return row?.userID || null;
}

async function getUserIdForSitter(sitterID) {
  const [[row]] = await db.query(
    'SELECT userID FROM PET_MINDER WHERE sitterID = ?',
    [sitterID]
  );
  return row?.userID || null;
}

async function getOrCreateDirectConversation(userA, userB) {
  const [rows] = await db.query(
    `
    SELECT DISTINCT C.conversationID
    FROM CONVERSATION C
    JOIN MESSAGE M ON M.conversationID = C.conversationID
    WHERE C.bookingID IS NULL
      AND (
        (M.senderUserID = ? AND M.receiverUserID = ?)
        OR
        (M.senderUserID = ? AND M.receiverUserID = ?)
      )
    LIMIT 1
    `,
    [userA, userB, userB, userA]
  );

  if (rows.length) return rows[0].conversationID;

  const conversationID = uuid();
  await db.query(
    'INSERT INTO CONVERSATION (conversationID, bookingID) VALUES (?, NULL)',
    [conversationID]
  );

  return conversationID;
}

function toSafeDate(value) {
  if (!value) return null;
  const d = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatBookingDate(dateStr) {
  const d = toSafeDate(dateStr);
  if (!d) return null;

  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatBookingTime(dateStr) {
  const d = toSafeDate(dateStr);
  if (!d) return null;

  return d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function getDisplayTime(booking) {
  if (booking?.selectedTime && String(booking.selectedTime).trim()) {
    return String(booking.selectedTime).trim();
  }
  return formatBookingTime(booking?.startTime);
}

function getCreatedMinuteKey(createdAt) {
  const d = toSafeDate(createdAt);
  if (!d) return 'no-created-at';

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes()
  ).padStart(2, '0')}`;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

async function createGroupedBookingConfirmedMessage(bookings, acceptedByUserID) {
  if (!Array.isArray(bookings) || bookings.length === 0) return;

  const first = bookings[0];

  const [[serviceRow]] = await db.query(
    'SELECT name FROM SERVICE_TYPE WHERE serviceTypeID = ?',
    [first.serviceTypeID]
  );

  const [[petRow]] = await db.query(
    'SELECT name FROM PET_PROFILE WHERE petID = ?',
    [first.petID]
  );

  const ownerUserID = await getUserIdForOwner(first.ownerID);
  const sitterUserID = await getUserIdForSitter(first.sitterID);

  if (!ownerUserID || !sitterUserID) return;

  const [[ownerProfile]] = await db.query(
    'SELECT firstName, lastName FROM USER_PROFILE WHERE userID = ?',
    [ownerUserID]
  );

  const ownerName =
    [ownerProfile?.firstName, ownerProfile?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim() || 'Pet Owner';

  const receiverUserID =
    String(acceptedByUserID) === String(ownerUserID) ? sitterUserID : ownerUserID;

  const conversationID = await getOrCreateDirectConversation(ownerUserID, sitterUserID);

  const serviceLabel = serviceRow?.name || 'booking';
  const petName = petRow?.name || 'pet';

  const dateLabels = unique(bookings.map((b) => formatBookingDate(b.startTime)));
  const timeLabels = unique(bookings.map((b) => getDisplayTime(b)));

  const dateText = dateLabels.length === 1 ? dateLabels[0] : dateLabels.join(', ');
  const timeText = timeLabels.length === 1 ? timeLabels[0] : timeLabels.join(', ');

  const content =
    `[[SYSTEM_BOOKING_CONFIRMED]] Booking confirmed with ${ownerName} and ${petName} for ${serviceLabel}` +
    `${dateText ? ` on ${dateText}` : ''}` +
    `${timeText ? ` at ${timeText}` : ''}.`;

  const messageID = uuid();

  await db.query(
    `
    INSERT INTO MESSAGE
      (messageID, conversationID, senderUserID, receiverUserID, content, isRead)
    VALUES (?, ?, ?, ?, ?, FALSE)
    `,
    [messageID, conversationID, acceptedByUserID, receiverUserID, content]
  );
}

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

  const [petRows] = await db.query(
    'SELECT petID FROM PET_PROFILE WHERE petID = ? AND ownerID = ?',
    [petID, ownerID]
  );
  if (!petRows.length) return send(res, 403, { error: 'Pet does not belong to owner' });

  const [slotRows] = await db.query(
    `SELECT S.slotID, S.startTime, S.endTime, S.isBooked
     FROM SLOT S
     JOIN CALENDAR C ON C.calendarID = S.calendarID
     WHERE S.slotID = ? AND C.sitterID = ?`,
    [slotID, sitterID]
  );
  if (!slotRows.length) return notFound(send, res, 'Slot not found');
  if (slotRows[0].isBooked) return send(res, 409, { error: 'Slot already booked' });

  // Prevent double-booking against already accepted bookings (even if slot overlaps).
  const [overlapRows] = await db.query(
    `
    SELECT bookingID
    FROM BOOKING
    WHERE sitterID = ?
      AND status = 'accepted'
      AND NOT (endTime <= ? OR startTime >= ?)
    LIMIT 1
    `,
    [sitterID, slotRows[0].startTime, slotRows[0].endTime]
  );
  if (overlapRows.length) {
    return send(res, 409, { error: 'Selected time overlaps an existing confirmed booking' });
  }

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
        P.species AS petSpecies,
        P.breed AS petBreed,
        P.age AS petAge,
        P.routines AS petRoutines,
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

    for (const row of rows) {
      const [docs] = await db.query(
        `SELECT
          docID AS id,
          fileName AS name,
          fileURL AS url,
          description,
          uploadedAt
        FROM MEDICAL_DOCUMENT
        WHERE petID = ?
        ORDER BY uploadedAt DESC`,
        [row.petID]
      );

      row.medicalDocuments = docs;
    }

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

  if (String(booking.status).toLowerCase() !== 'pending') {
    return send(res, 409, { error: 'Booking not pending' });
  }

  const createdMinuteKey = getCreatedMinuteKey(booking.createdAt);

  const [relatedBookings] = await db.query(
    `
    SELECT *
    FROM BOOKING
    WHERE ownerID = ?
      AND sitterID = ?
      AND petID = ?
      AND serviceTypeID = ?
      AND COALESCE(ownerNotes, '') = COALESCE(?, '')
      AND status = 'pending'
    ORDER BY startTime ASC
    `,
    [
      booking.ownerID,
      booking.sitterID,
      booking.petID,
      booking.serviceTypeID,
      booking.ownerNotes || '',
    ]
  );

  const groupedBookings = relatedBookings.filter(
    (b) => getCreatedMinuteKey(b.createdAt) === createdMinuteKey
  );

  const bookingsToAccept = groupedBookings.length > 0 ? groupedBookings : [booking];
  const bookingIDsToAccept = bookingsToAccept.map((b) => b.bookingID);

  // Reject overlaps against already accepted bookings for this sitter.
  for (const b of bookingsToAccept) {
    const [conflicts] = await db.query(
      `
      SELECT bookingID
      FROM BOOKING
      WHERE sitterID = ?
        AND status = 'accepted'
        AND bookingID NOT IN (${bookingIDsToAccept.map(() => '?').join(',')})
        AND NOT (endTime <= ? OR startTime >= ?)
      LIMIT 1
      `,
      [sitterID, ...bookingIDsToAccept, b.startTime, b.endTime]
    );

    if (conflicts.length) {
      return send(res, 409, { error: 'Booking overlaps an existing confirmed booking' });
    }
  }

  // Lock slots for accepted bookings (prevents double-accept races).
  for (const b of bookingsToAccept) {
    const [result] = await db.query(
      'UPDATE SLOT SET isBooked = TRUE WHERE slotID = ? AND isBooked = FALSE',
      [b.slotID]
    );
    if (!result.affectedRows) {
      return send(res, 409, { error: 'Slot already booked' });
    }
  }

  await db.query(
    `UPDATE BOOKING SET status = 'accepted' WHERE bookingID IN (${bookingIDsToAccept
      .map(() => '?')
      .join(',')})`,
    bookingIDsToAccept
  );

  try {
    await createGroupedBookingConfirmedMessage(bookingsToAccept, req.userId);
  } catch (err) {
    console.error('Failed to create grouped booking confirmation chat message:', err);
  }

  try {
    const ownerUserID  = await getUserIdForOwner(booking.ownerID);
    const serviceName  = await getServiceName(booking.serviceTypeID);
    const minderName   = await getMinderName(sitterID);
    const startDate    = formatBookingDate(booking.startTime) || '';
    if (ownerUserID) {
      await insertNotification(
        ownerUserID,
        'Booking Accepted',
        `Your booking for ${serviceName}${startDate ? ` on ${startDate}` : ''} has been accepted by ${minderName}.`
      );
    }
  } catch (notifErr) {
    console.error('Failed to create acceptance notification:', notifErr.message);
  }

  const [updatedRows] = await db.query(
    `SELECT * FROM BOOKING WHERE bookingID IN (${bookingIDsToAccept
      .map(() => '?')
      .join(',')}) ORDER BY startTime ASC`,
    bookingIDsToAccept
  );

  send(res, 200, updatedRows);
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

  // Reject the whole grouped request (same grouping logic as accept).
  const createdMinuteKey = getCreatedMinuteKey(booking.createdAt);

  const [relatedBookings] = await db.query(
    `
    SELECT *
    FROM BOOKING
    WHERE ownerID = ?
      AND sitterID = ?
      AND petID = ?
      AND serviceTypeID = ?
      AND COALESCE(ownerNotes, '') = COALESCE(?, '')
      AND status = 'pending'
    ORDER BY startTime ASC
    `,
    [
      booking.ownerID,
      booking.sitterID,
      booking.petID,
      booking.serviceTypeID,
      booking.ownerNotes || '',
    ]
  );

  const groupedBookings = relatedBookings.filter(
    (b) => getCreatedMinuteKey(b.createdAt) === createdMinuteKey
  );

  const bookingsToReject = groupedBookings.length > 0 ? groupedBookings : [booking];
  const bookingIDsToReject = bookingsToReject.map((b) => b.bookingID);

  await db.query(
    `UPDATE BOOKING SET status = 'rejected' WHERE bookingID IN (${bookingIDsToReject
      .map(() => '?')
      .join(',')})`,
    bookingIDsToReject
  );

  // Ensure slots are not left booked from older flows.
  // Only clear if a slot is not used by any accepted booking.
  for (const b of bookingsToReject) {
    const [acceptedUsingSlot] = await db.query(
      `SELECT bookingID FROM BOOKING WHERE slotID = ? AND status = 'accepted' LIMIT 1`,
      [b.slotID]
    );
    if (!acceptedUsingSlot.length) {
      await db.query('UPDATE SLOT SET isBooked = FALSE WHERE slotID = ?', [b.slotID]);
    }
  }

  try {
    const ownerUserID = await getUserIdForOwner(booking.ownerID);
    const serviceName = await getServiceName(booking.serviceTypeID);
    const startDate   = formatBookingDate(booking.startTime) || '';
    if (ownerUserID) {
      await insertNotification(
        ownerUserID,
        'Booking Declined',
        `Unfortunately, your booking request for ${serviceName}${startDate ? ` on ${startDate}` : ''} was not accepted.`
      );
    }
  } catch (notifErr) {
    console.error('Failed to create rejection notification:', notifErr.message);
  }

  const [updatedRows] = await db.query(
    `SELECT * FROM BOOKING WHERE bookingID IN (${bookingIDsToReject
      .map(() => '?')
      .join(',')}) ORDER BY startTime ASC`,
    bookingIDsToReject
  );
  send(res, 200, updatedRows);
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
  // Free slot for accepted bookings, and also clean up legacy "book on pending" data safely.
  if (status === 'accepted' || status === 'pending') {
    const [acceptedUsingSlot] = await db.query(
      `SELECT bookingID FROM BOOKING WHERE slotID = ? AND status = 'accepted' LIMIT 1`,
      [booking.slotID]
    );
    if (!acceptedUsingSlot.length) {
      await db.query('UPDATE SLOT SET isBooked = FALSE WHERE slotID = ?', [booking.slotID]);
    }
  }

  const [[updated]] = await db.query('SELECT * FROM BOOKING WHERE bookingID = ?', [bookingID]);
  send(res, 200, updated);
});


// ─────────────────────────────────────────────
// POST /api/bookings/:id/meet-and-greet
// Owner creates a meet & greet for a booking.
// ─────────────────────────────────────────────
register('POST', '/api/bookings/:id/meet-and-greet', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'owner')) return;

  const ownerID = await getOwnerId(db, req.userId);
  if (!ownerID) return send(res, 403, { error: 'Owner profile not found' });

  const bookingID = req.params.id;
  const [[booking]] = await db.query('SELECT * FROM BOOKING WHERE bookingID = ?', [bookingID]);
  if (!booking) return notFound(send, res, 'Booking not found');
  if (booking.ownerID !== ownerID) return send(res, 403, { error: 'Forbidden' });

  const body = await req.parseBody();
  const { scheduledTime, isVirtual, meetingLinkOrLocation, note } = body;

  if (!scheduledTime) return send(res, 400, { error: 'scheduledTime is required' });

  const meetID = uuid();
  await db.query(
    `INSERT INTO MEET_AND_GREET (meetID, bookingID, scheduledTime, isVirtual, meetingLinkOrLocation, status)
     VALUES (?, ?, ?, ?, ?, 'Scheduled')`,
    [meetID, bookingID, scheduledTime, isVirtual ? 1 : 0, meetingLinkOrLocation || null]
  );

  if (note && String(note).trim()) {
    await db.query(
      `INSERT INTO MEET_AND_GREET_NOTE (noteID, meetID, content) VALUES (?, ?, ?)`,
      [uuid(), meetID, String(note).trim()]
    );
  }

  const [[row]] = await db.query('SELECT * FROM MEET_AND_GREET WHERE meetID = ?', [meetID]);
  send(res, 201, row);
});


// ─────────────────────────────────────────────
// PATCH /api/bookings/:id/complete
// Minder marks a booking as completed. Notifies the owner and prompts a review.
// ─────────────────────────────────────────────
register('PATCH', '/api/bookings/:id/complete', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'minder')) return;

  const sitterID = await getSitterId(db, req.userId);
  if (!sitterID) return send(res, 403, { error: 'Minder profile not found' });

  const bookingID = req.params.id;
  const [[booking]] = await db.query('SELECT * FROM BOOKING WHERE bookingID = ?', [bookingID]);
  if (!booking) return notFound(send, res, 'Booking not found');
  if (booking.sitterID !== sitterID) return send(res, 403, { error: 'Forbidden' });
  if (String(booking.status).toLowerCase() !== 'accepted') {
    return send(res, 409, { error: 'Only accepted bookings can be marked as complete' });
  }

  await db.query('UPDATE BOOKING SET status = ? WHERE bookingID = ?', ['completed', bookingID]);

  try {
    const ownerUserID = await getUserIdForOwner(booking.ownerID);
    const serviceName = await getServiceName(booking.serviceTypeID);
    const minderName  = await getMinderName(sitterID);
    const startDate   = formatBookingDate(booking.startTime) || '';
    if (ownerUserID) {
      await insertNotification(
        ownerUserID,
        'Visit Complete',
        `Your ${serviceName} session${startDate ? ` on ${startDate}` : ''} with ${minderName} has been completed.`
      );
      await insertNotification(
        ownerUserID,
        'Leave a Review',
        `How was your experience with ${minderName}? Share your feedback to help other pet owners.`
      );
    }
  } catch (notifErr) {
    console.error('Failed to create completion notifications:', notifErr.message);
  }

  const [[updated]] = await db.query('SELECT * FROM BOOKING WHERE bookingID = ?', [bookingID]);
  send(res, 200, updated);
});